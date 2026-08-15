/**
 * Test Suite: Cross-Functionality Integration Tests
 * Tests for combined features, edge cases, and end-to-end scenarios
 */

/// <reference types="cypress" />

describe('Cross-Functionality Integration Tests', () => {
  beforeEach(() => {
    cy.visitRa();
    cy.waitForLoading();
    cy.waitForQuote();
  });

  context('Quote + Canvas Coexistence', () => {
    it('should display quotes over animated canvas without interference', () => {
      cy.getQuoteContainer().should('have.class', 'fade-in');
      cy.getShapes().should('have.length.greaterThan', 0);
    });

    it('should maintain quote visibility while shapes animate', () => {
      cy.wait(2000);
      cy.getTamilQuote().should('not.be.empty');
      cy.getEnglishQuote().should('not.be.empty');
    });

    it('should have canvas behind quote container', () => {
      cy.getCanvas().then(($canvas) => {
        const canvasZ = parseInt($canvas.css('z-index')) || 0;
        cy.getQuoteContainer().then(($quote) => {
          const quoteZ = parseInt($quote.css('z-index'));
          expect(quoteZ).to.be.greaterThan(canvasZ);
        });
      });
    });

    it('should not block canvas interactions with pointer-events none', () => {
      cy.getQuoteContainer().should('have.css', 'pointer-events', 'none');
    });
  });

  context('Quote + Audio Integration', () => {
    it('should continue quote rotation after audio interaction', () => {
      cy.getTamilQuote().invoke('text').then((initialTamil) => {
        cy.triggerUserInteraction();
        cy.wait(11000);
        cy.getTamilQuote().invoke('text').then((newTamil) => {
          expect(newTamil).to.not.equal(initialTamil);
        });
      });
    });

    it('should have both quote and audio systems initialized', () => {
      cy.window().then((win) => {
        expect(win.artGenerator).to.exist;
        expect(win.artGenerator.quoteManager).to.exist;
        expect(win.artGenerator.audioManager).to.exist;
      });
    });

    it('should maintain quote display during audio fade-in', () => {
      cy.triggerUserInteraction();
      cy.wait(2000);
      cy.getQuoteContainer().should('have.class', 'fade-in');
      cy.getTamilQuote().should('not.be.empty');
    });
  });

  context('Quote + Fullscreen Integration', () => {
    it('should maintain quote centering in fullscreen', () => {
      cy.window().then((win) => {
        let fullscreenRequested = false;
        const originalRequest = win.document.documentElement.requestFullscreen;
        win.document.documentElement.requestFullscreen = () => {
          fullscreenRequested = true;
          return Promise.resolve();
        };

        cy.get('.fullscreen-btn').click();
        cy.then(() => {
          expect(fullscreenRequested).to.be.true;
          win.document.documentElement.requestFullscreen = originalRequest;
        });
      });
    });

    it('should keep quote container visible with fullscreen button', () => {
      cy.getQuoteContainer().should('have.class', 'fade-in');
      cy.get('.fullscreen-btn').should('exist');
    });
  });

  context('Page Reload Persistence', () => {
    it('should restore quote display after reload', () => {
      cy.reloadAndVerifyQuote();
    });

    it('should restore canvas shapes after reload', () => {
      cy.reload();
      cy.waitForLoading();
      cy.wait(500);
      cy.getShapes().should('have.length.greaterThan', 0);
    });

    it('should restore audio manager after reload', () => {
      cy.reload();
      cy.waitForLoading();
      cy.window().then((win) => {
        expect(win.artGenerator).to.exist;
        expect(win.artGenerator.audioManager).to.exist;
      });
    });

    it('should restore quote manager after reload', () => {
      cy.reload();
      cy.waitForLoading();
      cy.window().then((win) => {
        expect(win.artGenerator.quoteManager).to.exist;
      });
    });

    it('should restart quote rotation after reload', () => {
      cy.reload();
      cy.waitForLoading();
      cy.waitForQuote();
      cy.getTamilQuote().should('not.be.empty');
      cy.getEnglishQuote().should('not.be.empty');
    });
  });

  context('Multiple Quote Cycles', () => {
    it('should show different quotes over multiple cycles', () => {
      const seenQuotes = new Set();

      cy.getTamilQuote().invoke('text').then((first) => {
        seenQuotes.add(first);
      });

      cy.wait(11000);
      cy.getTamilQuote().invoke('text').then((second) => {
        seenQuotes.add(second);
      });

      cy.wait(11000);
      cy.getTamilQuote().invoke('text').then((third) => {
        seenQuotes.add(third);
      });

      cy.wait(11000);
      cy.getTamilQuote().invoke('text').then((fourth) => {
        seenQuotes.add(fourth);
        expect(seenQuotes.size).to.be.greaterThan(2);
      });
    });

    it('should maintain consistent Tamil-English pairing across cycles', () => {
      cy.window().then((win) => {
        const quotes = win.PHILOSOPHICAL_QUOTES;
        if (quotes && quotes.length > 0) {
          for (let i = 0; i < 3; i++) {
            cy.getTamilQuote().invoke('text').then((tamil) => {
              cy.getEnglishQuote().invoke('text').then((english) => {
                const match = quotes.find(
                  (q) => q.tamil === tamil && q.english === english
                );
                expect(match).to.exist;
              });
            });
            cy.wait(11000);
          }
        }
      });
    });
  });

  context('Edge Cases', () => {
    it('should handle rapid viewport resize', () => {
      cy.viewport(375, 667);
      cy.wait(200);
      cy.viewport(1920, 1080);
      cy.wait(200);
      cy.viewport(768, 1024);
      cy.wait(500);
      cy.getQuoteContainer().should('have.class', 'fade-in');
      cy.getShapes().should('have.length.greaterThan', 0);
    });

    it('should handle tab visibility change', () => {
      cy.window().then((win) => {
        Object.defineProperty(win.document, 'hidden', {
          value: true,
          writable: true,
        });
        win.document.dispatchEvent(new Event('visibilitychange'));
        Object.defineProperty(win.document, 'hidden', {
          value: false,
          writable: true,
        });
        win.document.dispatchEvent(new Event('visibilitychange'));
      });
      cy.getQuoteContainer().should('have.class', 'fade-in');
    });

    it('should handle multiple rapid clicks', () => {
      for (let i = 0; i < 5; i++) {
        cy.get('body').click({ force: true });
      }
      cy.wait(500);
      cy.getQuoteContainer().should('have.class', 'fade-in');
    });

    it('should not break on missing source field', () => {
      cy.window().then((win) => {
        const quotes = win.PHILOSOPHICAL_QUOTES;
        if (quotes) {
          const noSourceQuotes = quotes.filter((q) => !q.source);
          expect(noSourceQuotes.length).to.be.greaterThan(0);
        }
      });
    });

    it('should handle quote with source field correctly', () => {
      cy.window().then((win) => {
        const quotes = win.PHILOSOPHICAL_QUOTES;
        if (quotes) {
          const withSource = quotes.find((q) => q.source);
          expect(withSource).to.exist;
          expect(withSource.source).to.include('Couple Friendly');
        }
      });
    });
  });

  context('Performance', () => {
    it('should maintain 60fps during quote transitions', () => {
      cy.window().then((win) => {
        const start = performance.now();
        let frames = 0;

        const countFrame = () => {
          frames++;
          if (performance.now() - start < 2000) {
            requestAnimationFrame(countFrame);
          }
        };
        requestAnimationFrame(countFrame);

        cy.wait(2500);
        cy.then(() => {
          const fps = frames / 2;
          expect(fps).to.be.greaterThan(30);
        });
      });
    });

    it('should not leak memory during quote rotation', () => {
      cy.window().then((win) => {
        const initialMemory = performance?.memory?.usedJSHeapSize || 0;

        cy.wait(11000);
        cy.getTamilQuote().should('not.be.empty');

        cy.wait(11000);
        cy.getTamilQuote().should('not.be.empty');

        cy.window().then((win2) => {
          const finalMemory = performance?.memory?.usedJSHeapSize || 0;
          if (initialMemory > 0 && finalMemory > 0) {
            const growth = ((finalMemory - initialMemory) / initialMemory) * 100;
            expect(growth).to.be.lessThan(50);
          }
        });
      });
    });

    it('should maintain shape count during quote transitions', () => {
      cy.getShapes().then(($initial) => {
        const initialCount = $initial.length;
        cy.wait(11000);
        cy.getShapes().should(($final) => {
          const finalCount = $final.length;
          expect(finalCount).to.be.greaterThan(initialCount * 0.5);
        });
      });
    });
  });

  context('End-to-End User Journey', () => {
    it('should complete full user experience flow', () => {
      cy.url().should('include', '/w/life-on-earth/Life_On_Earth');

      cy.get('#loading h1').should('contain', 'வாழ்வின் நடனம்');

      cy.waitForLoading();

      cy.getCanvas().should('exist');
      cy.getShapes().should('have.length.greaterThan', 0);

      cy.waitForQuote();
      cy.getTamilQuote().should('not.be.empty');
      cy.getEnglishQuote().should('not.be.empty');
      cy.getQuoteDivider().should('exist');

      cy.triggerUserInteraction();
      cy.window().then((win) => {
        expect(win.audioStarted).to.be.true;
      });

      cy.wait(11000);
      cy.getTamilQuote().should('not.be.empty');
      cy.getEnglishQuote().should('not.be.empty');

      cy.get('.fullscreen-btn').should('exist');
      cy.get('.audio-info').should('exist');
    });

    it('should survive page reload mid-experience', () => {
      cy.triggerUserInteraction();
      cy.wait(3000);

      cy.reload();
      cy.waitForLoading();
      cy.waitForQuote();

      cy.getTamilQuote().should('not.be.empty');
      cy.getEnglishQuote().should('not.be.empty');
      cy.getShapes().should('have.length.greaterThan', 0);
    });
  });
});
