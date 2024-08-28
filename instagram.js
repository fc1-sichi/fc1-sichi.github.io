document.addEventListener('DOMContentLoaded', () => {
    const embeds = [
        'https://www.instagram.com/p/C-i8tMERVxU/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==',
        'https://www.instagram.com/p/C2jBX8FOQyq/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==',
        'https://www.instagram.com/p/Cd1iCDqOpb7/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==',
        'https://www.instagram.com/p/C-Ql5dDp5aW/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==',
        'https://www.instagram.com/p/C-oJ0kvuJDH/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==',
        'https://www.instagram.com/p/C8aWP7pPq5Y/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==',
        'https://www.instagram.com/p/CtRuRShg69v/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==',
        'https://www.instagram.com/p/Cyb9SJAs1hD/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==',
        'https://www.instagram.com/p/C-9bJuNOsKa/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==',
        'https://www.instagram.com/p/C9YgXOoBx0z/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==',
        'https://www.instagram.com/p/C7RetwkAyiB/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==',
        'https://www.instagram.com/p/C_E6fClpQZo/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==',
        'https://www.instagram.com/p/C8R1Ew5A-SU/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==',
        'https://www.instagram.com/p/C4gIfVbrl5s/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==',
        'https://www.instagram.com/p/C-Jg-ITM2mT/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==',
        'https://www.instagram.com/p/C903Cj_tjNn/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==',
        'https://www.instagram.com/p/CkTcJGnLJcr/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==',
        'https://www.instagram.com/p/Cwp1kURSdTf/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==',
        'https://www.instagram.com/p/C5RaGcqvHAu/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==',
        'https://www.instagram.com/p/CQuKfrvJ-hK/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==',
        'https://www.instagram.com/p/C-eNJ_RMHvb/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==',
        'https://www.instagram.com/p/C-IiX1xPQSI/?utm_source=ig_web_copy_link&amp;igsh=MzRlODBiNWFlZA==',
        'https://www.instagram.com/p/C-MpsI0xktf/?utm_source=ig_web_copy_link&amp;igsh=MzRlODBiNWFlZA==',
        'https://www.instagram.com/p/C-rEtdNRB4u/?utm_source=ig_web_copy_link&amp;igsh=MzRlODBiNWFlZA==',
        'https://www.instagram.com/p/C84jBJyOzCV/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==',
        'https://www.instagram.com/p/C6WAcC9N-Hy/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==',
        'https://www.instagram.com/p/C6jWAJir_ju/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==',
        // Add more embed links as needed
    ];

    const container = document.getElementById('insta-placeholder');
    const paginationContainer = document.getElementById('pagination-controls');
    const itemsPerPage = 6;
    let currentPage = 1;

    function renderPage(page) {
        container.innerHTML = ''; // Clear the container for new content
        const start = (page - 1) * itemsPerPage;
        const end = Math.min(start + itemsPerPage, embeds.length);

        for (let i = start; i < end; i++) {
            const link = embeds[i];
            const postId = link.split('/p/')[1].split('/')[0];
            const iframe = document.createElement('iframe');
            iframe.src = `https://www.instagram.com/p/${postId}/embed`;
            iframe.width = '100%';
            iframe.height = '600'; // Adjust height as needed
            iframe.frameBorder = '0';
            iframe.allow = 'encrypted-media';
            iframe.classList.add('instagram-embed');
            container.appendChild(iframe);
        }
    }

    function createPagination() {
        paginationContainer.innerHTML = ''; // Clear existing pagination controls

        const pagination = document.createElement('div');
        pagination.classList.add('pagination');
        
        // Previous button
        const prevButton = document.createElement('button');
        prevButton.textContent = 'Previous';
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderPage(currentPage);
                updatePagination();
            }
        });
        pagination.appendChild(prevButton);
        
        // Page numbers
        const pageCount = Math.ceil(embeds.length / itemsPerPage);
        for (let i = 1; i <= pageCount; i++) {
            const pageButton = document.createElement('button');
            pageButton.textContent = i;
            pageButton.disabled = i === currentPage;
            pageButton.addEventListener('click', () => {
                currentPage = i;
                renderPage(currentPage);
                updatePagination();
            });
            pagination.appendChild(pageButton);
        }
        
        // Next button
        const nextButton = document.createElement('button');
        nextButton.textContent = 'Next';
        nextButton.disabled = currentPage === pageCount;
        nextButton.addEventListener('click', () => {
            if (currentPage < pageCount) {
                currentPage++;
                renderPage(currentPage);
                updatePagination();
            }
        });
        pagination.appendChild(nextButton);

        paginationContainer.appendChild(pagination);
    }

    function updatePagination() {
        const paginationButtons = document.querySelectorAll('.pagination button');
        paginationButtons.forEach(button => {
            if (button.textContent === 'Previous') {
                button.disabled = currentPage === 1;
            } else if (button.textContent === 'Next') {
                button.disabled = currentPage === Math.ceil(embeds.length / itemsPerPage);
            } else {
                button.disabled = button.textContent == currentPage;
            }
        });
    }

    renderPage(currentPage);
    createPagination();
});
