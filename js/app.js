// Initialize Supabase client
const supabaseClient = supabase;

// DOM Elements
const contentGrid = document.getElementById('content-grid');
const filterButtons = document.querySelectorAll('.filter-btn');
const searchInput = document.getElementById('search-input');

// Current filter state
let currentFilter = 'all';
let currentSearch = '';

// Intersection Observer for card animations
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('card-visible');
            cardObserver.unobserve(entry.target);
        }
    });
}, observerOptions);

// Create card element
function createCard(item) {
    const card = document.createElement('div');
    card.className = 'content-card card-hidden';
    
    card.innerHTML = `
        <div class="card-inner">
            <div class="card-front">
                <img src="${item.poster_url}" alt="${item.title}" loading="lazy">
                <div class="card-overlay">
                    <h3>${item.title}</h3>
                    <div class="card-meta">
                        <span class="card-type">${item.type}</span>
                        <span class="card-genre">${item.genre}</span>
                    </div>
                </div>
            </div>
            <div class="card-back">
                <h3>${item.title}</h3>
                <p class="card-description">${item.description}</p>
                <div class="card-meta">
                    <span class="card-type">${item.type}</span>
                    <span class="card-genre">${item.genre}</span>
                </div>
                <a href="${item.download_link}" class="download-btn" target="_blank">
                    <span class="material-icons">download</span>
                    Download
                </a>
            </div>
        </div>
    `;

    // Add click listener for card flip
    card.addEventListener('click', () => {
        card.classList.toggle('is-flipped');
    });

    return card;
}

// Fetch and display content
async function fetchContent() {
    showLoading();
    try {
        let query = supabaseClient
            .from('content')
            .select('*')
            .order('created_at', { ascending: false });

        // Apply type filter
        if (currentFilter !== 'all') {
            query = query.eq('type', currentFilter);
        }

        // Apply search filter
        if (currentSearch) {
            query = query.ilike('title', `%${currentSearch}%`);
        }

        const { data, error } = await query;

        if (error) throw error;

        contentGrid.innerHTML = '';
        hideLoading();

        if (data.length === 0) {
            contentGrid.innerHTML = `
                <div class="no-results">
                    <span class="material-icons">search_off</span>
                    <p>No content found</p>
                </div>
            `;
            return;
        }

        data.forEach((item, index) => {
            const card = createCard(item);
            // Add staggered animation delay
            card.style.animationDelay = `${index * 0.1}s`;
            contentGrid.appendChild(card);
            cardObserver.observe(card);
        });
    } catch (error) {
        console.error('Error fetching content:', error);
        hideLoading();
        showToast('Error loading content. Please try again.', 'error');
    }
}

// Filter content by type
filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Update active button
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        // Update filter and fetch content
        currentFilter = button.dataset.filter;
        
        // Add loading class before fetching
        contentGrid.classList.add('loading');
        setTimeout(() => {
            fetchContent();
        }, 300);
    });
});

// Search content
let searchTimeout;
searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    contentGrid.classList.add('loading');
    
    searchTimeout = setTimeout(() => {
        currentSearch = e.target.value.trim();
        fetchContent();
    }, 300);
});

// Toast message function
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Loading state
function showLoading() {
    contentGrid.innerHTML = `
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <p>Loading content...</p>
        </div>
    `;
    contentGrid.classList.add('loading');
}

function hideLoading() {
    contentGrid.classList.remove('loading');
}

// Add scroll to top button
const scrollTopButton = document.createElement('button');
scrollTopButton.className = 'scroll-top';
scrollTopButton.innerHTML = '<span class="material-icons">arrow_upward</span>';
document.body.appendChild(scrollTopButton);

// Show/hide scroll to top button
window.addEventListener('scroll', () => {
    if (window.pageYOffset > 500) {
        scrollTopButton.classList.add('visible');
    } else {
        scrollTopButton.classList.remove('visible');
    }
});

// Smooth scroll to top
scrollTopButton.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// Add touch feedback for mobile
document.addEventListener('touchstart', function() {}, true);

// Initial content load
fetchContent();
