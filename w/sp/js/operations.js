/**
 * Local Planner - Operations Module
 * Handles all row and column CRUD operations
 */

const PlannerOperations = (function() {
    'use strict';

    function addRow(currentTable, createRow) {
        if (!currentTable || !currentTable.columns) return null;

        const newRow = createRow(currentTable.columns, currentTable.rows.length);
        currentTable.rows.push(newRow);
        return newRow;
    }

    function deleteRow(currentTable, rowId) {
        if (!currentTable || !currentTable.rows) return false;

        const index = currentTable.rows.findIndex(r => r.id === rowId);
        if (index === -1) return false;

        currentTable.rows.splice(index, 1);
        return true;
    }

    function moveRow(currentTable, rowId, direction) {
        if (!currentTable || !currentTable.rows) return false;

        const index = currentTable.rows.findIndex(r => r.id === rowId);
        if (index === -1) return false;

        let newIndex;
        if (direction === 'up' && index > 0) {
            newIndex = index - 1;
        } else if (direction === 'down' && index < currentTable.rows.length - 1) {
            newIndex = index + 1;
        } else {
            return false;
        }

        const temp = currentTable.rows[index];
        currentTable.rows[index] = currentTable.rows[newIndex];
        currentTable.rows[newIndex] = temp;
        return true;
    }

    function addColumn(currentTable, name, type, addColumnToTable) {
        if (!currentTable) return false;

        const colNum = currentTable.columns.length + 1;
        const columnName = name || `C${colNum}`;
        addColumnToTable(currentTable, columnName, type);
        return true;
    }

    function deleteColumn(currentTable, columnId, removeColumnFromTable) {
        if (!currentTable || !currentTable.columns) return false;
        if (currentTable.columns.length <= 1) return false;

        removeColumnFromTable(currentTable, columnId);
        return true;
    }

    function updateColumnName(currentTable, columnId, newName, getLocalTimestamp) {
        if (!currentTable || !currentTable.columns) return false;

        const column = currentTable.columns.find(c => c.id === columnId);
        if (!column) return false;

        const trimmed = newName.trim();
        column.name = trimmed || 'Untitled';
        column.updatedAt = getLocalTimestamp();
        return true;
    }

    function changeColumnType(currentTable, columnId, newType, getLocalTimestamp) {
        if (!currentTable || !currentTable.columns) return null;

        const column = currentTable.columns.find(c => c.id === columnId);
        if (!column) return null;

        column.type = newType;
        column.updatedAt = getLocalTimestamp();

        if (newType === 'dropdown') {
            column.maxLength = 150;
            column.options = column.options || [];
        } else if (newType === 'freetext') {
            column.maxLength = 500;
        } else {
            column.maxLength = null;
        }

        return column;
    }

    function updateCellValue(currentTable, rowId, columnId, value, updateCellInDB) {
        if (!currentTable || !currentTable.rows || !currentTable.columns) return false;

        const row = currentTable.rows.find(r => r.id === rowId);
        if (!row) return false;

        const column = currentTable.columns.find(c => c.id === columnId);
        if (!column) return false;

        let finalValue = value;
        if (column.type === 'freetext' && column.maxLength) {
            finalValue = String(value).substring(0, column.maxLength);
        }

        updateCellInDB(row, columnId, finalValue);

        if (column.type === 'dropdown' && finalValue && !column.options.includes(finalValue)) {
            column.options = column.options || [];
            column.options.push(finalValue);
            return true;
        }

        return true;
    }

    function saveDropdownValue(currentTable, columnId, rowId, value, getLocalTimestamp) {
        if (!currentTable || !currentTable.columns || !currentTable.rows) return false;

        const column = currentTable.columns.find(c => c.id === columnId);
        if (!column) return false;

        if (!column.options) {
            column.options = [];
        }

        column.options = column.options.filter(opt => {
            if (!opt || typeof opt !== 'string') return false;
            const trimmed = opt.trim();
            if (!trimmed) return false;
            if (trimmed === '-- Select --') return false;
            if (trimmed.includes('<') || trimmed.includes('>')) return false;
            return true;
        });

        if (!column.options.includes(value)) {
            column.options.push(value);
        }

        const row = currentTable.rows.find(r => r.id === rowId);
        if (row) {
            row.cells[columnId] = {
                value: value,
                updatedAt: getLocalTimestamp()
            };
            row.updatedAt = getLocalTimestamp();
        }

        return true;
    }

    function clearTable(currentTable) {
        if (!currentTable) return false;

        currentTable.rows = [];
        currentTable.columns = [];
        return true;
    }

    return {
        addRow,
        deleteRow,
        moveRow,
        addColumn,
        deleteColumn,
        updateColumnName,
        changeColumnType,
        updateCellValue,
        saveDropdownValue,
        clearTable
    };
})();
