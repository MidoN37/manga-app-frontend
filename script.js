const BACKEND_URL = "https://a6d8181d-7a73-4a1c-aa8c-8ba79d7fe02e-00-o211iw2hku6j.spock.replit.dev";

// Initialize the Telegram Web App object
const tg = window.Telegram.WebApp;
tg.ready();

// --- Element References ---
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const resultsGrid = document.getElementById('results-grid');
const statusContainer = document.getElementById('status-container');
const statusText = document.getElementById('status-text');
const detailsView = document.getElementById('details-view');

// Store current manga data to avoid re-fetching
let currentMangaData = null;

// --- Event Listeners ---
searchForm.addEventListener('submit', handleSearch);

// --- Main Functions ---

async function handleSearch(event) {
    event.preventDefault();
    const query = searchInput.value.trim();
    if (!query) return;
    searchInput.blur();
    showStatus('loading', 'Searching for manga...');

    try {
        const response = await fetch(`${BACKEND_URL}/api/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error(`Server error: ${response.status}`);
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            renderResults(data.results);
            hideStatus();
        } else {
            showStatus('message', 'No manga found. Try another title! 🤔');
        }
    } catch (error) {
        console.error('Search failed:', error);
        showStatus('message', 'Oops! Could not connect to the server.');
        tg.HapticFeedback.notificationOccurred('error');
    }
}

async function selectManga(slug) {
    showStatus('loading', 'Fetching manga details...');
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/details/${slug}`);
        if (!response.ok) throw new Error(`Server error: ${response.status}`);
        const data = await response.json();
        currentMangaData = data;
        renderDetails(data);
        hideStatus();
        tg.BackButton.show();
    } catch (error) {
        console.error('Failed to fetch details:', error);
        showStatus('message', 'Oops! Could not get manga details.');
        tg.HapticFeedback.notificationOccurred('error');
    }
}

// ### NEW ### Updated download handler with ad logic
async function handleDownload(chapters, title) {
    tg.MainButton.setText('Loading Ad...');
    tg.MainButton.showProgress();
    tg.HapticFeedback.impactOccurred('light');

    // This is the Monetag function call for a Rewarded Ad
    show_9553790().then(() => {
        // This code runs AFTER the user watches the ad.
        // Now we proceed with the actual download request.
        console.log('Ad finished, proceeding to download.');
        
        const payload = {
            chat_id: tg.initDataUnsafe.user.id,
            chapters: chapters,
            title: title
        };

        // Use fetch to send the download request to our backend
        fetch(`${BACKEND_URL}/api/download`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).then(response => {
            if (!response.ok) throw new Error('Backend could not start the download.');
            
            // Show a success popup and close the Mini App
            tg.showPopup({
                title: 'Download Started!',
                message: 'Your download has begun. I will send you the file in our chat. You can now close this window.',
                buttons: [{ type: 'ok', text: 'Awesome!' }]
            }, () => tg.close());

        }).catch(error => {
            console.error('Download request failed:', error);
            tg.showAlert('Something went wrong starting the download. Please try again.');
        }).finally(() => {
            // Hide the loading indicator on the main button
            tg.MainButton.hideProgress();
        });

    }).catch(e => {
        // This code runs if the ad fails to load
        console.error('Ad failed to load:', e);
        tg.showAlert('The ad could not be loaded. Please disable your Adblocker.');
        tg.MainButton.hideProgress();
    });
}

// --- Render Functions ---

function renderResults(mangaList) {
    resultsGrid.innerHTML = '';
    detailsView.style.display = 'none';
    resultsGrid.style.display = 'grid';

    mangaList.forEach(manga => {
        const cover = manga.md_covers?.[0]?.b2key;
        const coverUrl = cover ? `https://meo.comick.pictures/${cover}` : 'https://via.placeholder.com/150x225.png?text=No+Cover';
        
        const card = document.createElement('div');
        card.className = 'manga-card';
        card.onclick = () => selectManga(manga.slug); 

        card.innerHTML = `
            <img src="${coverUrl}" alt="${manga.title}" loading="lazy">
            <div class="manga-card-info">
                <p class="manga-card-title">${manga.title}</p>
            </div>
        `;
        resultsGrid.appendChild(card);
    });
}

function renderDetails(data) {
    resultsGrid.style.display = 'none';
    detailsView.style.display = 'block';
    
    const { details, chapters } = data;
    const cover = details.md_covers?.[0]?.b2key;
    const coverUrl = cover ? `https://meo.comick.pictures/${cover}` : '';

    let chaptersHtml = chapters.map(ch => {
        const chapterTitle = `Chapter ${ch.chap || 'N/A'}${ch.title ? `: ${ch.title}` : ''}`;
        return `
            <div class="chapter-item" onclick='handleDownload([${JSON.stringify(ch)}], "${details.title} - Ch ${ch.chap || ch.hid}")'>
                <span class="chapter-title">${chapterTitle}</span>
                <button class="download-button">GET 🎬</button>
            </div>
        `;
    }).join('');

    detailsView.innerHTML = `
        <div class="details-header">
            <img src="${coverUrl}" class="details-cover" alt="Cover">
            <div class="details-info">
                <h2>${details.title}</h2>
                <p><strong>Status:</strong> ${details.status}</p>
                <p><strong>Year:</strong> ${details.year}</p>
                <p><strong>Chapters:</strong> ${chapters.length}</p>
            </div>
        </div>
        <p class="details-description">${details.desc || 'No description available.'}</p>
        <button class="download-all-button" id="download-all">Download All Chapters 🎬</button>
        <h3>Chapters</h3>
        <div class="chapter-list">
            ${chaptersHtml}
        </div>
    `;

    document.getElementById('download-all').addEventListener('click', () => {
        handleDownload(currentMangaData.chapters, currentMangaData.details.title);
    });
}

// --- UI State Functions ---
function showStatus(type, message) {
    resultsGrid.style.display = 'none';
    detailsView.style.display = 'none';
    statusText.textContent = message;
    const loader = statusContainer.querySelector('.loader');
    loader.style.display = (type === 'loading') ? 'block' : 'none';
    statusContainer.style.display = 'block';
}

function hideStatus() {
    statusContainer.style.display = 'none';
}

// --- Telegram Integration ---
tg.BackButton.onClick(() => {
    tg.BackButton.hide();
    detailsView.style.display = 'none';
    resultsGrid.style.display = 'grid';
});
