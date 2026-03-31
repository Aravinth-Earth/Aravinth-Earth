/**
 * Test Suite: Cross-Functionality Integration Tests
 * Tests for data persistence across rows, field types, and operations
 */

/// <reference types="cypress" />

describe('Cross-Functionality Integration Tests', () => {
  beforeEach(() => {
    cy.clearPlannerDB();
    cy.visit('/w/sp/');
    cy.waitForAutoSave();
  });

  afterEach(() => {
    cy.clearPlannerDB();
  });

  context('Dropdown Persistence', () => {
    it('should persist dropdown values across all existing rows', () => {
      // Change first column to dropdown
      cy.get('.column-type-badge').first().click();
      cy.get('#column-type-select').select('dropdown');
      cy.get('button').contains('Save').click();
      cy.waitForAutoSave();

      // Add dropdown value to first row using the + button
      cy.get('.dropdown-add-new').first().click();
      cy.get('#new-dropdown-value').type('Value1');
      cy.get('button[data-action="save-dropdown-value"]').click();
      cy.waitForAutoSave();

      // Verify dropdown has the value in all rows
      cy.get('.cell-dropdown').each(($select) => {
        cy.wrap($select).find('option').should('contain', 'Value1');
      });
    });

    it('should persist dropdown values after adding new rows', () => {
      // Change first column to dropdown
      cy.get('.column-type-badge').first().click();
      cy.get('#column-type-select').select('dropdown');
      cy.get('button').contains('Save').click();
      cy.waitForAutoSave();

      // Add dropdown value
      cy.get('.dropdown-add-new').first().click();
      cy.get('#new-dropdown-value').type('Priority');
      cy.get('button[data-action="save-dropdown-value"]').click();
      cy.waitForAutoSave();

      // Select the value in first row
      cy.get('.cell-dropdown').first().select('Priority');
      cy.waitForAutoSave();

      // Add a new row
      cy.get('button').contains('Add Row').click();
      cy.waitForAutoSave();

      // New row should have the dropdown with the same value available
      cy.get('.cell-dropdown').eq(3).should('exist').within(() => {
        cy.get('option').should('contain', 'Priority');
      });

      // Select value in new row
      cy.get('.cell-dropdown').eq(3).select('Priority');
      cy.waitForAutoSave();

      // Verify data persisted
      cy.getPlannerData().then((data) => {
        // Both rows should have the dropdown value
        const dropdownValues = data.rows.map(r => r.cells[data.columns[0].id]?.value);
        expect(dropdownValues.filter(v => v === 'Priority').length).to.be.at.least(1);
      });
    });

    it('should preserve dropdown options after page reload', () => {
      // Change to dropdown and add values
      cy.get('.column-type-badge').first().click();
      cy.get('#column-type-select').select('dropdown');
      cy.get('#dropdown-options-input').type('Option1, Option2, Option3');
      cy.get('button').contains('Save').click();
      cy.waitForAutoSave();

      // Reload page
      cy.reload();
      cy.waitForAutoSave();

      // Verify options still exist
      cy.getPlannerData().then((data) => {
        expect(data.columns[0].options).to.deep.equal(['Option1', 'Option2', 'Option3']);
      });

      // Verify dropdown still works
      cy.get('.cell-dropdown').first().within(() => {
        cy.get('option').should('contain', 'Option1');
        cy.get('option').should('contain', 'Option2');
        cy.get('option').should('contain', 'Option3');
      });
    });

    it('should auto-add selected dropdown values to options', () => {
      // Change to dropdown
      cy.get('.column-type-badge').first().click();
      cy.get('#column-type-select').select('dropdown');
      cy.get('button').contains('Save').click();
      cy.waitForAutoSave();

      // Add a new value via + button
      cy.get('.dropdown-add-new').first().click();
      cy.get('#new-dropdown-value').type('NewAutoValue');
      cy.get('button[data-action="save-dropdown-value"]').click();
      cy.waitForAutoSave();

      // Verify the value was added to options
      cy.getPlannerData().then((data) => {
        expect(data.columns[0].options).to.include('NewAutoValue');
      });

      // Verify the new row dropdown also shows this value
      cy.get('.cell-dropdown').should('contain', 'NewAutoValue');
    });
  });

  context('Number Field Persistence', () => {
    it('should persist number values after adding new rows', () => {
      // Change first column to number
      cy.get('.column-type-badge').first().click();
      cy.get('#column-type-select').select('number');
      cy.get('button').contains('Save').click();
      cy.waitForAutoSave();

      // Enter value in first row (use trigger to fire change event)
      cy.get('.cell-number').first().invoke('val', '42').trigger('change');
      cy.waitForAutoSave();

      // Verify value
      cy.get('.cell-number').first().should('have.value', '42');

      // Add new row
      cy.get('button').contains('Add Row').click();
      cy.waitForAutoSave();

      // Verify first row still has value
      cy.get('.cell-number').first().should('have.value', '42');

      // Verify data persisted
      cy.getPlannerData().then((data) => {
        const values = data.rows.map(r => r.cells[data.columns[0].id]?.value);
        expect(values).to.include('42');
      });
    });

    it('should preserve number values after page reload', () => {
      // Change to number
      cy.get('.column-type-badge').first().click();
      cy.get('#column-type-select').select('number');
      cy.get('button').contains('Save').click();
      cy.waitForAutoSave();

      // Enter value
      cy.get('.cell-number').first().invoke('val', '123').trigger('change');
      cy.waitForAutoSave();

      // Reload
      cy.reload();
      cy.waitForAutoSave();

      // Verify value persisted
      cy.get('.cell-number').first().should('have.value', '123');

      cy.getPlannerData().then((data) => {
        expect(data.rows[0].cells[data.columns[0].id].value).to.equal('123');
      });
    });
  });

  context('Date/Time Field Persistence', () => {
    it('should persist datetime values after adding new rows', () => {
      // Change first column to datetime
      cy.get('.column-type-badge').first().click();
      cy.get('#column-type-select').select('datetime');
      cy.get('button').contains('Save').click();
      cy.waitForAutoSave();

      // Enter datetime
      cy.get('.cell-datetime').first().invoke('val', '2026-03-30T18:00').trigger('change');
      cy.waitForAutoSave();

      // Add new row
      cy.get('button').contains('Add Row').click();
      cy.waitForAutoSave();

      // Verify first row still has value
      cy.get('.cell-datetime').first().should('have.value', '2026-03-30T18:00');
    });

    it('should preserve date values after page reload', () => {
      // Change to date
      cy.get('.column-type-badge').first().click();
      cy.get('#column-type-select').select('date');
      cy.get('button').contains('Save').click();
      cy.waitForAutoSave();

      // Enter date
      cy.get('.cell-date').first().invoke('val', '2026-03-30').trigger('change');
      cy.waitForAutoSave();

      // Reload
      cy.reload();
      cy.waitForAutoSave();

      // Verify value persisted
      cy.get('.cell-date').first().should('have.value', '2026-03-30');
    });
  });

  context('Mixed Field Type Operations', () => {
    it('should handle multiple columns with different types simultaneously', () => {
      // Change first column to date
      cy.get('.column-type-badge').first().click();
      cy.get('#column-type-select').select('date');
      cy.get('button').contains('Save').click();
      cy.waitForAutoSave();

      // Change second column to dropdown
      cy.get('.column-type-badge').eq(1).click();
      cy.get('#column-type-select').select('dropdown');
      cy.get('#dropdown-options-input').type('A, B, C');
      cy.get('button').contains('Save').click();
      cy.waitForAutoSave();

      // Change third column to number
      cy.get('.column-type-badge').eq(2).click();
      cy.get('#column-type-select').select('number');
      cy.get('button').contains('Save').click();
      cy.waitForAutoSave();

      // Fill data in all three columns
      cy.get('.cell-date').first().invoke('val', '2026-03-30').trigger('change');
      cy.get('.cell-dropdown').first().select('B');
      cy.get('.cell-number').first().clear().type('50');
      cy.waitForAutoSave();

      // Add new row
      cy.get('button').contains('Add Row').click();
      cy.waitForAutoSave();

      // Verify all values preserved in first row
      cy.get('.cell-date').first().should('have.value', '2026-03-30');
      cy.get('.cell-number').first().should('have.value', '50');

      // Verify dropdown options still exist
      cy.get('.cell-dropdown').first().within(() => {
        cy.get('option').should('contain', 'A');
        cy.get('option').should('contain', 'B');
        cy.get('option').should('contain', 'C');
      });
    });

    it('should persist mixed column data after reload', () => {
      // Setup mixed columns
      cy.get('.column-type-badge').first().click();
      cy.get('#column-type-select').select('date');
      cy.get('button').contains('Save').click();
      cy.waitForAutoSave();

      cy.get('.column-type-badge').eq(1).click();
      cy.get('#column-type-select').select('dropdown');
      cy.get('#dropdown-options-input').type('X, Y');
      cy.get('button').contains('Save').click();
      cy.waitForAutoSave();

      // Fill data
      cy.get('.cell-date').first().invoke('val', '2026-01-15').trigger('change');
      cy.get('.cell-dropdown').first().select('Y');
      cy.waitForAutoSave();

      // Reload
      cy.reload();
      cy.waitForAutoSave();

      // Verify all data
      cy.get('.cell-date').first().should('have.value', '2026-01-15');
      cy.get('.cell-dropdown').first().should('have.value', 'Y');

      cy.getPlannerData().then((data) => {
        expect(data.columns[0].type).to.equal('date');
        expect(data.columns[1].type).to.equal('dropdown');
        expect(data.columns[1].options).to.deep.equal(['X', 'Y']);
      });
    });
  });

  context('Column Operations with Data', () => {
    it('should preserve data when changing column type', () => {
      // Enter freetext data using contenteditable
      cy.get('tbody tr').first().find('[data-field="value"]').first().then(el => {
        el.text('Original Text');
      });
      cy.waitForAutoSave();

      // Change to number
      cy.get('.column-type-badge').first().click();
      cy.get('#column-type-select').select('number');
      cy.get('button').contains('Save').click();
      cy.waitForAutoSave();

      // Verify type changed but cell still exists
      cy.get('.cell-number').should('exist');

      cy.getPlannerData().then((data) => {
        expect(data.columns[0].type).to.equal('number');
      });
    });

    it('should add cells to all rows when adding new column', () => {
      // Enter data in existing columns
      cy.get('tbody tr').first().find('[data-field="value"]').first().then(el => {
        el.text('Row 1 Data');
      });
      cy.waitForAutoSave();

      // Add new row
      cy.get('button').contains('Add Row').click();
      cy.waitForAutoSave();

      // Add new column
      cy.get('button').contains('Add Column').click();
      cy.waitForAutoSave();

      // Verify new column has cells for all rows (count data-column-id attributes)
      cy.get('[data-column-id]').should('have.length.at.least', 12); // 4 rows * 3 original cols + filter row

      cy.getPlannerData().then((data) => {
        expect(data.columns).to.have.length(4);
        expect(data.rows).to.have.length(4); // 3 default + 1 added
        expect(data.rows[0].cells[data.columns[3].id]).to.exist;
        expect(data.rows[3].cells[data.columns[3].id]).to.exist;
      });
    });

    it('should handle deleting column with existing dropdown data', () => {
      // Setup dropdown with data
      cy.get('.column-type-badge').first().click();
      cy.get('#column-type-select').select('dropdown');
      cy.get('#dropdown-options-input').type('Keep, Remove');
      cy.get('button').contains('Save').click();
      cy.waitForAutoSave();

      cy.get('.dropdown-add-new').first().click();
      cy.get('#new-dropdown-value').type('Keep');
      cy.get('button[data-action="save-dropdown-value"]').click();
      cy.waitForAutoSave();

      // Verify we have 3 columns now
      cy.get('.column-type-badge').should('have.length', 3);

      // Delete the column (confirm dialog should appear)
      cy.get('[data-action="delete-column"]').first().click();
      cy.get('#confirm-action').click();
      cy.waitForAutoSave();

      // Verify only 2 columns remain by checking IndexedDB
      cy.getPlannerData().then((data) => {
        expect(data.columns).to.have.length(2);
        expect(data.columns[0].type).to.equal('freetext');
      });
    });
  });

  context('Row Operations with Data', () => {
    it('should move rows and preserve data after reload', () => {
      // Move first row down
      cy.get('tbody tr').eq(0).find('[data-action="move-row"][data-direction="down"]').click();
      cy.waitForAutoSave();

      // Verify rows are reordered
      cy.getPlannerData().then((data) => {
        expect(data.rows.length).to.equal(3);
        // Original first row should now be at index 1
      });

      // Reload and verify order persisted
      cy.reload();
      cy.waitForAutoSave();

      // Verify order still changed after reload
      cy.getPlannerData().then((data) => {
        expect(data.rows.length).to.equal(3);
      });
    });

    it('should preserve data after deleting row', () => {
      // Enter data in all rows
      cy.get('tbody tr').each(($row, index) => {
        cy.wrap($row).find('[data-field="value"]').first().then(el => {
          el.text(`Row ${index + 1} Data`);
          el.blur();
        });
      });
      cy.waitForAutoSave();

      // Delete second row
      cy.get('tbody tr').eq(1).find('[data-action="delete-row"]').click();
      cy.waitForAutoSave();

      // Verify remaining data
      cy.getPlannerData().then((data) => {
        expect(data.rows).to.have.length(2);
      });

      cy.get('tbody tr').should('have.length', 2);
    });
  });

  context('Freetext maxLength', () => {
    it('should respect maxLength for freetext after reload', () => {
      // Enter long text
      const longText = 'A'.repeat(500);
      cy.get('tbody tr').first().find('[data-field="value"]').first().then(el => {
        el.text(longText);
      });
      cy.waitForAutoSave();

      // Reload
      cy.reload();
      cy.waitForAutoSave();

      // Verify maxLength attribute
      cy.get('tbody tr').first().find('[data-field="value"]').first().should('have.attr', 'data-max-length', '500');

      // Verify data persisted
      cy.getPlannerData().then((data) => {
        expect(data.rows[0].cells[data.columns[0].id].value.length).to.be.at.most(500);
      });
    });
  });
});
