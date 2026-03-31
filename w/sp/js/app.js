/**
 * Local Planner - Main Application
 * Refactored to use modular architecture
 */

const PlannerApp = (function() {
    'use strict';

    let currentTable = null;
    let saveTimeout = null;
    const SAVE_DEBOUNCE_MS = 500;

    let tableEl, thead, tbody;
    let sortState = {}; // { columnId: 'asc' | 'desc' }

    function init() {
        console.log('[PlannerApp] >>> init() - Starting initialization');
        
        tableEl = document.getElementById('dynamicTable');
        thead = tableEl?.querySelector('thead');
        tbody = tableEl?.querySelector('tbody');

        if (!tableEl || !thead || !tbody) {
            console.error('[PlannerApp] init() - Table elements not found');
            return;
        }

        setupUIHandlers();

        (async () => {
            try {
                await PlannerDB.init();
                console.log('[PlannerApp] init() - IndexedDB initialized');

                currentTable = await PlannerDB.getTable('default');
                
                if (!currentTable) {
                    currentTable = PlannerDB.createDefaultTable();
                    for (let i = 0; i < 3; i++) {
                        currentTable.rows.push(PlannerDB.createRow(currentTable.columns, currentTable.rows.length));
                    }
                    await PlannerDB.saveTable(currentTable);
                }
                
                // Restore sort state if saved
                if (currentTable.sortState) {
                    sortState = currentTable.sortState;
                }

                renderTable();
                
                // Update sort indicators if there's a saved sort state
                Object.keys(sortState).forEach(colId => {
                    if (sortState[colId]) {
                        updateSortIndicators(colId, sortState[colId]);
                    }
                });
                
                setupEventListeners();
                PlannerUI.showStatus('ready');
                console.log('[PlannerApp] >>> init() - COMPLETE');

            } catch (error) {
                console.error('[PlannerApp] init() - ERROR:', error);
                PlannerUI.showStatus('error', 'Failed to initialize');
            }
        })();
    }

    function setupUIHandlers() {
        document.getElementById('add-row-btn')?.addEventListener('click', handleAddRow);
        document.getElementById('add-column-btn')?.addEventListener('click', handleAddColumn);
        document.getElementById('clear-filters-btn')?.addEventListener('click', handleClearFilters);
        document.getElementById('clear-table-btn')?.addEventListener('click', handleClearTable);
        document.getElementById('export-btn')?.addEventListener('click', handleExport);
        document.getElementById('import-btn')?.addEventListener('click', handleImport);
        document.getElementById('import-input')?.addEventListener('change', handleImportFile);
    }

    function handleClearFilters() {
        if (!tbody) return;
        
        const filterInputs = tbody.parentElement?.querySelectorAll('.filter-input');
        filterInputs?.forEach(input => {
            input.value = '';
        });
        
        currentTable.rows.forEach(row => {
            const rowEl = tbody.querySelector(`tr[data-row-id="${row.id}"]`);
            if (rowEl) {
                rowEl.style.display = '';
            }
        });
        
        PlannerRenderer.updateSerialNumbers(tbody);
    }

    function setupEventListeners() {
        tableEl.addEventListener('click', handleTableClick);
        tableEl.addEventListener('change', handleTableChange);
        tableEl.addEventListener('input', handleTableInput);
        tableEl.addEventListener('blur', handleTableBlur, true);
        tableEl.addEventListener('input', handleFilterInput);

        document.addEventListener('keydown', handleKeydown);
    }

    function renderTable() {
        if (!currentTable || !thead || !tbody) return;

        const sortState = {};
        const filterRowHTML = PlannerRenderer.renderFilterRow(currentTable.columns);
        PlannerRenderer.renderHeader(thead, currentTable.columns, filterRowHTML, sortState);
        PlannerRenderer.renderBody(tbody, currentTable.rows, currentTable.columns, getDropdownOptions);
    }

    function getDropdownOptions(column) {
        if (!column) return [];
        
        if (column.options && column.options.length > 0) {
            return column.options.filter(opt => {
                if (!opt || typeof opt !== 'string') return false;
                const t = opt.trim();
                return t && t !== '-- Select --' && !t.includes('<') && !t.includes('>');
            });
        }
        
        if (!currentTable) return [];
        return PlannerDB.collectDropdownOptions(currentTable, column.id);
    }

    function handleAddRow() {
        if (!currentTable) return;
        
        const newRow = PlannerOperations.addRow(currentTable, PlannerDB.createRow);
        PlannerRenderer.renderBody(tbody, currentTable.rows, currentTable.columns, getDropdownOptions);
        PlannerRenderer.updateSerialNumbers(tbody);
        debouncedSave();
        
        const newRowEl = tbody.querySelector(`tr[data-row-id="${newRow.id}"]`);
        if (newRowEl) {
            newRowEl.classList.add('highlight');
            setTimeout(() => newRowEl.classList.remove('highlight'), 1000);
        }
        
        PlannerUI.showToast('Row added', 'success');
    }

    function handleAddColumn() {
        if (!currentTable) return;
        
        const colNum = currentTable.columns.length + 1;
        PlannerOperations.addColumn(currentTable, `C${colNum}`, 'freetext', PlannerDB.addColumn);
        renderTable();
        debouncedSave();
        PlannerUI.showToast('Column added', 'success');
    }

    function handleClearTable() {
        if (!currentTable) return;

        PlannerUI.showConfirmDialog(
            'Clear all rows? This cannot be undone.',
            () => {
                PlannerOperations.clearTable(currentTable);
                renderTable();
                debouncedSave();
                PlannerUI.showToast('Table cleared', 'success');
            }
        );
    }

    function handleTableClick(e) {
        const target = e.target.closest('[data-action]');
        if (!target) return;

        const action = target.dataset?.action;
        const columnId = target.dataset?.columnId;
        const rowId = target.dataset?.rowId;

        switch (action) {
            case 'delete-column':
                if (currentTable.columns.length > 1) {
                    PlannerUI.showConfirmDialog(
                        `Delete column "${currentTable.columns.find(c => c.id === columnId)?.name}"?`,
                        () => {
                            PlannerOperations.deleteColumn(currentTable, columnId, PlannerDB.removeColumn);
                            renderTable();
                            debouncedSave();
                            PlannerUI.showToast('Column deleted', 'success');
                        }
                    );
                } else {
                    PlannerUI.showToast('Cannot delete last column', 'error');
                }
                break;

            case 'delete-row':
                if (PlannerOperations.deleteRow(currentTable, rowId)) {
                    renderTable();
                    debouncedSave();
                    PlannerUI.showToast('Row deleted', 'success');
                }
                break;

            case 'move-row':
                if (PlannerOperations.moveRow(currentTable, rowId, target.dataset.direction)) {
                    renderTable();
                    debouncedSave();
                }
                break;

            case 'sort':
                sortByColumn(columnId);
                break;

            case 'change-type':
                showColumnTypeModal(columnId);
                break;

            case 'add-dropdown-value':
                showAddDropdownValueModal(columnId, rowId);
                break;

            case 'close-modal':
                break;
        }
    }

    function handleTableChange(e) {
        if (!e.target.classList.contains('cell-input') || !e.target.dataset?.columnId) return;
        
        const { columnId, rowId } = e.target.dataset;
        const value = e.target.value;
        
        if (value === '' || value === '-- Select --') return;
        
        if (PlannerOperations.updateCellValue(currentTable, rowId, columnId, value, PlannerDB.updateCell)) {
            if (currentTable.columns.find(c => c.id === columnId)?.type === 'dropdown') {
                PlannerRenderer.renderColumnCells(tbody, currentTable.columns.find(c => c.id === columnId), currentTable.rows, getDropdownOptions);
            }
            debouncedSave();
        }
    }

    function handleTableInput(e) {
        if (e.target.classList.contains('filter-input')) return;
        if (e.target.classList.contains('cell-input')) return;

        if (e.target.dataset?.field === 'name' && e.target.dataset?.columnId) {
            updateColumnName(e.target.dataset.columnId, e.target.textContent.trim());
        }
    }

    function handleTableBlur(e) {
        if (!e.target.matches('[data-field="value"]')) return;
        
        const { columnId, rowId } = e.target.dataset;
        const value = e.target.value !== undefined ? e.target.value : e.target.textContent;
        
        if (value === '' || value === '-- Select --') return;

        if (PlannerOperations.updateCellValue(currentTable, rowId, columnId, value, PlannerDB.updateCell)) {
            const column = currentTable.columns.find(c => c.id === columnId);
            if (column?.type === 'dropdown') {
                PlannerRenderer.renderColumnCells(tbody, column, currentTable.rows, getDropdownOptions);
            }
            debouncedSave();
        }
    }

    function handleFilterInput(e) {
        if (!e.target.classList.contains('filter-input')) return;

        const columnId = e.target.dataset?.filterColumn;
        const filterValue = e.target.value.toLowerCase();
        applyFilter(columnId, filterValue);
    }

    function handleKeydown(e) {
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            saveTable();
        }
    }

    function updateColumnName(columnId, newName) {
        if (!currentTable) return;

        const column = currentTable.columns.find(c => c.id === columnId);
        if (!column) return;

        const trimmed = newName.trim();
        column.name = trimmed || 'Untitled';
        column.updatedAt = PlannerDB.getLocalTimestamp();
        debouncedSave();
    }

    function sortByColumn(columnId) {
        if (!currentTable) return;

        const column = currentTable.columns.find(c => c.id === columnId);
        if (!column) return;

        // Toggle sort direction: asc -> desc -> asc
        if (sortState[columnId] === 'asc') {
            sortState[columnId] = 'desc';
        } else {
            sortState[columnId] = 'asc';
        }

        // Save sort state to table for persistence
        currentTable.sortState = sortState;

        currentTable.rows.sort((a, b) => {
            const aVal = a.cells[columnId]?.value || '';
            const bVal = b.cells[columnId]?.value || '';
            const result = String(aVal).localeCompare(String(bVal));
            return sortState[columnId] === 'desc' ? -result : result;
        });

        renderTable();
        updateSortIndicators(columnId, sortState[columnId]);
        debouncedSave();
    }

    function updateSortIndicators(sortedColumnId, direction) {
        if (!thead) return;
        
        const sortButtons = thead.querySelectorAll('[data-action="sort"]');
        sortButtons.forEach(btn => {
            const colId = btn.dataset.columnId;
            if (colId === sortedColumnId) {
                btn.textContent = direction === 'asc' ? '↑' : '↓';
                btn.dataset.sortDir = direction;
            } else {
                btn.textContent = '↕';
                delete btn.dataset.sortDir;
            }
        });
    }

    function applyFilter(columnId, filterValue) {
        if (!currentTable) return;

        const visible = {};
        currentTable.rows.forEach(row => {
            const cellValue = row.cells[columnId]?.value || '';
            visible[row.id] = String(cellValue).toLowerCase().includes(filterValue);
        });

        currentTable.rows.forEach(row => {
            const rowEl = tbody.querySelector(`tr[data-row-id="${row.id}"]`);
            if (rowEl) {
                rowEl.style.display = visible[row.id] ? '' : 'none';
            }
        });

        PlannerRenderer.updateSerialNumbers(tbody);
    }

    function showColumnTypeModal(columnId) {
        if (!currentTable) return;

        const column = currentTable.columns.find(c => c.id === columnId);
        if (!column) return;

        PlannerUI.showColumnTypeModal(column, (newType, options) => {
            const updatedColumn = PlannerOperations.changeColumnType(currentTable, columnId, newType, PlannerDB.getLocalTimestamp);
            if (updatedColumn && options.length > 0) {
                updatedColumn.options = options;
            }
            renderTable();
            debouncedSave();
            PlannerUI.showToast('Column type updated', 'success');
        });
    }

    function showAddDropdownValueModal(columnId, rowId) {
        if (!currentTable) return;

        const column = currentTable.columns.find(c => c.id === columnId);
        if (!column) return;

        PlannerUI.showAddDropdownValueModal(columnId, rowId, (value) => {
            if (PlannerOperations.saveDropdownValue(currentTable, columnId, rowId, value, PlannerDB.getLocalTimestamp)) {
                PlannerRenderer.renderColumnCells(tbody, column, currentTable.rows, getDropdownOptions);
                debouncedSave();
                PlannerUI.showToast('Value added', 'success');
            }
        });
    }

    function handleExport() {
        if (!currentTable) return;

        const dataStr = JSON.stringify(currentTable, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `planner-export-${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        PlannerUI.showToast('Exported successfully', 'success');
    }

    function handleImport() {
        document.getElementById('import-input')?.click();
    }

    function handleImportFile(e) {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const imported = JSON.parse(event.target.result);
                if (imported.columns && imported.rows) {
                    currentTable = imported;
                    PlannerDB.saveTable(currentTable).then(() => {
                        renderTable();
                        PlannerUI.showToast('Imported successfully', 'success');
                    });
                }
            } catch (err) {
                PlannerUI.showToast('Invalid file format', 'error');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    }

    function debouncedSave() {
        if (saveTimeout) clearTimeout(saveTimeout);
        PlannerUI.showStatus('saving');

        saveTimeout = setTimeout(async () => {
            try {
                await PlannerDB.saveTable(currentTable);
                PlannerUI.showStatus('saved');
            } catch (error) {
                console.error('[PlannerApp] Save error:', error);
                PlannerUI.showStatus('error', 'Auto-save failed');
            }
        }, SAVE_DEBOUNCE_MS);
    }

    async function saveTable() {
        if (saveTimeout) clearTimeout(saveTimeout);

        try {
            PlannerUI.showStatus('saving');
            await PlannerDB.saveTable(currentTable);
            PlannerUI.showStatus('saved');
            PlannerUI.showToast('Table saved', 'success');
        } catch (error) {
            console.error('[PlannerApp] Save error:', error);
            PlannerUI.showStatus('error', 'Save failed');
            PlannerUI.showToast('Save failed', 'error');
        }
    }

    return { init };

})();

document.addEventListener('DOMContentLoaded', () => {
    PlannerApp.init();
});
