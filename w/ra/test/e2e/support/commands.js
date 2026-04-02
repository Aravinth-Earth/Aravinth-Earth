/**
 * Cypress Support - Custom Commands for Life On Earth (ra)
 */

/// <reference types="cypress" />

Cypress.Commands.add('visitRa', () => {
  cy.visit('/w/ra/Life_On_Earth.html');
});

Cypress.Commands.add('waitForLoading', () => {
  cy.get('#loading').should('exist');
  cy.wait(1600);
  cy.get('#loading').should('have.class', 'hidden');
});

Cypress.Commands.add('waitForQuote', () => {
  cy.get('#quoteContainer').should('have.class', 'fade-in');
  cy.get('#quoteTamil').should('not.be.empty');
  cy.get('#quoteEnglish').should('not.be.empty');
});

Cypress.Commands.add('getQuoteContainer', () => {
  return cy.get('#quoteContainer').should('have.class', 'fade-in');
});

Cypress.Commands.add('getTamilQuote', () => {
  return cy.get('#quoteTamil');
});

Cypress.Commands.add('getEnglishQuote', () => {
  return cy.get('#quoteEnglish');
});

Cypress.Commands.add('getQuoteSource', () => {
  return cy.get('#quoteSource');
});

Cypress.Commands.add('getQuoteDivider', () => {
  return cy.get('.quote-divider');
});

Cypress.Commands.add('getCanvas', () => {
  return cy.get('#canvas');
});

Cypress.Commands.add('getShapes', () => {
  return cy.get('#canvas').find('circle, polygon');
});

Cypress.Commands.add('getAudioElement', () => {
  return cy.window().then((win) => {
    return win.artGenerator?.audioManager?.audio || null;
  });
});

Cypress.Commands.add('triggerUserInteraction', () => {
  cy.get('body').click({ force: true });
});

Cypress.Commands.add('waitForQuoteFade', () => {
  cy.wait(1200);
});

Cypress.Commands.add('getQuoteTexts', () => {
  return cy.window().then((win) => {
    return win.PHILOSOPHICAL_QUOTES || [];
  }).then((quotes) => {
    if (quotes.length === 0) {
      return cy.get('#quoteTamil').invoke('text').then((tamil) => {
        return cy.get('#quoteEnglish').invoke('text').then((english) => {
          return [{ tamil, english }];
        });
      });
    }
    return quotes;
  });
});

Cypress.Commands.add('reloadAndVerifyQuote', () => {
  cy.reload();
  cy.waitForLoading();
  cy.waitForQuote();
});
