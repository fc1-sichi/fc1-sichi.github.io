document.addEventListener("DOMContentLoaded", function() {
    fetch('/header.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('header-placeholder').innerHTML = data;
        })
        .catch(error => console.error('Error loading header:', error));
});

document.addEventListener("DOMContentLoaded", function() {
    fetch('/footer.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('footer-placeholder').innerHTML = data;
        })
        .catch(error => console.error('Error loading header:', error));
});

document.addEventListener("DOMContentLoaded", function() {
    fetch('/intro.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('intro-placeholder').innerHTML = data;
        })
        .catch(error => console.error('Error loading header:', error));
});

document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('.header');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) { // Adjust the scroll threshold as needed
            header.classList.add('transparent');
        } else {
            header.classList.remove('transparent');
        }
    });
});
