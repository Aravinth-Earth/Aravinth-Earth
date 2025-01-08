// Cache name mapping
const APP_CACHE_NAMES = {
    'mg': 'math-game-v1',
    'ra': 'life-on-earth-v1',
    'lc': 'local-clock-v1',
    'c': 'calculator-v1',
    'sp': 'simple-planner-v1',
    'ytn': 'yt-news-v1',
    'cdt': 'countdown-v1',
    'rtp': 'reverse-time-planner-v1',
    'ssa': 'stock-analysis-v1'
};

async function refreshContent(appId = null) {
    const refreshBtn = document.querySelector('.refresh-btn');
    refreshBtn.classList.add('spinning');

    try {
        if (appId) {
            // App-specific refresh
            const cacheName = APP_CACHE_NAMES[appId];
            if (cacheName) {
                await caches.delete(cacheName);
                console.log(`Cleared cache for ${appId}`);
            }
        } else {
            // Main site refresh
            const registration = await navigator.serviceWorker.getRegistration('/');
            if (registration) {
                await registration.unregister();
            }
            await caches.delete('aravinth-site-v1');
        }

        // Reload the page
        window.location.reload(true);
    } catch (error) {
        console.error('Refresh failed:', error);
        refreshBtn.classList.remove('spinning');
        alert('Refresh failed. Please try again.');
    }
}

async function getCacheStats() {
    const stats = {};
    for (const [id, name] of Object.entries(APP_CACHE_NAMES)) {
        const cache = await caches.open(name);
        const keys = await cache.keys();
        stats[id] = keys.length;
    }
    const mainCache = await caches.open('aravinth-site-v1');
    stats['main'] = (await mainCache.keys()).length;
    return stats;
}

async function createRefreshMenu() {
    const menu = document.createElement('div');
    menu.className = 'refresh-menu';
    
    const currentPath = window.location.pathname;
    const appMatch = currentPath.match(/\/w\/(\w+)\//);
    const currentApp = appMatch ? appMatch[1] : null;
    
    const stats = await getCacheStats();
    
    menu.innerHTML = `
        <div class="refresh-header">Cache Control</div>
        ${currentApp ? `
            <button onclick="refreshContent('${currentApp}')">
                <i class="fas fa-sync"></i> Refresh ${currentApp.toUpperCase()} only
                <span class="cache-count">${stats[currentApp] || 0} files</span>
            </button>
            <div class="divider"></div>
        ` : ''}
        <button onclick="refreshContent()">
            <i class="fas fa-sync-alt"></i> Refresh entire site
            <span class="cache-count">${stats['main'] || 0} files</span>
        </button>
        <div class="divider"></div>
        <div class="cache-details">
            ${Object.entries(APP_CACHE_NAMES)
                .filter(([id]) => id !== currentApp && stats[id] > 0)
                .map(([id, name]) => `
                    <button onclick="refreshContent('${id}')">
                        <i class="fas fa-microchip"></i> ${id.toUpperCase()}
                        <span class="cache-count">${stats[id]} files</span>
                    </button>
                `).join('')}
        </div>
        <div class="cache-info">
            Currently in: ${currentApp ? `${currentApp.toUpperCase()} app` : 'Main site'}
        </div>
    `;
    
    document.body.appendChild(menu);
    return menu;
}

function toggleRefreshMenu(event) {
    event.stopPropagation();
    const menu = document.querySelector('.refresh-menu') || createRefreshMenu();
    menu.classList.toggle('visible');
}

// Detect current app from URL and set up refresh button
function setupRefreshButton() {
    const refreshBtn = document.querySelector('.refresh-btn');
    if (!refreshBtn) return;
    
    // Change click handler to show menu instead of immediate refresh
    refreshBtn.onclick = toggleRefreshMenu;
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        const menu = document.querySelector('.refresh-menu');
        if (menu && !menu.contains(e.target) && !refreshBtn.contains(e.target)) {
            menu.classList.remove('visible');
        }
    });
}

// Initialize
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(registration => console.log('ServiceWorker registration successful'))
        .catch(err => console.log('ServiceWorker registration failed: ', err));
    setupRefreshButton();
}

// Add loading animation to links when clicked
document.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', function(e) {
        if (!this.href.includes('mailto:')) {
            this.classList.add('loading');
        }
    });
});
