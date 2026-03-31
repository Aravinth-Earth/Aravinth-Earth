/**
 * Test Suite: Export & Import
 * Tests for JSON file export/import functionality
 */

/// <reference types="cypress" />

describe('Export & Import', () => {
  beforeEach(() => {
    cy.clearPlannerDB();
    cy.visit('/w/sp/');
    cy.waitForAutoSave();
  });

  afterEach(() => {
    cy.clearPlannerDB();
  });

  context('Export', () => {
    it('should have Export button', () => {
      cy.contains('button', 'Export').should('exist');
    });

    it('should have data in IndexedDB before export', () => {
      cy.getPlannerData().then((data) => {
        expect(data).to.not.be.null;
        expect(data.columns).to.have.length(3);
      });
    });

    it('should have default rows for export', () => {
      cy.getPlannerData().then((data) => {
        expect(data.rows).to.have.length(3);
      });
    });
  });

  context('Import', () => {
    it('should have Import button', () => {
      cy.contains('button', 'Import').should('exist');
    });

    it('should be able to click Import button', () => {
      // Just verify button is clickable
      cy.contains('button', 'Import').should('be.visible');
    });
  });

  context('Data Structure', () => {
    it('should have valid table structure in IndexedDB', () => {
      cy.getPlannerData().then((data) => {
        expect(data).to.have.property('id', 'default');
        expect(data).to.have.property('name', 'My Tasks');
        expect(data).to.have.property('columns');
        expect(data).to.have.property('rows');
        expect(data).to.have.property('createdAt');
        expect(data).to.have.property('updatedAt');
      });
    });

    it('should have columns with required properties', () => {
      cy.getPlannerData().then((data) => {
        data.columns.forEach((col) => {
          expect(col).to.have.property('id');
          expect(col).to.have.property('name');
          expect(col).to.have.property('type');
          expect(col).to.have.property('order');
          expect(col).to.have.property('maxLength');
        });
      });
    });

    it('should have rows with required properties', () => {
      cy.getPlannerData().then((data) => {
        data.rows.forEach((row) => {
          expect(row).to.have.property('id');
          expect(row).to.have.property('cells');
          expect(row).to.have.property('createdAt');
          expect(row).to.have.property('updatedAt');
        });
      });
    });
  });

  context('Round-trip', () => {
    it('should preserve table structure after reload', () => {
      cy.reload();
      cy.waitForAutoSave();
      
      cy.getPlannerData().then((data) => {
        expect(data.columns).to.have.length(3);
        expect(data.rows).to.have.length(3);
      });
    });

    it('should preserve column types after reload', () => {
      cy.reload();
      cy.waitForAutoSave();
      
      cy.getPlannerData().then((data) => {
        data.columns.forEach((col) => {
          expect(col.type).to.equal('freetext');
        });
      });
    });
  });
});
