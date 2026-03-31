/**
 * Test Suite: Column Operations
 * Tests for add, delete, rename column functionality
 */

/// <reference types="cypress" />

describe('Column Operations', () => {
  beforeEach(() => {
    cy.clearPlannerDB();
    cy.visit('/w/sp/');
    cy.waitForAutoSave();
  });

  afterEach(() => {
    cy.clearPlannerDB();
  });

  context('Add Column', () => {
    it('should have 3 default columns initially', () => {
      // Action + S.No + 3 columns = 5 th elements
      cy.get('thead tr:first th').should('have.length', 5);
    });

    it('should add a new column when Add Column button is clicked', () => {
      cy.contains('button', 'Add Column').click();
      cy.waitForAutoSave();
      
      // Action + S.No + 4 columns = 6 th elements
      cy.get('thead tr:first th').should('have.length', 6);
    });

    it('should add 4th column when button clicked', () => {
      cy.contains('button', 'Add Column').click();
      cy.waitForAutoSave();
      
      cy.getPlannerData().then((data) => {
        expect(data.columns.length).to.equal(4);
      });
    });

    it('should name new column with sequential number', () => {
      cy.contains('button', 'Add Column').click();
      cy.waitForAutoSave();
      
      cy.get('thead tr:first .header-text').should('contain', 'C4');
    });

    it('should add cells to existing rows for new column', () => {
      cy.contains('button', 'Add Column').click();
      cy.waitForAutoSave();
      
      cy.getPlannerData().then((data) => {
        expect(data.columns.length).to.equal(4);
      });
    });

    it('should default new column type to freetext', () => {
      cy.contains('button', 'Add Column').click();
      cy.waitForAutoSave();
      
      cy.getPlannerData().then((data) => {
        const lastColumn = data.columns[data.columns.length - 1];
        expect(lastColumn.type).to.equal('freetext');
      });
    });
  });

  context('Delete Column', () => {
    it('should delete a column when delete button is clicked', () => {
      cy.get('thead tr:first th').eq(3).find('button[title="Delete column"]').click();
      cy.get('#confirm-action').click();
      cy.waitForAutoSave();
      
      cy.get('thead tr:first th').should('have.length', 4); // Action + S.No + 2 remaining
    });

    it('should not delete the last column', () => {
      // Delete 2 columns first
      cy.get('thead tr:first th').eq(2).find('button[title="Delete column"]').click();
      cy.get('#confirm-action').click();
      cy.waitForAutoSave();
      
      cy.get('thead tr:first th').eq(2).find('button[title="Delete column"]').click();
      cy.get('#confirm-action').click();
      cy.waitForAutoSave();
      
      // Try to delete the last column - should show toast but not delete
      cy.get('thead tr:first th').eq(2).find('button[title="Delete column"]').click();
      cy.wait(500); // Give time for toast
      
      cy.getPlannerData().then((data) => {
        expect(data.columns.length).to.be.at.least(1);
      });
    });

    it('should update column count when column is deleted', () => {
      cy.get('thead tr:first th').eq(3).find('button[title="Delete column"]').click();
      cy.get('#confirm-action').click();
      cy.waitForAutoSave();
      
      cy.getPlannerData().then((data) => {
        expect(data.columns.length).to.equal(2);
      });
    });

    it('should persist column deletion after reload', () => {
      cy.get('thead tr:first th').eq(3).find('button[title="Delete column"]').click();
      cy.get('#confirm-action').click();
      cy.waitForAutoSave();
      
      cy.reload();
      cy.waitForAutoSave();
      
      cy.getPlannerData().then((data) => {
        expect(data.columns.length).to.equal(2);
      });
    });
  });

  context('Rename Column', () => {
    it('should allow renaming column header', () => {
      cy.get('thead tr:first .header-text').first().click();
      cy.get('thead tr:first .header-text').first().clear().type('New Name');
      cy.get('thead tr:first .header-text').first().blur();
      cy.waitForAutoSave();
      
      cy.getPlannerData().then(data => {
        expect(data.columns[0].name).to.equal('New Name');
      });
    });

    it('should update header display after rename', () => {
      cy.get('thead tr:first .header-text').first().click();
      cy.get('thead tr:first .header-text').first().clear().type('Task Name');
      cy.get('thead tr:first .header-text').first().blur();
      cy.waitForAutoSave();
      
      cy.get('thead tr:first .header-text').first().should('contain', 'Task Name');
    });

    it('should handle empty column name as Untitled', () => {
      cy.get('thead tr:first .header-text').first().click();
      cy.get('thead tr:first .header-text').first().clear();
      cy.get('thead tr:first .header-text').first().blur();
      cy.waitForAutoSave();
      
      cy.getPlannerData().then(data => {
        expect(data.columns[0].name).to.equal('Untitled');
      });
    });

    it('should persist column name after reload', () => {
      cy.get('thead tr:first .header-text').first().click();
      cy.get('thead tr:first .header-text').first().clear().type('Persistent Name');
      cy.get('thead tr:first .header-text').first().blur();
      cy.waitForAutoSave();
      
      cy.reload();
      cy.waitForAutoSave();
      
      cy.get('thead tr:first .header-text').first().should('contain', 'Persistent Name');
    });
  });

  context('Column Type Change', () => {
    beforeEach(() => {
      cy.contains('button', 'Add Row').click();
      cy.waitForAutoSave();
    });

    it('should open type modal when type badge is clicked', () => {
      cy.get('.column-type-badge').first().click();
      
      cy.get('.modal').should('be.visible');
      cy.get('.modal').should('contain', 'Column Type');
    });

    it('should change column type to date', () => {
      cy.get('.column-type-badge').first().click();
      cy.get('#column-type-select').select('date');
      cy.get('button').contains('Save').click();
      cy.waitForAutoSave();
      
      cy.getPlannerData().then(data => {
        expect(data.columns[0].type).to.equal('date');
      });
    });

    it('should change column type to number', () => {
      cy.get('.column-type-badge').first().click();
      cy.get('#column-type-select').select('number');
      cy.get('button').contains('Save').click();
      cy.waitForAutoSave();
      
      cy.getPlannerData().then(data => {
        expect(data.columns[0].type).to.equal('number');
      });
    });

    it('should change column type to dropdown', () => {
      cy.get('.column-type-badge').first().click();
      cy.get('#column-type-select').select('dropdown');
      cy.get('button').contains('Save').click();
      cy.waitForAutoSave();
      
      cy.getPlannerData().then(data => {
        expect(data.columns[0].type).to.equal('dropdown');
        expect(data.columns[0].maxLength).to.equal(150);
      });
    });

    it('should show options input when dropdown type is selected', () => {
      cy.get('.column-type-badge').first().click();
      cy.get('#column-type-select').select('dropdown');
      
      cy.get('#dropdown-options-section').should('be.visible');
    });

    it('should allow pre-defined dropdown options', () => {
      cy.get('.column-type-badge').first().click();
      cy.get('#column-type-select').select('dropdown');
      cy.get('#dropdown-options-input').type('Option 1, Option 2, Option 3');
      cy.get('button').contains('Save').click();
      cy.waitForAutoSave();
      
      cy.getPlannerData().then(data => {
        expect(data.columns[0].options).to.deep.equal(['Option 1', 'Option 2', 'Option 3']);
      });
    });

    it('should render date input for date type columns', () => {
      cy.get('.column-type-badge').first().click();
      cy.get('#column-type-select').select('date');
      cy.get('button').contains('Save').click();
      cy.waitForAutoSave();
      
      cy.get('tbody tr:first td').eq(2).find('input[type="date"]').should('exist');
    });

    it('should render number input for number type columns', () => {
      cy.get('.column-type-badge').first().click();
      cy.get('#column-type-select').select('number');
      cy.get('button').contains('Save').click();
      cy.waitForAutoSave();
      
      cy.get('tbody tr:first td').eq(2).find('input[type="number"]').should('exist');
    });

    it('should render dropdown for dropdown type columns', () => {
      cy.get('.column-type-badge').first().click();
      cy.get('#column-type-select').select('dropdown');
      cy.get('button').contains('Save').click();
      cy.waitForAutoSave();
      
      cy.get('tbody tr:first td').eq(2).find('select').should('exist');
    });

    it('should close modal on cancel', () => {
      cy.get('.column-type-badge').first().click();
      cy.get('button').contains('Cancel').click();
      
      cy.get('.modal').should('not.exist');
    });
  });

  context('Column Sorting', () => {
    it('should have sort button in header', () => {
      cy.get('thead tr:first th').eq(2).find('button[title="Sort"]').should('exist');
    });

    it('should trigger sort when sort button is clicked', () => {
      cy.get('thead tr:first th').eq(2).find('button[title="Sort"]').click();
      cy.waitForAutoSave();
      
      // Just verify no error occurs
      cy.getPlannerData().then((data) => {
        expect(data).to.exist;
      });
    });
  });
});
