/**
 * Test Suite: Initial Load & Basic Rendering
 * Tests for page load, loading screen, canvas, and basic DOM structure
 */

/// <reference types="cypress" />

describe('Initial Load & Basic Rendering', () => {
  beforeEach(() => {
    cy.visitRa();
  });

  context('Page Load', () => {
    it('should load the page successfully', () => {
      cy.url().should('include', '/w/life-on-earth/Life_On_Earth');
    });

    it('should have correct document title', () => {
      cy.title().should('include', 'வாழ்வின் நடனம்');
    });

    it('should have lang attribute set to Tamil', () => {
      cy.get('html').should('have.attr', 'lang', 'ta');
    });

    it('should have meta viewport tag for mobile', () => {
      cy.get('meta[name="viewport"]').should('exist');
    });

    it('should have theme-color meta tag', () => {
      cy.get('meta[name="theme-color"]').should('have.attr', 'content', '#000000');
    });
  });

  context('Loading Screen', () => {
    it('should display loading screen initially', () => {
      cy.get('#loading').should('be.visible');
      cy.get('#loading h1').should('contain', 'வாழ்வின் நடனம்');
      cy.get('#loading p').should('contain', 'வாழ்க்கையின் அழகிய ஓட்டத்தை காணுங்கள்');
    });

    it('should hide loading screen after delay', () => {
      cy.waitForLoading();
    });

    it('should apply hidden class to loading element', () => {
      cy.waitForLoading();
      cy.get('#loading').should('have.class', 'hidden');
    });

    it('should not show loading screen after it disappears', () => {
      cy.waitForLoading();
      cy.get('#loading').should('not.be.visible');
    });
  });

  context('Canvas Rendering', () => {
    it('should render SVG canvas element', () => {
      cy.getCanvas().should('exist');
    });

    it('should have SVG with correct id', () => {
      cy.get('#canvas').should('have.attr', 'aria-label');
    });

    it('should have defs element for gradients', () => {
      cy.get('#canvas defs').should('exist');
    });

    it('should have radial gradient definition', () => {
      cy.get('#canvas #glow').should('exist');
    });

    it('should have correct gradient stops', () => {
      cy.get('#glow stop').should('have.length', 2);
      cy.get('#glow stop').first().should('have.attr', 'offset', '0%');
      cy.get('#glow stop').last().should('have.attr', 'offset', '100%');
    });

    it('should set canvas width to window innerWidth', () => {
      cy.window().then((win) => {
        cy.getCanvas().should('have.attr', 'width', win.innerWidth.toString());
      });
    });

    it('should set canvas height to window innerHeight', () => {
      cy.window().then((win) => {
        cy.getCanvas().should('have.attr', 'height', win.innerHeight.toString());
      });
    });

    it('should create shapes on canvas after load', () => {
      cy.waitForLoading();
      cy.wait(500);
      cy.getShapes().should('have.length.greaterThan', 0);
    });

    it('should maintain minimum number of shapes', () => {
      cy.waitForLoading();
      cy.wait(1000);
      cy.getShapes().should('have.length.greaterThan', 10);
    });
  });

  context('DOM Structure', () => {
    it('should have quote container element', () => {
      cy.get('#quoteContainer').should('exist');
    });

    it('should have Tamil quote element', () => {
      cy.get('#quoteTamil').should('exist');
    });

    it('should have English quote element', () => {
      cy.get('#quoteEnglish').should('exist');
    });

    it('should have quote source element', () => {
      cy.get('#quoteSource').should('exist');
    });

    it('should have quote divider element', () => {
      cy.get('.quote-divider').should('exist');
    });

    it('should have footer element', () => {
      cy.get('footer').should('exist');
    });

    it('should have fullscreen button in footer', () => {
      cy.get('.fullscreen-btn').should('exist');
    });

    it('should have audio info element', () => {
      cy.get('.audio-info').should('exist');
    });

    it('should load all required scripts', () => {
      cy.get('script[src*="config.js"]').should('exist');
      cy.get('script[src*="utils.js"]').should('exist');
      cy.get('script[src*="quotes.js"]').should('exist');
      cy.get('script[src*="shapes.js"]').should('exist');
      cy.get('script[src*="main.js"]').should('exist');
    });

    it('should load Google Fonts for Tamil', () => {
      cy.get('link[href*="Noto+Sans+Tamil"]').should('exist');
    });
  });

  context('Quote Initial State', () => {
    it('should show quotes after loading delay', () => {
      cy.waitForLoading();
      cy.waitForQuote();
    });

    it('should display Tamil text in quote', () => {
      cy.waitForLoading();
      cy.waitForQuote();
      cy.getTamilQuote().invoke('text').should('not.be.empty');
    });

    it('should display English text in quote', () => {
      cy.waitForLoading();
      cy.waitForQuote();
      cy.getEnglishQuote().invoke('text').should('not.be.empty');
    });

    it('should have both quotes visible simultaneously', () => {
      cy.waitForLoading();
      cy.waitForQuote();
      cy.getTamilQuote().should('not.be.empty');
      cy.getEnglishQuote().should('not.be.empty');
    });
  });
});
