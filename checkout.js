const CART_KEY = "sichiCart";
const ITEM_PRICE = 40;
const PAYMENT_CONFIG = window.SICHI_PAYMENT_CONFIG || {};
const STRIPE_CHECKOUT_ENDPOINT = PAYMENT_CONFIG.stripeCheckoutEndpoint || "";
const STRIPE_PAYMENT_LINK = PAYMENT_CONFIG.stripePaymentLink || "";
const PAYMENT_CURRENCY = PAYMENT_CONFIG.currency || "usd";

const cartItems = document.querySelector("[data-checkout-items]");
const cartEmpty = document.querySelector("[data-cart-empty]");
const cartTotal = document.querySelector("[data-cart-total]");
const cartCount = document.querySelector("[data-cart-count]");
const clearCart = document.querySelector("[data-clear-cart]");
const checkoutForm = document.querySelector("[data-checkout-form]");
const submitRequest = document.querySelector("[data-submit-request]");
const threadToggle = document.querySelector("[data-thread-toggle]");
const threadSize = document.querySelector("[data-thread-size]");
const shippingTotal = document.querySelector("[data-shipping-total]");
const shippingLabel = document.querySelector("[data-shipping-label]");
const addressPreview = document.querySelector("[data-address-preview]");
const grandTotal = document.querySelector("[data-grand-total]");
const summaryBox = document.querySelector("[data-summary-box]");
const copySummary = document.querySelector("[data-copy-summary]");
const copyStatus = document.querySelector("[data-copy-status]");
const checkoutSteps = Array.from(document.querySelectorAll("[data-checkout-step]"));
const stepButtons = Array.from(document.querySelectorAll("[data-step-button]"));
const nextStepButtons = Array.from(document.querySelectorAll("[data-next-step]"));
const prevStepButtons = Array.from(document.querySelectorAll("[data-prev-step]"));
const finalActions = document.querySelector("[data-final-actions]");

let lastLiveSignature = "";
let activeStep = 0;

function showCheckoutStep(step) {
    activeStep = Math.min(Math.max(step, 0), checkoutSteps.length - 1);

    checkoutSteps.forEach((panel, index) => {
        panel.hidden = index !== activeStep;
    });

    stepButtons.forEach((button, index) => {
        button.classList.toggle("active", index === activeStep);
        button.setAttribute("aria-current", index === activeStep ? "step" : "false");
    });

    if (finalActions) {
        finalActions.hidden = activeStep !== checkoutSteps.length - 1;
    }

    updateRequestLink();
}

function getCart() {
    try {
        return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch (error) {
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    renderCart();
}

function cartItemCount(cart = getCart()) {
    return cart.reduce((total, item) => total + item.quantity, 0);
}

function updateCartCount(cart = getCart()) {
    if (!cartCount) return;
    const count = cartItemCount(cart);
    cartCount.textContent = count;
    cartCount.hidden = count === 0;
}

function itemPriceValue(item) {
    const parsedPrice = Number(String(item.price || "").replace(/[^0-9.]/g, ""));
    return Number.isFinite(parsedPrice) && parsedPrice > 0 ? parsedPrice : ITEM_PRICE;
}

function cartSubtotal(cart = getCart()) {
    return cart.reduce((total, item) => total + (item.quantity * itemPriceValue(item)), 0);
}

function formatMoney(value) {
    return `$${value.toFixed(value % 1 === 0 ? 0 : 2)}`;
}

function renderCart() {
    const cart = getCart();
    updateCartCount(cart);

    cartItems.innerHTML = cart.map((item, index) => `
        <article class="checkout-item">
            <img src="${item.image}" alt="${item.name}">
            <div>
                <span>${item.label}</span>
                <strong>${item.name}</strong>
                <small>${item.price || `$${ITEM_PRICE}`} each</small>
            </div>
            <div class="quantity-control" aria-label="Quantity for ${item.name}">
                <button type="button" data-quantity-index="${index}" data-quantity-delta="-1" aria-label="Decrease ${item.name}">
                    <i class="fa-solid fa-minus"></i>
                </button>
                <span>${item.quantity}</span>
                <button type="button" data-quantity-index="${index}" data-quantity-delta="1" aria-label="Increase ${item.name}">
                    <i class="fa-solid fa-plus"></i>
                </button>
            </div>
            <button class="remove-item" type="button" data-remove-cart="${index}" aria-label="Remove ${item.name}">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </article>
    `).join("");

    cartEmpty.hidden = cart.length > 0;
    cartTotal.textContent = formatMoney(cartSubtotal(cart));
    updateRequestLink();
}

function updateCartItem(index, delta) {
    const cart = getCart();
    cart[index].quantity += delta;
    const nextCart = cart.filter((item) => item.quantity > 0);
    saveCart(nextCart);
}

function removeCartItem(index) {
    const cart = getCart();
    cart.splice(index, 1);
    saveCart(cart);
}

function formValue(name) {
    return new FormData(checkoutForm).get(name) || "";
}

function getShippingAddress() {
    const line1 = String(formValue("address1")).trim();
    const line2 = String(formValue("address2")).trim();
    const city = String(formValue("city")).trim();
    const state = String(formValue("state")).trim();
    const zip = String(formValue("zip")).trim();
    const cityLine = [city, state, zip].filter(Boolean).join(", ");

    return [line1, line2, cityLine].filter(Boolean).join("\n") || "Not provided";
}

function getShippingEstimate(cart = getCart()) {
    const count = cartItemCount(cart);
    const shipmentCount = Math.max(1, count);
    const speed = formValue("shippingSpeed") || "cheapest";
    const packaging = formValue("packageType") || "small";
    const state = normalizeState(formValue("state"));
    const zip = String(formValue("zip")).trim();

    if (speed === "pickup") {
        return {
            amount: 0,
            method: "Local pickup / meetup",
            note: "Pickup selected. Shipping is estimated at $0."
        };
    }

    const west = ["AK", "AZ", "CA", "CO", "HI", "ID", "MT", "NV", "NM", "OR", "UT", "WA", "WY"];
    const central = ["AL", "AR", "IA", "IL", "IN", "KS", "KY", "LA", "MI", "MN", "MO", "MS", "ND", "NE", "OH", "OK", "SD", "TN", "TX", "WI"];
    const zoneSurcharge = west.includes(state) ? 0 : central.includes(state) ? 3 : state ? 6 : 2;
    const packageSurcharge = packaging === "fragile" ? 6 : packaging === "medium" ? 4 : 0;
    const extraItems = Math.max(0, shipmentCount - 1);

    const rates = {
        standard: {
            amount: Math.ceil(7 + (extraItems * 1.5) + packageSurcharge + zoneSurcharge),
            method: "Standard estimate"
        },
        ups: {
            amount: Math.ceil(11 + (extraItems * 2.25) + packageSurcharge + zoneSurcharge),
            method: "UPS Ground estimate"
        },
        expedited: {
            amount: Math.ceil(18 + (extraItems * 3.5) + packageSurcharge + zoneSurcharge),
            method: "Expedited estimate"
        }
    };

    const selected = speed === "cheapest"
        ? Object.values(rates).sort((a, b) => a.amount - b.amount)[0]
        : rates[speed] || rates.standard;
    const destination = zip || state ? ` for ${[zip, state].filter(Boolean).join(", ")}` : "";
    const cartNote = count ? "" : " Based on one small package until products are added.";

    return {
        ...selected,
        note: `${selected.method}${destination}. This is a storefront estimate until live carrier rates are connected.${cartNote}`
    };
}

function normalizeState(value) {
    const state = String(value || "").trim().toUpperCase();
    const states = {
        ALABAMA: "AL",
        ALASKA: "AK",
        ARIZONA: "AZ",
        ARKANSAS: "AR",
        CALIFORNIA: "CA",
        COLORADO: "CO",
        CONNECTICUT: "CT",
        DELAWARE: "DE",
        FLORIDA: "FL",
        GEORGIA: "GA",
        HAWAII: "HI",
        IDAHO: "ID",
        ILLINOIS: "IL",
        INDIANA: "IN",
        IOWA: "IA",
        KANSAS: "KS",
        KENTUCKY: "KY",
        LOUISIANA: "LA",
        MAINE: "ME",
        MARYLAND: "MD",
        MASSACHUSETTS: "MA",
        MICHIGAN: "MI",
        MINNESOTA: "MN",
        MISSISSIPPI: "MS",
        MISSOURI: "MO",
        MONTANA: "MT",
        NEBRASKA: "NE",
        NEVADA: "NV",
        "NEW HAMPSHIRE": "NH",
        "NEW JERSEY": "NJ",
        "NEW MEXICO": "NM",
        "NEW YORK": "NY",
        "NORTH CAROLINA": "NC",
        "NORTH DAKOTA": "ND",
        OHIO: "OH",
        OKLAHOMA: "OK",
        OREGON: "OR",
        PENNSYLVANIA: "PA",
        "RHODE ISLAND": "RI",
        "SOUTH CAROLINA": "SC",
        "SOUTH DAKOTA": "SD",
        TENNESSEE: "TN",
        TEXAS: "TX",
        UTAH: "UT",
        VERMONT: "VT",
        VIRGINIA: "VA",
        WASHINGTON: "WA",
        "WEST VIRGINIA": "WV",
        WISCONSIN: "WI",
        WYOMING: "WY"
    };

    return states[state] || state;
}

function buildOrderSummary() {
    const cart = getCart();
    const products = cart.length
        ? cart.map((item) => {
            const each = item.price || formatMoney(itemPriceValue(item));
            const lineTotal = formatMoney(item.quantity * itemPriceValue(item));
            return `${item.quantity}x ${item.name} (${item.label}) - ${each} each / ${lineTotal}`;
        }).join("\n")
        : "No products selected";

    const car = [
        formValue("year"),
        formValue("make"),
        formValue("model"),
        formValue("trim")
    ].filter(Boolean).join(" ");

    const shipping = getShippingEstimate(cart);
    const subtotal = cartSubtotal(cart);
    const threadKnown = formValue("knowsThread") ? "Yes" : "No / needs help";

    return [
        "Sichi Shop request",
        "",
        `Name: ${formValue("name")}`,
        `Contact: ${formValue("contact")}`,
        "",
        "Products:",
        products,
        "",
        `Product subtotal: ${formatMoney(subtotal)}`,
        `Shipping: ${formatMoney(shipping.amount)} (${shipping.method})`,
        `Estimated total: ${formatMoney(subtotal + shipping.amount)}`,
        "Shipping address:",
        getShippingAddress(),
        `Packaging: ${formValue("packageType") || "Small box / padded mailer"}`,
        "",
        "Car info:",
        `Vehicle: ${car || "Not provided"}`,
        `Transmission: ${formValue("transmission") || "Not provided"}`,
        `Shifter setup: ${formValue("shifter") || "Not provided"}`,
        "",
        "Thread / adapter info:",
        `Knows thread size: ${threadKnown}`,
        `Thread size: ${formValue("threadSize") || "Not provided"}`,
        `Adapter needed: ${formValue("adapter") || "Not sure"}`,
        "",
        "Extra notes:",
        formValue("notes") || "None"
    ].join("\n");
}

function buildCheckoutPayload() {
    const cart = getCart();
    const shipping = getShippingEstimate(cart);
    const subtotal = cartSubtotal(cart);

    return {
        provider: "stripe",
        currency: PAYMENT_CURRENCY,
        customer: {
            name: formValue("name"),
            contact: formValue("contact")
        },
        items: cart.map((item) => ({
            name: item.name,
            label: item.label,
            quantity: item.quantity,
            unitAmount: Math.round(itemPriceValue(item) * 100),
            unitPrice: itemPriceValue(item),
            image: item.image
        })),
        totals: {
            subtotal,
            shipping: shipping.amount,
            estimatedTotal: subtotal + shipping.amount
        },
        shipping: {
            address: getShippingAddress(),
            address1: formValue("address1"),
            address2: formValue("address2"),
            city: formValue("city"),
            state: formValue("state"),
            zip: formValue("zip"),
            speed: formValue("shippingSpeed") || "cheapest",
            method: shipping.method,
            amount: shipping.amount,
            packaging: formValue("packageType") || "small"
        },
        vehicle: {
            year: formValue("year"),
            make: formValue("make"),
            model: formValue("model"),
            trim: formValue("trim"),
            transmission: formValue("transmission"),
            shifter: formValue("shifter")
        },
        adapter: {
            knowsThread: Boolean(formValue("knowsThread")),
            threadSize: formValue("threadSize"),
            adapterNeeded: formValue("adapter")
        },
        notes: formValue("notes"),
        orderSummary: buildOrderSummary(),
        successUrl: `${window.location.origin}/checkout.html?stripe=success`,
        cancelUrl: window.location.href
    };
}

function getStripeFallbackUrl() {
    if (!STRIPE_PAYMENT_LINK) return "";
    const separator = STRIPE_PAYMENT_LINK.includes("?") ? "&" : "?";
    const reference = encodeURIComponent(`sichi-${Date.now()}`);

    return `${STRIPE_PAYMENT_LINK}${separator}client_reference_id=${reference}`;
}

function updateRequestLink() {
    const cart = getCart();
    const shipping = getShippingEstimate(cart);
    const subtotal = cartSubtotal(cart);

    if (shippingTotal) shippingTotal.textContent = formatMoney(shipping.amount);
    if (shippingLabel) shippingLabel.textContent = shipping.note;
    if (addressPreview) addressPreview.textContent = `Copyable address: ${getShippingAddress().replace(/\n/g, ", ")}`;
    if (grandTotal) grandTotal.textContent = formatMoney(subtotal + shipping.amount);
    if (summaryBox) summaryBox.value = buildOrderSummary();
    if (submitRequest) submitRequest.href = STRIPE_PAYMENT_LINK || "#stripe-checkout";
}

function liveSignature() {
    const cart = getCart().map((item) => `${item.name}:${item.quantity}`).join("|");
    const fields = new FormData(checkoutForm);
    return [
        cart,
        fields.get("address1"),
        fields.get("address2"),
        fields.get("city"),
        fields.get("state"),
        fields.get("zip"),
        fields.get("shippingSpeed"),
        fields.get("packageType")
    ].join("::");
}

function refreshEstimateIfNeeded() {
    const signature = liveSignature();
    if (signature === lastLiveSignature) return;

    lastLiveSignature = signature;
    updateRequestLink();
}

async function copyOrderSummary() {
    const summary = summaryBox.value || buildOrderSummary();

    try {
        await navigator.clipboard.writeText(summary);
        copyStatus.textContent = "Copied.";
    } catch (error) {
        summaryBox.focus();
        summaryBox.select();
        document.execCommand("copy");
        copyStatus.textContent = "Copied.";
    }

    window.setTimeout(() => {
        copyStatus.textContent = "";
    }, 2200);
}

async function openStripeCheckout() {
    await copyOrderSummary();

    if (copyStatus) {
        copyStatus.textContent = "Opening Stripe...";
    }

    if (STRIPE_CHECKOUT_ENDPOINT) {
        const response = await fetch(STRIPE_CHECKOUT_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(buildCheckoutPayload())
        });

        if (!response.ok) {
            throw new Error("Stripe checkout endpoint failed.");
        }

        const data = await response.json();
        const checkoutUrl = data.url || data.checkoutUrl || data.sessionUrl;

        if (!checkoutUrl) {
            throw new Error("Stripe checkout endpoint did not return a URL.");
        }

        window.location.href = checkoutUrl;
        return;
    }

    const fallbackUrl = getStripeFallbackUrl();
    if (fallbackUrl) {
        window.location.href = fallbackUrl;
        return;
    }

    if (copyStatus) {
        copyStatus.textContent = "Stripe link needed.";
    }
    window.alert("Stripe is ready in the code, but this site still needs your Stripe Payment Link or checkout endpoint in payment-config.js.");
}

cartItems.addEventListener("click", (event) => {
    const quantityButton = event.target.closest("[data-quantity-index]");
    const removeButton = event.target.closest("[data-remove-cart]");

    if (quantityButton) {
        updateCartItem(Number(quantityButton.dataset.quantityIndex), Number(quantityButton.dataset.quantityDelta));
    }

    if (removeButton) {
        removeCartItem(Number(removeButton.dataset.removeCart));
    }
});

clearCart.addEventListener("click", () => {
    saveCart([]);
});

checkoutForm.addEventListener("input", updateRequestLink);
checkoutForm.addEventListener("change", updateRequestLink);
checkoutForm.addEventListener("keyup", updateRequestLink);
checkoutForm.addEventListener("focusout", updateRequestLink);

copySummary.addEventListener("click", copyOrderSummary);

stepButtons.forEach((button) => {
    button.addEventListener("click", () => {
        showCheckoutStep(Number(button.dataset.stepButton));
    });
});

nextStepButtons.forEach((button) => {
    button.addEventListener("click", () => {
        showCheckoutStep(activeStep + 1);
    });
});

prevStepButtons.forEach((button) => {
    button.addEventListener("click", () => {
        showCheckoutStep(activeStep - 1);
    });
});

submitRequest.addEventListener("click", async (event) => {
    event.preventDefault();
    try {
        await openStripeCheckout();
    } catch (error) {
        console.error(error);
        if (copyStatus) {
            copyStatus.textContent = "Stripe checkout could not open.";
        }
        window.alert("Stripe checkout could not open. Your order note was copied, so you can still send it by DM.");
    }
});

threadToggle.addEventListener("change", () => {
    threadSize.disabled = !threadToggle.checked;
    if (!threadToggle.checked) {
        threadSize.value = "";
    }
    updateRequestLink();
});

threadSize.disabled = !threadToggle.checked;
showCheckoutStep(0);
renderCart();
refreshEstimateIfNeeded();
window.setTimeout(updateRequestLink, 150);
window.setTimeout(updateRequestLink, 600);
window.setTimeout(updateRequestLink, 1400);
window.setInterval(refreshEstimateIfNeeded, 700);
