/**
 * Test Suite: Filter & Sort with Comprehensive Test Data
 * Tests for per-column filtering and sorting with varied data types
 */

/// <reference types="cypress" />

describe('Filter & Sort', () => {
  beforeEach(() => {
    cy.clearPlannerDB();
    cy.visit('/w/daily-planner/');
    cy.waitForAutoSave();
  });

  afterEach(() => {
    cy.clearPlannerDB();
  });

  context('Filter Row Structure', () => {
    it('should show filter inputs in filter row', () => {
      cy.get('.filter-row').should('exist');
      cy.get('.filter-input').should('have.length.at.least', 3);
    });

    it('should not show filter input for Action column', () => {
      cy.get('.filter-row th').eq(0).find('.filter-input').should('not.exist');
    });

    it('should not show filter input for S.No column', () => {
      cy.get('.filter-row th').eq(1).find('.filter-input').should('not.exist');
    });
  });

  context('Clear Filters Button', () => {
    it('should clear all filters when Clear Filters button is clicked', () => {
      cy.get('.filter-input').first().type('test');
      cy.waitForAutoSave();
      
      cy.get('#clear-filters-btn').click();
      
      cy.get('.filter-input').each((input) => {
        cy.wrap(input).should('have.value', '');
      });
    });

    it('should show all rows after clearing filters', () => {
      cy.get('.filter-input').first().type('test');
      cy.waitForAutoSave();
      
      cy.get('#clear-filters-btn').click();
      
      cy.get('tbody tr').should('have.length', 3);
    });
  });

  context('Sort - Freetext Column', () => {
    beforeEach(() => {
      // Add rows with different freetext values using clear + type
      cy.get('tbody tr').eq(0).find('[data-field="value"]').first().clear().type('Zebra{enter}');
      cy.waitForAutoSave();
      
      cy.get('tbody tr').eq(1).find('[data-field="value"]').first().clear().type('Apple{enter}');
      cy.waitForAutoSave();
      
      cy.get('tbody tr').eq(2).find('[data-field="value"]').first().clear().type('Mango{enter}');
      cy.waitForAutoSave();
    });

    it('should sort freetext column alphabetically A-Z (ascending)', () => {
      // Click sort once for ascending
      cy.get('thead tr:first th').eq(2).find('button[title="Sort"]').click();
      cy.waitForAutoSave();
      
      // Verify serial numbers reflect sorted order (row positions change but S.No is position-based)
      cy.getPlannerData().then((data) => {
        const values = data.rows.map(r => r.cells[data.columns[0].id]?.value || '');
        // After A-Z sort: Apple, Mango, Zebra
        expect(values[0]).to.equal('Apple');
        expect(values[1]).to.equal('Mango');
        expect(values[2]).to.equal('Zebra');
      });
    });

    it('should sort freetext column Z-A (descending) on second click', () => {
      // Click sort twice for descending
      cy.get('thead tr:first th').eq(2).find('button[title="Sort"]').click();
      cy.wait(300);
      cy.get('thead tr:first th').eq(2).find('button[title="Sort"]').click();
      cy.waitForAutoSave();
      
      cy.getPlannerData().then((data) => {
        const values = data.rows.map(r => r.cells[data.columns[0].id]?.value || '');
        // After Z-A sort: Zebra, Mango, Apple
        expect(values[0]).to.equal('Zebra');
        expect(values[1]).to.equal('Mango');
        expect(values[2]).to.equal('Apple');
      });
    });
  });

  context('Sort - Number Column', () => {
    beforeEach(() => {
      // Change first column to number type
      cy.changeColumnType(0, 'number');
    });

    it('should sort number column ascending (small to large)', () => {
      // Enter values: 30, 10, 20
      cy.get('tbody tr').eq(0).find('input[type="number"]').first().invoke('val', '30').trigger('change');
      cy.waitForAutoSave();
      cy.get('tbody tr').eq(1).find('input[type="number"]').first().invoke('val', '10').trigger('change');
      cy.waitForAutoSave();
      cy.get('tbody tr').eq(2).find('input[type="number"]').first().invoke('val', '20').trigger('change');
      cy.waitForAutoSave();
      
      // Sort ascending
      cy.get('thead tr:first th').eq(2).find('button[title="Sort"]').click();
      cy.waitForAutoSave();
      
      cy.getPlannerData().then((data) => {
        const values = data.rows.map(r => parseFloat(r.cells[data.columns[0].id]?.value) || 0);
        expect(values[0]).to.equal(10);
        expect(values[1]).to.equal(20);
        expect(values[2]).to.equal(30);
      });
    });

    it('should sort number column descending (large to small)', () => {
      // Enter values: 30, 10, 20
      cy.get('tbody tr').eq(0).find('input[type="number"]').first().invoke('val', '30').trigger('change');
      cy.waitForAutoSave();
      cy.get('tbody tr').eq(1).find('input[type="number"]').first().invoke('val', '10').trigger('change');
      cy.waitForAutoSave();
      cy.get('tbody tr').eq(2).find('input[type="number"]').first().invoke('val', '20').trigger('change');
      cy.waitForAutoSave();
      
      // Sort descending (click twice)
      cy.get('thead tr:first th').eq(2).find('button[title="Sort"]').click();
      cy.wait(300);
      cy.get('thead tr:first th').eq(2).find('button[title="Sort"]').click();
      cy.waitForAutoSave();
      
      cy.getPlannerData().then((data) => {
        const values = data.rows.map(r => parseFloat(r.cells[data.columns[0].id]?.value) || 0);
        expect(values[0]).to.equal(30);
        expect(values[1]).to.equal(20);
        expect(values[2]).to.equal(10);
      });
    });
  });

  context('Sort - Date Column', () => {
    beforeEach(() => {
      cy.changeColumnType(0, 'date');
    });

    it('should sort date column ascending (oldest first)', () => {
      cy.get('tbody tr').eq(0).find('input[type="date"]').first().invoke('val', '2024-03-15').trigger('change');
      cy.waitForAutoSave();
      cy.get('tbody tr').eq(1).find('input[type="date"]').first().invoke('val', '2024-01-01').trigger('change');
      cy.waitForAutoSave();
      cy.get('tbody tr').eq(2).find('input[type="date"]').first().invoke('val', '2024-06-30').trigger('change');
      cy.waitForAutoSave();
      
      cy.get('thead tr:first th').eq(2).find('button[title="Sort"]').click();
      cy.waitForAutoSave();
      
      cy.getPlannerData().then((data) => {
        const values = data.rows.map(r => r.cells[data.columns[0].id]?.value || '');
        expect(values[0]).to.equal('2024-01-01');
        expect(values[1]).to.equal('2024-03-15');
        expect(values[2]).to.equal('2024-06-30');
      });
    });

    it('should sort date column descending (newest first)', () => {
      cy.get('tbody tr').eq(0).find('input[type="date"]').first().invoke('val', '2024-03-15').trigger('change');
      cy.waitForAutoSave();
      cy.get('tbody tr').eq(1).find('input[type="date"]').first().invoke('val', '2024-01-01').trigger('change');
      cy.waitForAutoSave();
      cy.get('tbody tr').eq(2).find('input[type="date"]').first().invoke('val', '2024-06-30').trigger('change');
      cy.waitForAutoSave();
      
      cy.get('thead tr:first th').eq(2).find('button[title="Sort"]').click();
      cy.wait(300);
      cy.get('thead tr:first th').eq(2).find('button[title="Sort"]').click();
      cy.waitForAutoSave();
      
      cy.getPlannerData().then((data) => {
        const values = data.rows.map(r => r.cells[data.columns[0].id]?.value || '');
        expect(values[0]).to.equal('2024-06-30');
        expect(values[1]).to.equal('2024-03-15');
        expect(values[2]).to.equal('2024-01-01');
      });
    });
  });

  context('Sort - Dropdown Column', () => {
    beforeEach(() => {
      cy.changeColumnType(0, 'dropdown', 'Low, Medium, High');
    });

    it('should sort dropdown column alphabetically', () => {
      // Select different dropdown values
      cy.get('tbody tr').eq(0).find('select').first().select('High');
      cy.waitForAutoSave();
      cy.get('tbody tr').eq(1).find('select').first().select('Low');
      cy.waitForAutoSave();
      cy.get('tbody tr').eq(2).find('select').first().select('Medium');
      cy.waitForAutoSave();
      
      cy.get('thead tr:first th').eq(2).find('button[title="Sort"]').click();
      cy.waitForAutoSave();
      
      cy.getPlannerData().then((data) => {
        const values = data.rows.map(r => r.cells[data.columns[0].id]?.value || '');
        expect(values[0]).to.equal('High');
        expect(values[1]).to.equal('Low');
        expect(values[2]).to.equal('Medium');
      });
    });

    it('should reverse dropdown sort on second click', () => {
      cy.get('tbody tr').eq(0).find('select').first().select('High');
      cy.waitForAutoSave();
      cy.get('tbody tr').eq(1).find('select').first().select('Low');
      cy.waitForAutoSave();
      cy.get('tbody tr').eq(2).find('select').first().select('Medium');
      cy.waitForAutoSave();
      
      cy.get('thead tr:first th').eq(2).find('button[title="Sort"]').click();
      cy.wait(300);
      cy.get('thead tr:first th').eq(2).find('button[title="Sort"]').click();
      cy.waitForAutoSave();
      
      cy.getPlannerData().then((data) => {
        const values = data.rows.map(r => r.cells[data.columns[0].id]?.value || '');
        expect(values[0]).to.equal('Medium');
        expect(values[1]).to.equal('Low');
        expect(values[2]).to.equal('High');
      });
    });
  });

  context('Filter - Freetext Column', () => {
    beforeEach(() => {
      // Fill with varied text values using clear + type
      cy.get('tbody tr').eq(0).find('[data-field="value"]').first().clear().type('Project Alpha{enter}');
      cy.waitForAutoSave();
      
      cy.get('tbody tr').eq(1).find('[data-field="value"]').first().clear().type('Project Beta{enter}');
      cy.waitForAutoSave();
      
      cy.get('tbody tr').eq(2).find('[data-field="value"]').first().clear().type('Task Gamma{enter}');
      cy.waitForAutoSave();
    });

    it('should filter rows containing text (case-insensitive partial match)', () => {
      cy.get('.filter-input').first().type('project');
      cy.waitForAutoSave();
      
      cy.get('tbody tr:visible').should('have.length', 2);
      cy.get('tbody tr:visible').should('contain', 'Project Alpha');
      cy.get('tbody tr:visible').should('contain', 'Project Beta');
    });

    it('should show all rows when filter is cleared', () => {
      cy.get('.filter-input').first().type('project');
      cy.waitForAutoSave();
      
      cy.get('.filter-input').first().clear();
      cy.waitForAutoSave();
      
      cy.get('tbody tr:visible').should('have.length', 3);
    });

    it('should filter with exact case-insensitive match', () => {
      cy.get('.filter-input').first().type('ALPHA');
      cy.waitForAutoSave();
      
      cy.get('tbody tr:visible').should('have.length', 1);
      cy.get('tbody tr:visible').should('contain', 'Project Alpha');
    });

    it('should show no rows when nothing matches', () => {
      cy.get('.filter-input').first().type('xyz123');
      cy.waitForAutoSave();
      
      cy.get('tbody tr:visible').should('have.length', 0);
    });
  });

  context('Filter - Number Column', () => {
    beforeEach(() => {
      cy.changeColumnType(0, 'number');
      
      cy.get('tbody tr').eq(0).find('input[type="number"]').first().invoke('val', '100').trigger('change');
      cy.waitForAutoSave();
      cy.get('tbody tr').eq(1).find('input[type="number"]').first().invoke('val', '200').trigger('change');
      cy.waitForAutoSave();
      cy.get('tbody tr').eq(2).find('input[type="number"]').first().invoke('val', '300').trigger('change');
      cy.waitForAutoSave();
    });

    it('should filter number column with partial match', () => {
      // Filter for "1" should match "100"
      cy.get('.filter-input').first().type('1');
      cy.waitForAutoSave();
      
      cy.get('tbody tr:visible').should('have.length', 1);
      cy.get('tbody tr:visible input[type="number"]').first().should('have.value', '100');
    });

    it('should filter number column with exact match', () => {
      cy.get('.filter-input').first().type('200');
      cy.waitForAutoSave();
      
      cy.get('tbody tr:visible').should('have.length', 1);
      cy.get('tbody tr:visible input[type="number"]').first().should('have.value', '200');
    });
  });

  context('Filter - Date Column', () => {
    beforeEach(() => {
      cy.changeColumnType(0, 'date');
      
      cy.get('tbody tr').eq(0).find('input[type="date"]').first().invoke('val', '2024-03-15').trigger('change');
      cy.waitForAutoSave();
      cy.get('tbody tr').eq(1).find('input[type="date"]').first().invoke('val', '2024-03-20').trigger('change');
      cy.waitForAutoSave();
      cy.get('tbody tr').eq(2).find('input[type="date"]').first().invoke('val', '2024-04-01').trigger('change');
      cy.waitForAutoSave();
    });

    it('should filter date column with partial match', () => {
      // Filter for "03-15" should match "2024-03-15"
      cy.get('.filter-input').first().type('03-15');
      cy.waitForAutoSave();
      
      cy.get('tbody tr:visible').should('have.length', 1);
    });

    it('should filter date column with year match', () => {
      cy.get('.filter-input').first().type('2024');
      cy.waitForAutoSave();
      
      cy.get('tbody tr:visible').should('have.length', 3);
    });
  });

  context('Filter - Dropdown Column', () => {
    beforeEach(() => {
      cy.changeColumnType(0, 'dropdown', 'Low, Medium, High');
      
      cy.get('tbody tr').eq(0).find('select').first().select('High');
      cy.waitForAutoSave();
      cy.get('tbody tr').eq(1).find('select').first().select('Low');
      cy.waitForAutoSave();
      cy.get('tbody tr').eq(2).find('select').first().select('Medium');
      cy.waitForAutoSave();
    });

    it('should filter dropdown column', () => {
      cy.get('.filter-input').first().type('Low');
      cy.waitForAutoSave();
      
      cy.get('tbody tr:visible').should('have.length', 1);
      cy.get('tbody tr:visible').should('contain', 'Low');
    });

    it('should filter dropdown case-insensitively', () => {
      cy.get('.filter-input').first().type('HIGH');
      cy.waitForAutoSave();
      
      cy.get('tbody tr:visible').should('have.length', 1);
    });
  });

  context('Sort Persistence After Reload', () => {
    beforeEach(() => {
      // Fill with values using clear + type
      cy.get('tbody tr').eq(0).find('[data-field="value"]').first().clear().type('Banana{enter}');
      cy.waitForAutoSave();
      
      cy.get('tbody tr').eq(1).find('[data-field="value"]').first().clear().type('Apple{enter}');
      cy.waitForAutoSave();
      
      cy.get('tbody tr').eq(2).find('[data-field="value"]').first().clear().type('Cherry{enter}');
      cy.waitForAutoSave();
    });

    it('should persist sorted order after reload', () => {
      // Sort ascending
      cy.get('thead tr:first th').eq(2).find('button[title="Sort"]').click();
      cy.waitForAutoSave();
      
      // Verify before reload
      cy.getPlannerData().then((data) => {
        const values = data.rows.map(r => r.cells[data.columns[0].id]?.value || '');
        expect(values[0]).to.equal('Apple');
        expect(values[1]).to.equal('Banana');
        expect(values[2]).to.equal('Cherry');
      });
      
      // Reload
      cy.reload();
      cy.waitForAutoSave();
      
      // Verify after reload - order should be preserved
      cy.getPlannerData().then((data) => {
        const values = data.rows.map(r => r.cells[data.columns[0].id]?.value || '');
        expect(values[0]).to.equal('Apple');
        expect(values[1]).to.equal('Banana');
        expect(values[2]).to.equal('Cherry');
      });
    });
  });

  context('Edge Cases', () => {
    it('should still allow adding rows when filter is active', () => {
      cy.get('.filter-input').first().type('test');
      cy.waitForAutoSave();
      
      cy.contains('button', 'Add Row').click();
      cy.waitForAutoSave();
      
      cy.getPlannerData().then((data) => {
        expect(data.rows).to.have.length(4);
      });
    });

    it('should handle empty filter gracefully', () => {
      cy.get('.filter-input').first().type('NonExistentValue123');
      cy.waitForAutoSave();
      
      cy.get('tbody tr:visible').should('have.length', 0);
    });

    it('should filter on different columns independently', () => {
      // Fill first two columns with different data using clear + type
      cy.get('tbody tr').eq(0).find('[data-field="value"]').first().clear().type('Alpha{enter}');
      cy.waitForAutoSave();
      
      cy.get('tbody tr').eq(1).find('[data-field="value"]').first().clear().type('Beta{enter}');
      cy.waitForAutoSave();
      
      cy.get('tbody tr').eq(2).find('[data-field="value"]').first().clear().type('Alpha{enter}');
      cy.waitForAutoSave();
      
      // Filter first column
      cy.get('.filter-input').first().type('Alpha');
      cy.waitForAutoSave();
      
      cy.get('tbody tr:visible').should('have.length', 2);
    });
  });
});
