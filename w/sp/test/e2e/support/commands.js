/**
 * Cypress Support - Custom Commands
 */

/// <reference types="cypress" />

// Custom command to clear IndexedDB before each test
Cypress.Commands.add('clearPlannerDB', () => {
  cy.window().then((win) => {
    win.indexedDB.deleteDatabase('LocalPlannerDB');
  });
  cy.wait(500);
});

// Custom command to get table data from IndexedDB
Cypress.Commands.add('getPlannerData', () => {
  return cy.window().then((win) => {
    return new Promise((resolve) => {
      const request = win.indexedDB.open('LocalPlannerDB');
      
      request.onerror = () => resolve(null);
      
      request.onsuccess = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('tables')) {
          db.close();
          resolve(null);
          return;
        }
        
        const transaction = db.transaction(['tables'], 'readonly');
        const store = transaction.objectStore('tables');
        const getRequest = store.get('default');
        
        getRequest.onsuccess = () => {
          db.close();
          resolve(getRequest.result || null);
        };
        
        getRequest.onerror = () => {
          db.close();
          resolve(null);
        };
      };
    });
  });
});

// Custom command to wait for auto-save
Cypress.Commands.add('waitForAutoSave', () => {
  cy.wait(700);
  // Status may be hidden after save, just ensure it exists
  cy.get('#save-status').should('exist');
});

// Custom command to reload and verify
Cypress.Commands.add('reloadAndVerify', () => {
  cy.reload();
  cy.get('table#dynamicTable').should('be.visible');
  cy.waitForAutoSave();
});

// Custom command to change column type
Cypress.Commands.add('changeColumnType', (columnIndex, type, options) => {
  cy.get('.column-type-badge').eq(columnIndex).click();
  cy.wait(300);
  cy.get('#column-type-select').select(type);
  if (options) {
    cy.get('#dropdown-options-input').type(options);
  }
  cy.get('button').contains('Save').click();
  cy.waitForAutoSave();
});

// Custom command to fill cell value
Cypress.Commands.add('fillCell', (rowIndex, colIndex, value) => {
  cy.get('tbody tr').eq(rowIndex).find('td[contenteditable="true"]').eq(colIndex).then(el => {
    el.text(value);
    el.blur();
  });
  cy.waitForAutoSave();
});

// Custom command to set dropdown cell
Cypress.Commands.add('selectDropdownCell', (rowIndex, colIndex, value) => {
  cy.get('tbody tr').eq(rowIndex).find('select').eq(colIndex).select(value);
  cy.waitForAutoSave();
});

// Custom command to set number cell
Cypress.Commands.add('setNumberCell', (rowIndex, colIndex, value) => {
  cy.get('tbody tr').eq(rowIndex).find('input[type="number"]').eq(colIndex).invoke('val', value).trigger('change');
  cy.waitForAutoSave();
});

// Custom command to set date cell
Cypress.Commands.add('setDateCell', (rowIndex, colIndex, value) => {
  cy.get('tbody tr').eq(rowIndex).find('input[type="date"]').eq(colIndex).invoke('val', value).trigger('change');
  cy.waitForAutoSave();
});

// Custom command to get serial numbers
Cypress.Commands.add('getSerialNumbers', () => {
  return cy.get('tbody tr td:nth-child(2)').then($cells => {
    return Array.from($cells).map(cell => cell.textContent.trim());
  });
});
