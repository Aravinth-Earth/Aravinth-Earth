/**
 * Cypress Configuration for Local Planner Tests
 */

const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    // Base URL for tests
    baseUrl: 'http://localhost:8081',
    
    // Test files pattern
    specPattern: 'test/e2e/specs/**/*.cy.js',
    
    // Video/screenshots
    video: false,
    screenshotOnRunFailure: true,
    screenshotsFolder: 'test/e2e/screenshots',
    
    // Support file
    supportFile: 'test/e2e/support/commands.js',
    
    // Viewport
    viewportWidth: 1280,
    viewportHeight: 720,
    
    // Timeouts
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,

    allowCypressEnv: false,
    
    // Environment variables
    env: {
      coverage: false
    }
  }
});
