const CACHE_NAME = 'site-cache-v2.1';  // Match sw.js cache name

async function refreshContent() {
    try {
        // Clear the cache
        await caches.delete(CACHE_NAME);
        // Force reload from network
        window.location.reload(true);
    } catch (error) {
        console.error('Refresh failed:', error);
        alert('Refresh failed. Please try again.');
    }
}

// Simplified refresh button setup
function setupRefreshButton() {
    const refreshBtn = document.querySelector('.refresh-btn');
    if (refreshBtn) {
        refreshBtn.onclick = refreshContent;
    }
}

// Initialize
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(() => console.log('ServiceWorker registration successful'))
        .catch(err => console.log('ServiceWorker registration failed: ', err));
    setupRefreshButton();
}

// Add loading animation to links
document.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', function(e) {
        if (!this.href.includes('mailto:')) {
            this.classList.add('loading');
        }
    });
});
