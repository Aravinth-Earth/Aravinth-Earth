/**
 * Test Suite: Responsive Design
 * Tests for mobile, tablet, and desktop breakpoints
 */

/// <reference types="cypress" />

describe('Responsive Design', () => {
  beforeEach(() => {
    cy.visitRa();
    cy.waitForLoading();
    cy.waitForQuote();
  });

  context('Desktop Viewport (1280x720)', () => {
    it('should render quote container within viewport', () => {
      cy.getQuoteContainer().then(($el) => {
        const rect = $el[0].getBoundingClientRect();
        expect(rect.width).to.be.lessThan(1280);
        expect(rect.height).to.be.lessThan(720);
      });
    });

    it('should have adequate container padding on desktop', () => {
      cy.getQuoteContainer().then(($el) => {
        const padding = parseFloat($el.css('padding-top'));
        expect(padding).to.be.greaterThan(25);
      });
    });

    it('should display Tamil text at 22px on desktop', () => {
      cy.getTamilQuote().then(($el) => {
        const fontSize = parseFloat($el.css('font-size'));
        expect(fontSize).to.be.closeTo(22, 2);
      });
    });

    it('should display English text at 20px on desktop', () => {
      cy.getEnglishQuote().then(($el) => {
        const fontSize = parseFloat($el.css('font-size'));
        expect(fontSize).to.be.closeTo(20, 2);
      });
    });
  });

  context('Tablet Viewport (768px)', () => {
    beforeEach(() => {
      cy.viewport(768, 1024);
      cy.reload();
      cy.waitForLoading();
      cy.waitForQuote();
    });

    it('should reduce container padding on tablet', () => {
      cy.getQuoteContainer().then(($el) => {
        const padding = parseFloat($el.css('padding-top'));
        expect(padding).to.be.lessThan(35);
      });
    });

    it('should reduce Tamil font size on tablet', () => {
      cy.getTamilQuote().then(($el) => {
        const fontSize = parseFloat($el.css('font-size'));
        expect(fontSize).to.be.lessThan(22);
      });
    });

    it('should reduce English font size on tablet', () => {
      cy.getEnglishQuote().then(($el) => {
        const fontSize = parseFloat($el.css('font-size'));
        expect(fontSize).to.be.lessThan(20);
      });
    });

    it('should have narrower divider on tablet', () => {
      cy.getQuoteDivider().then(($el) => {
        const width = parseFloat($el.css('width'));
        expect(width).to.be.lessThan(60);
      });
    });

    it('should maintain max-width constraint on tablet', () => {
      cy.getQuoteContainer().then(($el) => {
        const rect = $el[0].getBoundingClientRect();
        expect(rect.width).to.be.lessThan(768 * 0.95);
      });
    });

    it('should keep quote container centered on tablet', () => {
      cy.getQuoteContainer().then(($el) => {
        const rect = $el[0].getBoundingClientRect();
        const viewportWidth = 768;
        const centerOffset = Math.abs(rect.left + rect.width / 2 - viewportWidth / 2);
        expect(centerOffset).to.be.lessThan(10);
      });
    });

    it('should still display both quotes on tablet', () => {
      cy.getTamilQuote().should('not.be.empty');
      cy.getEnglishQuote().should('not.be.empty');
    });

    it('should maintain divider visibility on tablet', () => {
      cy.getQuoteDivider().should('exist');
    });
  });

  context('Mobile Viewport (375px)', () => {
    beforeEach(() => {
      cy.viewport(375, 667);
      cy.reload();
      cy.waitForLoading();
      cy.waitForQuote();
    });

    it('should have minimal container padding on mobile', () => {
      cy.getQuoteContainer().then(($el) => {
        const padding = parseFloat($el.css('padding-top'));
        expect(padding).to.be.lessThan(25);
      });
    });

    it('should have smallest Tamil font size on mobile', () => {
      cy.getTamilQuote().then(($el) => {
        const fontSize = parseFloat($el.css('font-size'));
        expect(fontSize).to.be.lessThan(18);
      });
    });

    it('should have smallest English font size on mobile', () => {
      cy.getEnglishQuote().then(($el) => {
        const fontSize = parseFloat($el.css('font-size'));
        expect(fontSize).to.be.lessThan(17);
      });
    });

    it('should have narrowest divider on mobile', () => {
      cy.getQuoteDivider().then(($el) => {
        const width = parseFloat($el.css('width'));
        expect(width).to.be.lessThan(40);
      });
    });

    it('should have very small source text on mobile', () => {
      cy.getQuoteSource().then(($el) => {
        const fontSize = parseFloat($el.css('font-size'));
        expect(fontSize).to.be.lessThan(13);
      });
    });

    it('should use 95% max-width on mobile', () => {
      cy.getQuoteContainer().then(($el) => {
        const rect = $el[0].getBoundingClientRect();
        expect(rect.width).to.be.lessThan(375 * 0.98);
      });
    });

    it('should keep quote container centered on mobile', () => {
      cy.getQuoteContainer().then(($el) => {
        const rect = $el[0].getBoundingClientRect();
        const viewportWidth = 375;
        const centerOffset = Math.abs(rect.left + rect.width / 2 - viewportWidth / 2);
        expect(centerOffset).to.be.lessThan(10);
      });
    });

    it('should still display both quotes on mobile', () => {
      cy.getTamilQuote().should('not.be.empty');
      cy.getEnglishQuote().should('not.be.empty');
    });

    it('should maintain glassmorphism on mobile', () => {
      cy.getQuoteContainer().should('have.css', 'border-radius').then((radius) => {
        expect(parseFloat(radius)).to.be.greaterThan(0);
      });
    });

    it('should not overflow viewport on mobile', () => {
      cy.getQuoteContainer().then(($el) => {
        const rect = $el[0].getBoundingClientRect();
        expect(rect.right).to.be.at.most(375);
        expect(rect.bottom).to.be.at.most(667);
      });
    });

    it('should keep fullscreen button accessible on mobile', () => {
      cy.get('.fullscreen-btn').should('be.visible');
    });

    it('should keep audio info accessible on mobile', () => {
      cy.get('.audio-info').should('be.visible');
    });
  });

  context('Orientation Change', () => {
    it('should handle landscape orientation', () => {
      cy.viewport(667, 375);
      cy.wait(500);
      cy.getQuoteContainer().should('have.class', 'fade-in');
    });

    it('should handle portrait orientation', () => {
      cy.viewport(375, 667);
      cy.wait(500);
      cy.getQuoteContainer().should('have.class', 'fade-in');
    });

    it('should adjust canvas on resize', () => {
      cy.viewport(1920, 1080);
      cy.wait(500);
      cy.window().then((win) => {
        cy.getCanvas().should('have.attr', 'width', '1920');
        cy.getCanvas().should('have.attr', 'height', '1080');
      });
    });
  });

  context('Cross-Breakpoint Consistency', () => {
    it('should maintain quote structure across all viewports', () => {
      cy.getTamilQuote().should('exist');
      cy.getQuoteDivider().should('exist');
      cy.getEnglishQuote().should('exist');
      cy.getQuoteSource().should('exist');
    });

    it('should maintain font hierarchy across viewports', () => {
      cy.getTamilQuote().then(($tamil) => {
        const tamilSize = parseFloat($tamil.css('font-size'));
        cy.getEnglishQuote().then(($english) => {
          const englishSize = parseFloat($english.css('font-size'));
          cy.getQuoteSource().then(($source) => {
            const sourceSize = parseFloat($source.css('font-size'));
            expect(sourceSize).to.be.lessThan(englishSize);
            expect(englishSize).to.be.at.most(tamilSize + 5);
          });
        });
      });
    });

    it('should maintain divider between quotes at all sizes', () => {
      cy.getQuoteDivider().should('exist');
    });
  });
});
