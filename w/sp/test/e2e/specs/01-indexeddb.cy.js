/**
 * Test Suite: IndexedDB Data Persistence
 * Tests for auto-save, data integrity, and persistence
 */

/// <reference types="cypress" />

describe('IndexedDB Data Persistence', () => {
  beforeEach(() => {
    cy.clearPlannerDB();
    cy.visit('/w/sp/');
    cy.waitForAutoSave();
  });

  afterEach(() => {
    cy.clearPlannerDB();
  });

  context('Initial Load & Creation', () => {
    it('should create default table on first load', () => {
      cy.getPlannerData().then((data) => {
        expect(data).to.not.be.null;
        expect(data.id).to.equal('default');
        expect(data.name).to.equal('My Tasks');
      });
    });

    it('should have 3 default columns', () => {
      cy.getPlannerData().then((data) => {
        expect(data.columns).to.have.length(3);
        expect(data.columns[0].name).to.equal('C1');
        expect(data.columns[1].name).to.equal('C2');
        expect(data.columns[2].name).to.equal('C3');
      });
    });

    it('should have default column type as freetext', () => {
      cy.getPlannerData().then((data) => {
        data.columns.forEach((col) => {
          expect(col.type).to.equal('freetext');
        });
      });
    });

    it('should have maxLength of 500 for freetext columns', () => {
      cy.getPlannerData().then((data) => {
        data.columns.forEach((col) => {
          expect(col.maxLength).to.equal(500);
        });
      });
    });
  });

  context('Auto-Save Behavior', () => {
    it('should auto-save when adding a row', () => {
      cy.get('#save-status').should('have.class', 'saved');
      
      cy.contains('button', 'Add Row').click();
      cy.waitForAutoSave();
      
      cy.getPlannerData().then((data) => {
        expect(data.rows).to.have.length(4); // 3 default + 1 new
      });
    });

    it('should persist data after reload', () => {
      cy.contains('button', 'Add Row').click();
      cy.waitForAutoSave();
      
      cy.reload();
      cy.waitForAutoSave();
      
      cy.getPlannerData().then((data) => {
        expect(data.rows).to.have.length(4); // 3 default + 1 new
      });
    });

    it('should update updatedAt timestamp on changes', () => {
      cy.getPlannerData().then((initialData) => {
        const initialUpdatedAt = initialData.updatedAt;
        
        cy.wait(100);
        cy.contains('button', 'Add Row').click();
        cy.waitForAutoSave();
        
        cy.getPlannerData().then((updatedData) => {
          expect(updatedData.updatedAt).to.not.equal(initialUpdatedAt);
        });
      });
    });
  });

  context('Timestamp Management', () => {
    it('should set createdAt on row creation', () => {
      cy.contains('button', 'Add Row').click();
      cy.waitForAutoSave();
      
      cy.getPlannerData().then((data) => {
        expect(data.rows[0].createdAt).to.be.a('string');
        expect(data.rows[0].createdAt).to.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
      });
    });

    it('should set updatedAt on row creation', () => {
      cy.contains('button', 'Add Row').click();
      cy.waitForAutoSave();
      
      cy.getPlannerData().then((data) => {
        expect(data.rows[0].updatedAt).to.be.a('string');
      });
    });

    it('should have correct cell structure per column', () => {
      cy.getPlannerData().then((data) => {
        data.rows.forEach((row) => {
          data.columns.forEach((col) => {
            expect(row.cells[col.id]).to.exist;
            expect(row.cells[col.id]).to.have.property('value');
            expect(row.cells[col.id]).to.have.property('updatedAt');
          });
        });
      });
    });
  });

  context('Data Structure Integrity', () => {
    it('should generate unique IDs for columns', () => {
      cy.getPlannerData().then((data) => {
        const ids = data.columns.map((c) => c.id);
        const uniqueIds = [...new Set(ids)];
        expect(uniqueIds).to.have.length(ids.length);
      });
    });

    it('should generate unique IDs for rows', () => {
      cy.contains('button', 'Add Row').click();
      cy.contains('button', 'Add Row').click();
      cy.waitForAutoSave();
      
      cy.getPlannerData().then((data) => {
        const ids = data.rows.map((r) => r.id);
        const uniqueIds = [...new Set(ids)];
        expect(uniqueIds).to.have.length(ids.length);
      });
    });
  });
});
