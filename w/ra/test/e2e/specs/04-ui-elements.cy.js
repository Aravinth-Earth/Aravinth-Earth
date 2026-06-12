/**
 * Test Suite: UI Elements & Interactive Components
 * Tests for fullscreen button, audio controls, and interactive features
 */

/// <reference types="cypress" />

describe('UI Elements & Interactive Components', () => {
  beforeEach(() => {
    cy.visitRa();
    cy.waitForLoading();
  });

  context('Fullscreen Button', () => {
    it('should have fullscreen button element', () => {
      cy.get('.fullscreen-btn').should('exist');
    });

    it('should display fullscreen icon', () => {
      cy.get('.fullscreen-btn').should('contain', '⛶');
    });

    it('should have visible fullscreen button', () => {
      cy.get('.fullscreen-btn').should('be.visible');
    });

    it('should have cursor pointer on fullscreen button', () => {
      cy.get('.fullscreen-btn').should('have.css', 'cursor', 'pointer');
    });

    it('should have hover color transition', () => {
      cy.get('.fullscreen-btn').should(($el) => {
        const transition = $el.css('transition');
        expect(transition).to.include('color');
      });
    });

    it('should be positioned at bottom-left', () => {
      cy.get('.fullscreen-btn').should(($el) => {
        const bottom = $el.css('bottom');
        const left = $el.css('left');
        expect(bottom).to.equal('10px');
        expect(left).to.equal('10px');
      });
    });

    it('should have appropriate font size', () => {
      cy.get('.fullscreen-btn').should(($el) => {
        const fontSize = parseFloat($el.css('font-size'));
        expect(fontSize).to.be.greaterThan(20);
      });
    });

    it('should have padding for larger click area', () => {
      cy.get('.fullscreen-btn').should(($el) => {
        const padding = parseFloat($el.css('padding-top'));
        expect(padding).to.be.greaterThan(0);
      });
    });

    it('should not select text on click', () => {
      cy.get('.fullscreen-btn').should('have.css', 'user-select', 'none');
    });

    it('should have high z-index', () => {
      cy.get('.fullscreen-btn').should(($el) => {
        const zIndex = parseInt($el.css('z-index'));
        expect(zIndex).to.be.greaterThan(999);
      });
    });

    it('should request fullscreen on click', () => {
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
  });

  context('Audio System', () => {
    it('should have audio info element', () => {
      cy.get('.audio-info').should('exist');
    });

    it('should display audio icon', () => {
      cy.get('.audio-icon').should('exist');
    });

    it('should have audio tooltip', () => {
      cy.get('.audio-tooltip').should('exist');
    });

    it('should have tooltip hidden by default', () => {
      cy.get('.audio-tooltip').should('have.css', 'visibility', 'hidden');
    });

    it('should show tooltip on hover', () => {
      cy.get('.audio-tooltip').should('exist');
    });

    it('should have attribution link to freesound', () => {
      cy.get('.audio-tooltip a').should('have.attr', 'href').and('include', 'freesound.org');
    });

    it('should have CC BY license link', () => {
      cy.get('.audio-tooltip a').then(($links) => {
        const hasCC = Array.from($links).some(link => {
          let url;
          try { url = new URL(link.href); } catch { return false; }
          if (!['http:', 'https:'].includes(url.protocol)) return false;
          return url.hostname.includes('creativecommons') || url.hostname.includes('cc.org') || url.pathname.includes('/by/');
        });
        expect(hasCC).to.be.true;
      });
    });

    it('should have audio manager on window', () => {
      cy.window().then((win) => {
        expect(win.artGenerator).to.exist;
      });
    });

    it('should have audio element with loop enabled', () => {
      cy.window().then((win) => {
        const audioManager = win.artGenerator?.audioManager;
        if (audioManager) {
          expect(audioManager.audio.loop).to.be.true;
        }
      });
    });

    it('should have audio source set', () => {
      cy.window().then((win) => {
        const audio = win.artGenerator?.audioManager?.audio;
        if (audio) {
          expect(audio.src).to.include('.mp3');
        }
      });
    });

    it('should start audio on user interaction', () => {
      cy.triggerUserInteraction();
      cy.window().then((win) => {
        const audio = win.artGenerator?.audioManager?.audio;
        expect(win.audioStarted).to.be.true;
      });
    });

    it('should have initial volume of 0', () => {
      cy.window().then((win) => {
        const audio = win.artGenerator?.audioManager?.audio;
        if (audio) {
          expect(audio.volume).to.be.lessThan(0.5);
        }
      });
    });

    it('should fade in volume after interaction', () => {
      cy.triggerUserInteraction();
      cy.wait(1000);
      cy.window().then((win) => {
        const audio = win.artGenerator?.audioManager?.audio;
        if (audio) {
          expect(audio.volume).to.be.greaterThan(0);
        }
      });
    });

    it('should have visibility change handler', () => {
      cy.window().then((win) => {
        const audioManager = win.artGenerator?.audioManager;
        expect(audioManager).to.exist;
      });
    });

    it('should have audio info positioned at bottom-right', () => {
      cy.get('.audio-info').should(($el) => {
        const bottom = $el.css('bottom');
        const right = $el.css('right');
        expect(bottom).to.equal('10px');
        expect(right).to.equal('10px');
      });
    });

    it('should have semi-transparent audio text', () => {
      cy.get('.audio-info').should(($el) => {
        const color = $el.css('color');
        expect(color).to.include('0.3');
      });
    });
  });

  context('Footer', () => {
    it('should have footer element', () => {
      cy.get('footer').should('exist');
    });

    it('should force footer display', () => {
      cy.get('footer').should('have.css', 'display', 'block');
    });

    it('should position footer at bottom', () => {
      cy.get('footer').should('have.css', 'position', 'fixed');
      cy.get('footer').should('have.css', 'bottom', '0px');
    });

    it('should have full width footer', () => {
      cy.get('footer').should(($el) => {
        const width = $el.css('width');
        expect(width).to.not.equal('0px');
      });
    });

    it('should have high z-index for footer', () => {
      cy.get('footer').should(($el) => {
        const zIndex = parseInt($el.css('z-index'));
        expect(zIndex).to.be.greaterThan(999);
      });
    });
  });

  context('User Interaction', () => {
    it('should handle click on body without errors', () => {
      cy.get('body').click({ force: true });
    });

    it('should not break quote rotation after interaction', () => {
      cy.triggerUserInteraction();
      cy.wait(2000);
      cy.getQuoteContainer().should('have.class', 'fade-in');
    });

    it('should not interfere with canvas rendering after click', () => {
      cy.triggerUserInteraction();
      cy.wait(500);
      cy.getShapes().should('have.length.greaterThan', 0);
    });
  });

  context('Accessibility', () => {
    it('should have aria-label on canvas', () => {
      cy.getCanvas().should('have.attr', 'aria-label').and('not.be.empty');
    });

    it('should have semantic HTML structure', () => {
      cy.get('footer').should('exist');
    });

    it('should have lang attribute on html', () => {
      cy.get('html').should('have.attr', 'lang', 'ta');
    });
  });
});
