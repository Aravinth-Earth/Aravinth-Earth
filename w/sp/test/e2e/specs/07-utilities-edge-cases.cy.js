/**
 * Test Suite: Utilities & Edge Cases
 * Tests for clear table, error handling, and UI responsiveness
 */

/// <reference types="cypress" />

describe('Utilities & Edge Cases', () => {
  beforeEach(() => {
    cy.clearPlannerDB();
    cy.visit('/w/sp/');
    cy.waitForAutoSave();
  });

  afterEach(() => {
    cy.clearPlannerDB();
  });

  context('Clear Table', () => {
    it('should have Clear Table button', () => {
      cy.contains('button', 'Clear Table').should('exist');
    });

    it('should clear table when Clear Table button is clicked', () => {
      cy.contains('button', 'Clear Table').click();
      cy.waitForAutoSave();
      
      cy.getPlannerData().then((data) => {
        expect(data.columns).to.have.length(3);
        expect(data.rows).to.have.length(3); // Default rows added after clear
      });
    });
  });

  context('Toast Notifications', () => {
    it('should have status indicator', () => {
      cy.get('#save-status').should('exist');
    });

    it('should show save status after changes', () => {
      cy.contains('button', 'Add Row').click();
      cy.get('#save-status').should('exist');
    });
  });

  context('Status Indicator', () => {
    it('should show save status after changes', () => {
      cy.contains('button', 'Add Row').click();
      
      cy.get('#save-status').should('exist');
    });
  });

  context('Responsive Design', () => {
    it('should render correctly on desktop viewport', () => {
      cy.viewport(1280, 720);
      cy.visit('/w/sp/');
      cy.waitForAutoSave();
      
      cy.get('.container').should('be.visible');
      cy.get('table').should('be.visible');
    });

    it('should render correctly on mobile viewport', () => {
      cy.viewport(375, 667);
      cy.visit('/w/sp/');
      cy.waitForAutoSave();
      
      cy.get('.container').should('be.visible');
      cy.get('table').should('be.visible');
    });
  });

  context('Keyboard Shortcuts', () => {
    it('should have working Ctrl+S', () => {
      cy.contains('button', 'Add Row').click();
      cy.waitForAutoSave();
      
      cy.get('body').type('{ctrl+s}');
      cy.wait(300);
      
      // Verify no error - save should work
      cy.getPlannerData().then((data) => {
        expect(data).to.exist;
      });
    });
  });

  context('Empty States', () => {
    it('should have action buttons after clear', () => {
      cy.contains('button', 'Clear Table').click();
      cy.waitForAutoSave();
      
      cy.get('tbody tr').should('exist');
    });
  });

  context('Data Validation', () => {
    it('should have maxLength on freetext columns', () => {
      cy.getPlannerData().then((data) => {
        data.columns.forEach((col) => {
          if (col.type === 'freetext') {
            expect(col.maxLength).to.equal(500);
          }
        });
      });
    });

    it('should have maxLength of 150 for dropdown columns', () => {
      cy.get('.column-type-badge').first().click();
      cy.get('#column-type-select').select('dropdown');
      cy.get('button').contains('Save').click();
      cy.waitForAutoSave();
      
      cy.getPlannerData().then((data) => {
        expect(data.columns[0].maxLength).to.equal(150);
      });
    });
  });

  context('Unique ID Generation', () => {
    it('should have unique IDs for columns', () => {
      cy.getPlannerData().then((data) => {
        const ids = data.columns.map((c) => c.id);
        const uniqueIds = [...new Set(ids)];
        expect(ids.length).to.equal(uniqueIds.length);
      });
    });

    it('should have unique IDs for rows', () => {
      cy.getPlannerData().then((data) => {
        const ids = data.rows.map((r) => r.id);
        const uniqueIds = [...new Set(ids)];
        expect(ids.length).to.equal(uniqueIds.length);
      });
    });
  });
});
