// ### IMPORTANT: Paste your Replit backend URL here ###
// ### Make sure to replace the placeholder with your real URL! ###
const BACKEND_URL = "https://a6d8181d-7a73-4a1c-aa8c-8ba79d7fe02e-00-o211iw2hku6j.spock.replit.dev/";

// Initialize the Telegram Web App object
const tg = window.Telegram.WebApp;
tg.ready();

// Get references to our HTML elements
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const resultsGrid = document.getElementById('results-grid');
const statusContainer = document.getElementById('status-container');
const statusText = document.getElementById('status-text');

// --- Event Listeners ---
searchForm.addEventListener('submit', handleSearch);

// --- Functions ---

async function handleSearch(event) {
    event.preventDefault(); // Prevent the form from reloading the page
    const query = searchInput.value.trim();
    if (!query) return;

    // Blur the input to hide the keyboard on mobile
    searchInput.blur();
    
    showStatus('loading', 'Searching for manga...');

    try {
        const response = await fetch(`${BACKEND_URL}/api/search?q=${encodeURIComponent(query)}`);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `Server responded with status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
            renderResults(data.results);
            hideStatus();
        } else {
            showStatus('message', 'No manga found for that query. Try another one! 🤔');
        }

    } catch (error) {
        console.error('Search failed:', error);
        showStatus('message', `Oops! An error occurred: ${error.message}`);
        // Show a haptic feedback to the user indicating an error
        tg.HapticFeedback.notificationOccurred('error');
    }
}

function renderResults(mangaList) {
    resultsGrid.innerHTML = ''; // Clear previous results

    mangaList.forEach(manga => {
        const cover = manga.md_covers?.[0]?.b2key;
        const coverUrl = cover ? `https://meo.comick.pictures/${cover}` : 'https://via.placeholder.com/150x225.png?text=No+Cover';
        
        const card = document.createElement('div');
        card.className = 'manga-card';
        // We'll add a click handler in the next step
        // card.onclick = () => selectManga(manga.hid); 

        card.innerHTML = `
            <img src="${coverUrl}" alt="${manga.title}" loading="lazy">
            <div class="manga-card-info">
                <p class="manga-card-title">${manga.title}</p>
            </div>
        `;
        resultsGrid.appendChild(card);
    });
}

function showStatus(type, message) {
    resultsGrid.innerHTML = ''; // Clear grid when showing status
    statusText.textContent = message;
    
    const loader = statusContainer.querySelector('.loader');
    if (type === 'loading') {
        loader.style.display = 'block';
    } else {
        loader.style.display = 'none';
    }
    
    statusContainer.style.display = 'block';
}

function hideStatus() {
    statusContainer.style.display = 'none';
}
