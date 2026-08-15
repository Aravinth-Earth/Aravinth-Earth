/**
 * Test Suite: Row Operations
 * Tests for add, delete, move row functionality
 */

/// <reference types="cypress" />

describe('Row Operations', () => {
  beforeEach(() => {
    cy.clearPlannerDB();
    cy.visit('/w/daily-planner/');
    cy.waitForAutoSave();
  });

  afterEach(() => {
    cy.clearPlannerDB();
  });

  context('Add Row', () => {
    it('should add a new row when Add Row button is clicked', () => {
      cy.contains('button', 'Add Row').click();
      cy.waitForAutoSave();
      
      cy.get('tbody tr').should('have.length', 4); // 3 default + 1 new
    });

    it('should add multiple rows sequentially', () => {
      cy.contains('button', 'Add Row').click();
      cy.contains('button', 'Add Row').click();
      cy.waitForAutoSave();
      
      cy.get('tbody tr').should('have.length', 5); // 3 default + 2 new
    });

    it('should assign sequential serial numbers', () => {
      cy.get('tbody tr td:nth-child(2)').each((cell, index) => {
        expect(cell).to.have.text(String(index + 1));
      });
    });

    it('should create cells for each column', () => {
      cy.get('tbody tr:first td').should('have.length.greaterThan', 2);
    });

    it('should update IndexedDB when row is added', () => {
      const initialCount = 3;
      cy.contains('button', 'Add Row').click();
      cy.waitForAutoSave();
      
      cy.getPlannerData().then((data) => {
        expect(data.rows).to.have.length(initialCount + 1);
        expect(data.rows[0].cells).to.be.an('object');
      });
    });
  });

  context('Delete Row', () => {
    it('should delete a row when delete button is clicked', () => {
      const initialCount = 3;
      cy.get('tbody tr:first button[title="Delete row"]').click();
      cy.waitForAutoSave();
      
      cy.get('tbody tr').should('have.length', initialCount - 1);
    });

    it('should renumber serial numbers after deletion', () => {
      cy.get('tbody tr:first button[title="Delete row"]').click();
      cy.waitForAutoSave();
      
      cy.get('tbody tr td:nth-child(2)').each((cell, index) => {
        expect(cell).to.have.text(String(index + 1));
      });
    });

    it('should persist deletion after reload', () => {
      cy.get('tbody tr:first button[title="Delete row"]').click();
      cy.waitForAutoSave();
      
      cy.reload();
      cy.waitForAutoSave();
      
      cy.get('tbody tr').should('have.length', 2);
    });
  });

  context('Move Row', () => {
    it('should move row down and swap row positions in IndexedDB', () => {
      // Get row IDs before move
      cy.getPlannerData().then((data) => {
        const firstRowId = data.rows[0].id;
        const secondRowId = data.rows[1].id;
        
        // Move first row down
        cy.get('tbody tr').eq(0).find('button[title="Move down"]').click();
        cy.waitForAutoSave();
        
        // Verify rows swapped in IndexedDB
        cy.getPlannerData().then((newData) => {
          expect(newData.rows[0].id).to.equal(secondRowId);
          expect(newData.rows[1].id).to.equal(firstRowId);
        });
      });
    });

    it('should move row up and swap row positions in IndexedDB', () => {
      // Get row IDs before move
      cy.getPlannerData().then((data) => {
        const firstRowId = data.rows[0].id;
        const secondRowId = data.rows[1].id;
        
        // Move second row up
        cy.get('tbody tr').eq(1).find('button[title="Move up"]').click();
        cy.waitForAutoSave();
        
        // Verify rows swapped in IndexedDB
        cy.getPlannerData().then((newData) => {
          expect(newData.rows[0].id).to.equal(secondRowId);
          expect(newData.rows[1].id).to.equal(firstRowId);
        });
      });
    });

    it('should not move first row up (first row up button is disabled)', () => {
      // Verify the up button on first row is disabled
      cy.get('tbody tr').eq(0).find('[data-action="move-row"][data-direction="up"]')
        .should('be.disabled')
        .and('have.class', 'disabled');
      
      // Verify the row order is unchanged
      cy.getPlannerData().then((data) => {
        expect(data.rows.length).to.equal(3);
      });
    });

    it('should not move last row down (last row down button is disabled)', () => {
      // Verify the down button on last row is disabled
      cy.get('tbody tr').eq(2).find('[data-action="move-row"][data-direction="down"]')
        .should('be.disabled')
        .and('have.class', 'disabled');
      
      // Verify the row order is unchanged
      cy.getPlannerData().then((data) => {
        expect(data.rows.length).to.equal(3);
      });
    });

    it('should persist row order after reload', () => {
      // Get original second row ID
      cy.getPlannerData().then((data) => {
        const originalSecondRowId = data.rows[1].id;
        
        // Move first row down
        cy.get('tbody tr').eq(0).find('button[title="Move down"]').click();
        cy.waitForAutoSave();
        
        // Reload and verify order persisted
        cy.reload();
        cy.waitForAutoSave();
        
        // Original second row should now be first
        cy.getPlannerData().then((newData) => {
          expect(newData.rows[0].id).to.equal(originalSecondRowId);
        });
      });
    });

    it('should have disabled up arrow on first row', () => {
      cy.get('tbody tr').eq(0).find('button[title*="Move up"]').should('be.disabled');
      cy.get('tbody tr').eq(0).find('button[title*="Move up"]').should('have.class', 'disabled');
    });

    it('should have disabled down arrow on last row', () => {
      cy.get('tbody tr').eq(2).find('button[title*="Move down"]').should('be.disabled');
      cy.get('tbody tr').eq(2).find('button[title*="Move down"]').should('have.class', 'disabled');
    });

    it('should have enabled arrows on middle rows', () => {
      cy.get('tbody tr').eq(1).find('button[title="Move up"]').should('not.be.disabled');
      cy.get('tbody tr').eq(1).find('button[title="Move down"]').should('not.be.disabled');
    });
  });

  context('Cell Editing', () => {
    it('should have contenteditable cells for freetext columns', () => {
      cy.get('tbody td[contenteditable="true"]').should('exist');
    });

    it('should have rows in IndexedDB', () => {
      cy.getPlannerData().then((data) => {
        expect(data.rows.length).to.be.greaterThan(0);
      });
    });
  });

  context('Empty State', () => {
    it('should start with 3 default rows', () => {
      cy.get('tbody tr').should('have.length', 3);
    });

    it('should show action buttons in each row', () => {
      cy.get('tbody tr:first').find('[data-action="move-row"][data-direction="up"]').should('exist');
      cy.get('tbody tr:first').find('[data-action="move-row"][data-direction="down"]').should('exist');
      cy.get('tbody tr:first').find('button[title="Delete row"]').should('exist');
    });
  });
});
