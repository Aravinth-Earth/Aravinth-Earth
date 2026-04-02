/**
 * Cypress Configuration for Life On Earth (ra) Tests
 */

const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:8081',
    
    specPattern: 'test/e2e/specs/**/*.cy.js',
    
    video: false,
    screenshotOnRunFailure: true,
    screenshotsFolder: 'test/e2e/screenshots',
    
    supportFile: 'test/e2e/support/commands.js',
    
    viewportWidth: 1280,
    viewportHeight: 720,
    
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,

    allowCypressEnv: false,
    
    env: {
      coverage: false
    }
  }
});
