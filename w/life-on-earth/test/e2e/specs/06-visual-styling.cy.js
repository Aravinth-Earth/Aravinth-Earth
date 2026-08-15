/**
 * Test Suite: Visual Styling & CSS Properties
 * Tests for glassmorphism, animations, colors, and visual effects
 */

/// <reference types="cypress" />

describe('Visual Styling & CSS Properties', () => {
  beforeEach(() => {
    cy.visitRa();
    cy.waitForLoading();
    cy.waitForQuote();
  });

  context('Background & Body', () => {
    it('should have black background', () => {
      cy.get('body').should(($el) => {
        const bg = $el.css('background-color');
        expect(bg).to.include('0');
      });
    });

    it('should have radial gradient background', () => {
      cy.get('body').should(($el) => {
        const bgImage = $el.css('background-image');
        expect(bgImage).to.include('radial-gradient');
      });
    });

    it('should have no overflow on body', () => {
      cy.get('body').should('have.css', 'overflow', 'hidden');
    });

    it('should have no margin on body', () => {
      cy.get('body').should(($el) => {
        const margin = parseFloat($el.css('margin-top'));
        expect(margin).to.equal(0);
      });
    });
  });

  context('SVG Canvas', () => {
    it('should have full viewport width', () => {
      cy.getCanvas().should('have.css', 'width');
    });

    it('should have full viewport height', () => {
      cy.getCanvas().should('have.css', 'height');
    });

    it('should have shapes with varying sizes', () => {
      cy.getShapes().should('have.length.greaterThan', 5);
    });

    it('should have shapes with varying positions', () => {
      cy.getShapes().then(($shapes) => {
        expect($shapes.length).to.be.greaterThan(5);
      });
    });

    it('should have shapes with HSL colors', () => {
      cy.getShapes().first().should(($el) => {
        const fill = $el.attr('fill');
        expect(fill).to.match(/hsla?/);
      });
    });

    it('should have glow gradient definition', () => {
      cy.get('#glow stop').first().should('have.attr', 'stop-color', 'white');
      cy.get('#glow stop').first().should('have.attr', 'stop-opacity', '0.3');
    });
  });

  context('Glassmorphism Card', () => {
    it('should have semi-transparent background', () => {
      cy.getQuoteContainer().should(($el) => {
        const bg = $el.css('background-color');
        expect(bg).to.include('0.06');
      });
    });

    it('should have backdrop blur effect', () => {
      cy.getQuoteContainer().should(($el) => {
        const blur = $el.css('backdrop-filter') || $el.css('-webkit-backdrop-filter');
        expect(blur).to.include('blur');
        expect(blur).to.include('12px');
      });
    });

    it('should have subtle border', () => {
      cy.getQuoteContainer().should(($el) => {
        const borderColor = $el.css('border-top-color');
        const borderWidth = parseFloat($el.css('border-top-width'));
        expect(borderWidth).to.be.greaterThan(0);
        expect(borderColor).to.include('255');
      });
    });

    it('should have box shadow for depth', () => {
      cy.getQuoteContainer().should(($el) => {
        const shadow = $el.css('box-shadow');
        expect(shadow).to.not.equal('none');
      });
    });

    it('should have rounded corners', () => {
      cy.getQuoteContainer().should(($el) => {
        const radius = parseFloat($el.css('border-radius'));
        expect(radius).to.be.greaterThan(10);
      });
    });

    it('should have smooth transition property', () => {
      cy.getQuoteContainer().should(($el) => {
        const transition = $el.css('transition');
        expect(transition).to.include('opacity');
      });
    });
  });

  context('Quote Divider', () => {
    it('should have gradient background', () => {
      cy.getQuoteDivider().should(($el) => {
        const bg = $el.css('background-image');
        expect(bg).to.include('linear-gradient');
      });
    });

    it('should be centered', () => {
      cy.getQuoteDivider().then(($el) => {
        const rect = $el[0].getBoundingClientRect();
        cy.window().then((win) => {
          const centerX = win.innerWidth / 2;
          const dividerCenter = rect.left + rect.width / 2;
          expect(Math.abs(dividerCenter - centerX)).to.be.lessThan(10);
        });
      });
    });

    it('should have fixed width', () => {
      cy.getQuoteDivider().should(($el) => {
        const width = parseFloat($el.css('width'));
        expect(width).to.be.closeTo(60, 5);
      });
    });

    it('should have 1px height', () => {
      cy.getQuoteDivider().should(($el) => {
        const height = parseFloat($el.css('height'));
        expect(height).to.equal(1);
      });
    });

    it('should have semi-transparent white color', () => {
      cy.getQuoteDivider().should(($el) => {
        const bg = $el.css('background-image');
        expect(bg).to.include('0.4');
      });
    });
  });

  context('Typography', () => {
    it('should use Noto Sans Tamil for Tamil text', () => {
      cy.getTamilQuote().should(($el) => {
        const fontFamily = $el.css('font-family');
        expect(fontFamily).to.include('Noto Sans Tamil');
      });
    });

    it('should use Georgia serif for English text', () => {
      cy.getEnglishQuote().should(($el) => {
        const fontFamily = $el.css('font-family');
        expect(fontFamily).to.include('Georgia');
      });
    });

    it('should have italic style for English quote', () => {
      cy.getEnglishQuote().should('have.css', 'font-style', 'italic');
    });

    it('should have normal weight for Tamil text', () => {
      cy.getTamilQuote().should(($el) => {
        const weight = $el.css('font-weight');
        expect(weight).to.equal('400');
      });
    });

    it('should have appropriate letter spacing for Tamil', () => {
      cy.getTamilQuote().should(($el) => {
        const spacing = parseFloat($el.css('letter-spacing'));
        expect(spacing).to.be.greaterThan(0);
      });
    });

    it('should have high contrast text color', () => {
      cy.getTamilQuote().should(($el) => {
        const color = $el.css('color');
        expect(color).to.include('255');
      });
    });

    it('should have slightly dimmer English text', () => {
      cy.getEnglishQuote().should(($el) => {
        const color = $el.css('color');
        expect(color).to.include('255');
      });
    });
  });

  context('Source Attribution Styling', () => {
    it('should have muted color for source text', () => {
      cy.getQuoteSource().should(($el) => {
        const color = $el.css('color');
        expect(color).to.include('0.45');
      });
    });

    it('should have small font size for source', () => {
      cy.getQuoteSource().should(($el) => {
        const fontSize = parseFloat($el.css('font-size'));
        expect(fontSize).to.be.lessThan(15);
      });
    });

    it('should have italic style for source', () => {
      cy.getQuoteSource().should('have.css', 'font-style', 'italic');
    });

    it('should have letter spacing for source', () => {
      cy.getQuoteSource().should(($el) => {
        const spacing = parseFloat($el.css('letter-spacing'));
        expect(spacing).to.be.greaterThan(0);
      });
    });
  });

  context('Animation Classes', () => {
    it('should have fade-in class when visible', () => {
      cy.getQuoteContainer().should('have.class', 'fade-in');
    });

    it('should have no blur when in fade-in state', () => {
      cy.getQuoteContainer().should(($container) => {
        const filter = $container.css('filter');
        expect(filter === 'none' || filter === 'blur(0px)').to.be.true;
      });
    });

    it('should have translateY(0) when in fade-in state', () => {
      cy.getQuoteContainer().should(($el) => {
        const transform = $el.css('transform');
        expect(transform).to.not.equal('matrix(0, 0, 0, 0, 0, 0)');
      });
    });

    it('should have cubic-bezier easing for transitions', () => {
      cy.getQuoteContainer().should(($el) => {
        const transition = $el.css('transition');
        expect(transition).to.include('cubic-bezier');
      });
    });
  });

  context('Z-Index Layering', () => {
    it('should have quote container above canvas', () => {
      cy.getQuoteContainer().should(($el) => {
        const zIndex = parseInt($el.css('z-index'));
        expect(zIndex).to.be.greaterThan(0);
      });
    });

    it('should have footer above everything', () => {
      cy.get('footer').should(($el) => {
        const zIndex = parseInt($el.css('z-index'));
        expect(zIndex).to.be.greaterThan(999);
      });
    });

    it('should have fullscreen button with high z-index', () => {
      cy.get('.fullscreen-btn').should(($el) => {
        const zIndex = parseInt($el.css('z-index'));
        expect(zIndex).to.be.greaterThan(999);
      });
    });
  });

  context('Color Palette', () => {
    it('should use white text on dark background', () => {
      cy.getTamilQuote().should(($el) => {
        const color = $el.css('color');
        expect(color).to.include('255');
      });
    });

    it('should have dark box shadow', () => {
      cy.getQuoteContainer().should(($el) => {
        const shadow = $el.css('box-shadow');
        expect(shadow).to.include('0, 0, 0');
      });
    });
  });
});
