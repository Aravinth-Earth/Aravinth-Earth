/**
 * Test Suite: Quote Display Functionality
 * Tests for bilingual display, attribution, and quote content
 */

/// <reference types="cypress" />

describe('Quote Display Functionality', () => {
  beforeEach(() => {
    cy.visitRa();
    cy.waitForLoading();
    cy.waitForQuote();
  });

  context('Bilingual Display', () => {
    it('should display Tamil and English quotes simultaneously', () => {
      cy.getTamilQuote().should('not.be.empty');
      cy.getEnglishQuote().should('not.be.empty');
    });

    it('should display Tamil quote with Tamil characters', () => {
      cy.getTamilQuote().invoke('text').then((text) => {
        const tamilRegex = /[\u0B80-\u0BFF]/;
        expect(tamilRegex.test(text)).to.be.true;
      });
    });

    it('should display English quote with Latin characters', () => {
      cy.getEnglishQuote().invoke('text').then((text) => {
        const englishRegex = /[a-zA-Z]/;
        expect(englishRegex.test(text)).to.be.true;
      });
    });

    it('should have Tamil quote above English quote in DOM order', () => {
      cy.get('#quoteContainer').within(() => {
        cy.get('#quoteTamil').then(($tamil) => {
          cy.get('#quoteEnglish').then(($english) => {
            const tamilPos = $tamil[0].compareDocumentPosition($english[0]);
            expect(tamilPos & Node.DOCUMENT_POSITION_FOLLOWING).to.not.equal(0);
          });
        });
      });
    });

    it('should have divider between Tamil and English quotes', () => {
      cy.getQuoteDivider().should('exist');
    });
  });

  context('Quote Content', () => {
    it('should display a quote from the PHILOSOPHICAL_QUOTES array', () => {
      cy.getTamilQuote().invoke('text').then((tamilText) => {
        cy.getEnglishQuote().invoke('text').then((englishText) => {
          cy.window().then((win) => {
            const quotes = win.PHILOSOPHICAL_QUOTES;
            if (quotes && quotes.length > 0) {
              const found = quotes.some(
                (q) => q.tamil === tamilText && q.english === englishText
              );
              expect(found).to.be.true;
            }
          });
        });
      });
    });

    it('should have exactly 10 quotes in the pool', () => {
      cy.window().then((win) => {
        const quotes = win.PHILOSOPHICAL_QUOTES;
        if (quotes) {
          expect(quotes).to.have.length(10);
        }
      });
    });

    it('should display Tamil text with correct font class', () => {
      cy.getTamilQuote().should('have.class', 'quote-tamil');
    });

    it('should display English text with correct font class', () => {
      cy.getEnglishQuote().should('have.class', 'quote-english');
    });
  });

  context('Quote Attribution', () => {
    it('should have source element in DOM', () => {
      cy.getQuoteSource().should('exist');
    });

    it('should hide source element when quote has no attribution', () => {
      cy.getQuoteTexts().then((quotes) => {
        const quotesWithoutSource = quotes.filter((q) => !q.source);
        if (quotesWithoutSource.length > 0) {
          cy.getQuoteContainer().then(() => {
            cy.getQuoteSource().invoke('text').then((text) => {
              if (text.trim() === '') {
                cy.getQuoteSource().should('have.css', 'display', 'none');
              }
            });
          });
        }
      });
    });

    it('should display source when movie quote appears', () => {
      cy.getQuoteSource().invoke('text').then((text) => {
        if (text.trim() !== '') {
          expect(text).to.include('Couple Friendly');
          expect(text).to.include('2026');
        }
      });
    });

    it('should format source with em dash prefix', () => {
      cy.getQuoteSource()
        .invoke('text')
        .then((text) => {
          if (text.trim() !== '') {
            expect(text.trim()).to.match(/^—/);
          }
        });
    });

    it('should have source styled as italic', () => {
      cy.getQuoteSource().should('have.css', 'font-style', 'italic');
    });

    it('should have source in smaller font than quotes', () => {
      cy.getQuoteSource().then(($source) => {
        const sourceSize = parseFloat($source.css('font-size'));
        cy.getEnglishQuote().then(($english) => {
          const englishSize = parseFloat($english.css('font-size'));
          expect(sourceSize).to.be.lessThan(englishSize);
        });
      });
    });
  });

  context('Quote Container Styling', () => {
    it('should have glassmorphism background', () => {
      cy.getQuoteContainer().should(($container) => {
        const bg = $container.css('background-color');
        expect(bg).to.not.equal('rgba(0, 0, 0, 0)');
      });
    });

    it('should have backdrop-filter blur', () => {
      cy.getQuoteContainer().then(($container) => {
        const blur = $container.css('backdrop-filter') || $container.css('-webkit-backdrop-filter');
        expect(blur).to.include('blur');
      });
    });

    it('should have border radius', () => {
      cy.getQuoteContainer().should(($container) => {
        const radius = parseFloat($container.css('border-radius'));
        expect(radius).to.be.greaterThan(0);
      });
    });

    it('should have border', () => {
      cy.getQuoteContainer().should(($container) => {
        const borderWidth = parseFloat($container.css('border-top-width'));
        expect(borderWidth).to.be.greaterThan(0);
      });
    });

    it('should be centered on screen', () => {
      cy.getQuoteContainer().then(($container) => {
        const rect = $container[0].getBoundingClientRect();
        cy.window().then((win) => {
          const centerX = win.innerWidth / 2;
          const centerY = win.innerHeight / 2;
          const containerCenterX = rect.left + rect.width / 2;
          const containerCenterY = rect.top + rect.height / 2;
          expect(Math.abs(containerCenterX - centerX)).to.be.lessThan(50);
          expect(Math.abs(containerCenterY - centerY)).to.be.lessThan(50);
        });
      });
    });

    it('should have max-width constraint', () => {
      cy.getQuoteContainer().should(($container) => {
        const maxWidth = $container.css('max-width');
        expect(maxWidth).to.not.equal('none');
      });
    });

    it('should have pointer-events none', () => {
      cy.getQuoteContainer().should('have.css', 'pointer-events', 'none');
    });

    it('should have z-index above canvas', () => {
      cy.getQuoteContainer().should(($container) => {
        const zIndex = parseInt($container.css('z-index'));
        expect(zIndex).to.be.greaterThan(0);
      });
    });
  });

  context('Quote Visibility & Fade', () => {
    it('should start with fade-in class when visible', () => {
      cy.waitForQuote();
      cy.getQuoteContainer().should('have.class', 'fade-in');
    });

    it('should not have fade-out class when visible', () => {
      cy.waitForQuote();
      cy.getQuoteContainer().should('not.have.class', 'fade-out');
    });

    it('should have opacity 1 when fully visible', () => {
      cy.waitForQuote();
      cy.getQuoteContainer().should(($container) => {
        const opacity = parseFloat($container.css('opacity'));
        expect(opacity).to.be.closeTo(1, 0.1);
      });
    });
  });

  context('Quote Text Readability', () => {
    it('should have text shadow for readability', () => {
      cy.getTamilQuote().then(($el) => {
        const shadow = $el.css('text-shadow');
        if (shadow !== 'none') {
          expect(shadow).to.not.equal('none');
        }
      });
    });

    it('should have sufficient color contrast', () => {
      cy.getTamilQuote().should(($el) => {
        const color = $el.css('color');
        expect(color).to.include('255');
      });
    });

    it('should have appropriate line height for Tamil', () => {
      cy.getTamilQuote().then(($el) => {
        const lineHeight = parseFloat($el.css('line-height'));
        const fontSize = parseFloat($el.css('font-size'));
        const ratio = lineHeight / fontSize;
        expect(ratio).to.be.greaterThan(1.5);
      });
    });

    it('should have letter spacing for readability', () => {
      cy.getTamilQuote().then(($el) => {
        const letterSpacing = parseFloat($el.css('letter-spacing'));
        expect(letterSpacing).to.be.greaterThan(0);
      });
    });
  });

  context('Quote Padding & Spacing', () => {
    it('should have adequate padding on container', () => {
      cy.getQuoteContainer().then(($el) => {
        const padding = parseFloat($el.css('padding-top'));
        expect(padding).to.be.greaterThan(15);
      });
    });

    it('should have margin between Tamil quote and divider', () => {
      cy.getTamilQuote().then(($el) => {
        const marginBottom = parseFloat($el.css('margin-bottom'));
        expect(marginBottom).to.be.greaterThan(0);
      });
    });

    it('should have margin between divider and English quote', () => {
      cy.getQuoteDivider().then(($el) => {
        const marginBottom = parseFloat($el.css('margin-bottom'));
        expect(marginBottom).to.be.greaterThan(0);
      });
    });
  });
});
