/**
 * Test Suite: Field Types
 * Tests for different column field types: date, time, datetime, number, dropdown
 */

/// <reference types="cypress" />

describe('Field Types', () => {
  beforeEach(() => {
    cy.clearPlannerDB();
    cy.visit('/w/sp/');
    cy.waitForAutoSave();
  });

  afterEach(() => {
    cy.clearPlannerDB();
  });

  context('Date Type', () => {
    it('should have type badge in column header', () => {
      cy.get('.column-type-badge').first().should('exist');
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
      
      cy.getPlannerData().then((data) => {
        expect(data.columns[0].type).to.equal('date');
      });
    });
  });

  context('Time Type', () => {
    it('should change column type to time', () => {
      cy.get('.column-type-badge').first().click();
      cy.get('#column-type-select').select('time');
      cy.get('button').contains('Save').click();
      cy.waitForAutoSave();
      
      cy.getPlannerData().then((data) => {
        expect(data.columns[0].type).to.equal('time');
      });
    });
  });

  context('DateTime Type', () => {
    it('should change column type to datetime', () => {
      cy.get('.column-type-badge').first().click();
      cy.get('#column-type-select').select('datetime');
      cy.get('button').contains('Save').click();
      cy.waitForAutoSave();
      
      cy.getPlannerData().then((data) => {
        expect(data.columns[0].type).to.equal('datetime');
      });
    });
  });

  context('Number Type', () => {
    it('should change column type to number', () => {
      cy.get('.column-type-badge').first().click();
      cy.get('#column-type-select').select('number');
      cy.get('button').contains('Save').click();
      cy.waitForAutoSave();
      
      cy.getPlannerData().then((data) => {
        expect(data.columns[0].type).to.equal('number');
      });
    });
  });

  context('Dropdown Type', () => {
    it('should change column type to dropdown', () => {
      cy.get('.column-type-badge').first().click();
      cy.get('#column-type-select').select('dropdown');
      cy.get('button').contains('Save').click();
      cy.waitForAutoSave();
      
      cy.getPlannerData().then((data) => {
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
      cy.get('#dropdown-options-input').type('High, Medium, Low');
      cy.get('button').contains('Save').click();
      cy.waitForAutoSave();
      
      cy.getPlannerData().then((data) => {
        expect(data.columns[0].options).to.deep.equal(['High', 'Medium', 'Low']);
      });
    });
  });

  context('Type Modal', () => {
    it('should close modal on cancel', () => {
      cy.get('.column-type-badge').first().click();
      cy.get('button').contains('Cancel').click();
      
      cy.get('.modal').should('not.exist');
    });
  });

  context('Mixed Column Types', () => {
    it('should change different columns to different types', () => {
      // Change first column to date
      cy.get('.column-type-badge').first().click();
      cy.get('#column-type-select').select('date');
      cy.get('button').contains('Save').click();
      cy.waitForAutoSave();
      
      // Change second column to number
      cy.get('.column-type-badge').eq(1).click();
      cy.get('#column-type-select').select('number');
      cy.get('button').contains('Save').click();
      cy.waitForAutoSave();
      
      cy.getPlannerData().then((data) => {
        expect(data.columns[0].type).to.equal('date');
        expect(data.columns[1].type).to.equal('number');
      });
    });
  });
});
