const APP_VERSION = {
    number: '2.0.0',
    timestamp: Date.now(),
    environment: 'production',
    cacheKey: 'v2'
};

// Export for both browser and service worker environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APP_VERSION;
} else {
    self.APP_VERSION = APP_VERSION;
}
