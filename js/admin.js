// DOM Elements
const movieSearchInput = document.getElementById('movie-search');
const searchBtn = document.getElementById('search-btn');
const contentForm = document.getElementById('content-form');
const contentItems = document.getElementById('content-items');
const posterPreview = document.getElementById('poster-preview');
const logoutBtn = document.getElementById('logout-btn');

// Form Elements
const titleInput = document.getElementById('title');
const typeSelect = document.getElementById('type');
const genreInput = document.getElementById('genre');
const descriptionInput = document.getElementById('description');
const posterUrlInput = document.getElementById('poster_url');
const downloadLinkInput = document.getElementById('download_link');

// OMDB API Key
const OMDB_API_KEY = 'caeba859';

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

// Handle logout
logoutBtn.addEventListener('click', async () => {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        // Clear session
        localStorage.removeItem('moviease-admin-session');
        
        // Redirect to login
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Logout error:', error);
        showToast('Error logging out. Please try again.', 'error');
    }
});

// Search OMDB for movie
searchBtn.addEventListener('click', async () => {
    const searchQuery = movieSearchInput.value.trim();
    if (!searchQuery) return;

    searchBtn.disabled = true;
    searchBtn.innerHTML = '<span class="material-icons">hourglass_empty</span> Searching...';

    try {
        const response = await fetch(`https://www.omdbapi.com/?t=${encodeURIComponent(searchQuery)}&apikey=${OMDB_API_KEY}`);
        const data = await response.json();

        if (data.Response === 'True') {
            // Fill form with movie data
            titleInput.value = data.Title;
            typeSelect.value = data.Type.toLowerCase();
            genreInput.value = data.Genre;
            descriptionInput.value = data.Plot;
            posterUrlInput.value = data.Poster !== 'N/A' ? data.Poster : '';
            
            // Show poster preview
            if (data.Poster && data.Poster !== 'N/A') {
                posterPreview.src = data.Poster;
                posterPreview.style.display = 'block';
            } else {
                posterPreview.style.display = 'none';
            }
            
            // Clear search input
            movieSearchInput.value = '';
            showToast('Movie details loaded successfully');
        } else {
            showToast('Movie not found! Please try another title.', 'error');
        }
    } catch (error) {
        console.error('Error searching OMDB:', error);
        showToast('Error searching movie. Please try again.', 'error');
    } finally {
        searchBtn.disabled = false;
        searchBtn.innerHTML = '<span class="material-icons">search</span> Search OMDB';
    }
});

// Preview poster when URL changes
posterUrlInput.addEventListener('input', () => {
    const url = posterUrlInput.value.trim();
    if (url) {
        posterPreview.src = url;
        posterPreview.style.display = 'block';
    } else {
        posterPreview.style.display = 'none';
    }
});

// Handle form submission
contentForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = contentForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="material-icons">hourglass_empty</span> Adding...';

    try {
        // Check authentication
        const session = localStorage.getItem('moviease-admin-session');
        if (!session) {
            throw new Error('Please login to add content');
        }

        // Validate form data
        const formData = {
            title: titleInput.value.trim(),
            type: typeSelect.value,
            genre: genreInput.value.trim(),
            description: descriptionInput.value.trim(),
            poster_url: posterUrlInput.value.trim(),
            download_link: downloadLinkInput.value.trim()
        };

        // Check if any required field is empty
        for (const [key, value] of Object.entries(formData)) {
            if (!value) {
                throw new Error(`${key.replace('_', ' ')} is required`);
            }
        }

        const { error } = await supabase
            .from('content')
            .insert([formData]);

        if (error) throw error;

        // Clear form
        contentForm.reset();
        posterPreview.style.display = 'none';
        showToast('Content added successfully!');
        
        // Refresh content list
        fetchContent();
    } catch (error) {
        console.error('Error adding content:', error);
        showToast(error.message || 'Error adding content. Please try again.', 'error');
        
        // Redirect to login if not authenticated
        if (error.message.includes('login')) {
            window.location.href = 'login.html';
        }
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span class="material-icons">add</span> Add Content';
    }
});

// Fetch and display content
async function fetchContent() {
    try {
        const { data, error } = await supabase
            .from('content')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        contentItems.innerHTML = data.map(item => `
            <div class="content-item">
                <img src="${item.poster_url}" alt="${item.title}" onerror="this.src='../images/no-poster.jpg'">
                <div class="content-info">
                    <h3>${item.title}</h3>
                    <div class="content-meta">
                        ${item.type.charAt(0).toUpperCase() + item.type.slice(1)} • ${item.genre}
                    </div>
                </div>
                <div class="content-actions">
                    <button class="edit-btn" onclick="editContent(${item.id})">
                        <span class="material-icons">edit</span> Edit
                    </button>
                    <button class="delete-btn" onclick="deleteContent(${item.id})">
                        <span class="material-icons">delete</span> Delete
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error fetching content:', error);
        showToast('Error loading content. Please refresh the page.', 'error');
    }
}

// Edit content
async function editContent(id) {
    try {
        // Check authentication
        const session = localStorage.getItem('moviease-admin-session');
        if (!session) {
            throw new Error('Please login to edit content');
        }

        const { data, error } = await supabase
            .from('content')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        // Fill form with content data
        titleInput.value = data.title;
        typeSelect.value = data.type;
        genreInput.value = data.genre;
        descriptionInput.value = data.description;
        posterUrlInput.value = data.poster_url;
        downloadLinkInput.value = data.download_link;

        // Show poster preview
        posterPreview.src = data.poster_url;
        posterPreview.style.display = 'block';

        // Scroll to form
        contentForm.scrollIntoView({ behavior: 'smooth' });
        showToast('Content loaded for editing');
    } catch (error) {
        console.error('Error editing content:', error);
        showToast(error.message || 'Error editing content. Please try again.', 'error');
        
        // Redirect to login if not authenticated
        if (error.message.includes('login')) {
            window.location.href = 'login.html';
        }
    }
}

// Delete content
async function deleteContent(id) {
    if (!confirm('Are you sure you want to delete this content?')) return;

    try {
        // Check authentication
        const session = localStorage.getItem('moviease-admin-session');
        if (!session) {
            throw new Error('Please login to delete content');
        }

        const { error } = await supabase
            .from('content')
            .delete()
            .eq('id', id);

        if (error) throw error;

        showToast('Content deleted successfully!');
        fetchContent();
    } catch (error) {
        console.error('Error deleting content:', error);
        showToast(error.message || 'Error deleting content. Please try again.', 'error');
        
        // Redirect to login if not authenticated
        if (error.message.includes('login')) {
            window.location.href = 'login.html';
        }
    }
}

// Initial content load
fetchContent();
