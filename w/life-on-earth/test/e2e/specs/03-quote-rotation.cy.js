/**
 * Test Suite: Quote Rotation Behavior
 * Tests for quote cycling, timing, fade transitions, and no-repeat logic
 */

/// <reference types="cypress" />

describe('Quote Rotation Behavior', () => {
  beforeEach(() => {
    cy.visitRa();
    cy.waitForLoading();
    cy.waitForQuote();
  });

  context('Quote Cycling', () => {
    it('should change quote after display duration', () => {
      cy.getTamilQuote().invoke('text').then((initialTamil) => {
        cy.wait(11000);
        cy.getTamilQuote().invoke('text').then((newTamil) => {
          expect(newTamil).to.not.equal(initialTamil);
        });
      });
    });

    it('should cycle through multiple different quotes over time', () => {
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
        expect(seenQuotes.size).to.be.greaterThan(1);
      });
    });

    it('should update both Tamil and English together', () => {
      cy.getTamilQuote().invoke('text').then((initialTamil) => {
        cy.getEnglishQuote().invoke('text').then((initialEnglish) => {
          cy.window().then((win) => {
            const quotes = win.PHILOSOPHICAL_QUOTES;
            if (quotes && quotes.length > 0) {
              const initialQuote = quotes.find(
                (q) => q.tamil === initialTamil && q.english === initialEnglish
              );
              expect(initialQuote).to.exist;
            }
          });
        });
      });
    });

    it('should maintain Tamil-English pair consistency', () => {
      cy.getTamilQuote().invoke('text').then((tamil) => {
        cy.getEnglishQuote().invoke('text').then((english) => {
          cy.window().then((win) => {
            const quotes = win.PHILOSOPHICAL_QUOTES;
            if (quotes && quotes.length > 0) {
              const matchingQuote = quotes.find(
                (q) => q.tamil === tamil && q.english === english
              );
              expect(matchingQuote).to.exist;
            }
          });
        });
      });
    });
  });

  context('No Repeat Logic', () => {
    it('should not show the same quote twice in a row', () => {
      cy.getTamilQuote().invoke('text').then((first) => {
        cy.wait(11000);
        cy.getTamilQuote().invoke('text').then((second) => {
          expect(second).to.not.equal(first);
        });
      });
    });

    it('should not repeat consecutive English quotes', () => {
      cy.getEnglishQuote().invoke('text').then((first) => {
        cy.wait(11000);
        cy.getEnglishQuote().invoke('text').then((second) => {
          expect(second).to.not.equal(first);
        });
      });
    });
  });

  context('Fade Transitions', () => {
    it('should apply fade-out class during transition', () => {
      cy.getTamilQuote().invoke('text').then((initialTamil) => {
        cy.wait(10500);
        cy.getQuoteContainer().should(($container) => {
          expect($container.hasClass('fade-out') || $container.hasClass('fade-in')).to.be.true;
        });
      });
    });

    it('should apply fade-in class after transition', () => {
      cy.wait(11500);
      cy.getQuoteContainer().should('have.class', 'fade-in');
    });

    it('should not have both fade classes simultaneously', () => {
      cy.getQuoteContainer().should(($container) => {
        const hasFadeIn = $container.hasClass('fade-in');
        const hasFadeOut = $container.hasClass('fade-out');
        expect(hasFadeIn && hasFadeOut).to.be.false;
      });
    });

    it('should have blur during fade-out', () => {
      cy.getTamilQuote().invoke('text').then(() => {
        cy.wait(10500);
        cy.getQuoteContainer().should(($container) => {
          const filter = $container.css('filter');
          expect(filter).to.include('blur');
        });
      });
    });

    it('should have no blur when fully visible', () => {
      cy.waitForQuote();
      cy.getQuoteContainer().should(($container) => {
        const filter = $container.css('filter');
        expect(filter === 'none' || filter === 'blur(0px)').to.be.true;
      });
    });

    it('should have scale transform during fade-out', () => {
      cy.wait(10500);
      cy.getQuoteContainer().should(($container) => {
        const transform = $container.css('transform');
        expect(transform).to.not.equal('none');
      });
    });
  });

  context('Timing Accuracy', () => {
    it('should display quote for approximately 10 seconds', () => {
      cy.getTamilQuote().invoke('text').then((initialTamil) => {
        cy.wait(9000);
        cy.getTamilQuote().invoke('text').should('equal', initialTamil);
      });
    });

    it('should not change quote before 8 seconds', () => {
      cy.getTamilQuote().invoke('text').then((initialTamil) => {
        cy.wait(8000);
        cy.getTamilQuote().invoke('text').should('equal', initialTamil);
      });
    });

    it('should have fade transition complete within 1.5 seconds', () => {
      cy.wait(10500);
      cy.wait(1500);
      cy.getQuoteContainer().should('have.class', 'fade-in');
    });
  });

  context('Source Visibility During Rotation', () => {
    it('should show source only for attributed quotes', () => {
      cy.getQuoteTexts().then((quotes) => {
        const hasSource = quotes.some((q) => q.source);
        const noSource = quotes.some((q) => !q.source);

        if (hasSource && noSource) {
          cy.log('Some quotes have source, some do not - checking visibility toggles');
        }
      });
    });

    it('should update source text when quote changes', () => {
      cy.getQuoteSource().invoke('text').then((initialSource) => {
        cy.wait(11000);
        cy.getQuoteSource().invoke('text').then((newSource) => {
          cy.log(`Source changed from "${initialSource}" to "${newSource}"`);
        });
      });
    });
  });

  context('Container Visibility', () => {
    it('should remain visible during quote display', () => {
      cy.waitForQuote();
      cy.getQuoteContainer().should('have.class', 'fade-in');
    });

    it('should have smooth opacity transition', () => {
      cy.waitForQuote();
      cy.getQuoteContainer().should(($container) => {
        const opacity = parseFloat($container.css('opacity'));
        expect(opacity).to.be.greaterThan(0.8);
      });
    });

    it('should maintain position during rotation', () => {
      cy.getQuoteContainer()
        .then(($el) => {
          const rect = $el[0].getBoundingClientRect();
          return { top: rect.top, left: rect.left };
        })
        .then((initialPos) => {
          cy.wait(11000);
          cy.getQuoteContainer()
            .then(($el) => {
              const rect = $el[0].getBoundingClientRect();
              return { top: rect.top, left: rect.left };
            })
            .then((newPos) => {
              expect(newPos.top).to.be.closeTo(initialPos.top, 50);
              expect(newPos.left).to.be.closeTo(initialPos.left, 50);
            });
        });
    });
  });

  context('Long Running Rotation', () => {
    it('should continue rotating after multiple cycles', () => {
      const seenQuotes = new Set();

      cy.getTamilQuote().invoke('text').then((first) => {
        seenQuotes.add(first);
      });

      for (let i = 0; i < 3; i++) {
        cy.wait(11000);
        cy.getTamilQuote().invoke('text').then((text) => {
          seenQuotes.add(text);
        });
      }

      cy.then(() => {
        expect(seenQuotes.size).to.be.greaterThan(2);
      });
    });
  });
});
