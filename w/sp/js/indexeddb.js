/**
 * IndexedDB Data Layer for Local Planner
 * Handles all data persistence operations
 */

const PlannerDB = (function() {
    'use strict';

    const DB_NAME = 'LocalPlannerDB';
    const DB_VERSION = 1;
    const STORE_NAME = 'tables';

    let db = null;

    /**
     * Initialize IndexedDB connection
     * @returns {Promise<IDBDatabase>}
     */
    async function init() {
        return new Promise((resolve, reject) => {
            if (db) {
                resolve(db);
                return;
            }

            console.log('[PlannerDB] Initializing IndexedDB...');

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('[PlannerDB] Failed to open database:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                db = request.result;
                console.log('[PlannerDB] Database opened successfully');
                resolve(db);
            };

            request.onupgradeneeded = (event) => {
                const database = event.target.result;
                console.log('[PlannerDB] Upgrading database schema...');

                if (!database.objectStoreNames.contains(STORE_NAME)) {
                    const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    store.createIndex('name', 'name', { unique: false });
                    console.log('[PlannerDB] Object store created:', STORE_NAME);
                }
            };
        });
    }

    /**
     * Get a table by ID
     * @param {string} tableId 
     * @returns {Promise<Object|null>}
     */
    async function getTable(tableId = 'default') {
        try {
            await init();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([STORE_NAME], 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.get(tableId);

                request.onerror = () => {
                    console.error(`[PlannerDB] Error getting table ${tableId}:`, request.error);
                    reject(request.error);
                };

                request.onsuccess = () => {
                    console.log(`[PlannerDB] Table ${tableId} retrieved:`, request.result ? 'Found' : 'Not found');
                    resolve(request.result || null);
                };
            });
        } catch (error) {
            console.error('[PlannerDB] getTable error:', error);
            throw error;
        }
    }

    /**
     * Save or update a table
     * @param {Object} tableData 
     * @returns {Promise<void>}
     */
    async function saveTable(tableData) {
        try {
            await init();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([STORE_NAME], 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                
                const now = new Date().toISOString();
                const data = {
                    ...tableData,
                    id: tableData.id || 'default',
                    updatedAt: now
                };

                if (!data.createdAt) {
                    data.createdAt = now;
                }

                const request = store.put(data);

                request.onerror = () => {
                    console.error('[PlannerDB] Error saving table:', request.error);
                    reject(request.error);
                };

                request.onsuccess = () => {
                    console.log('[PlannerDB] Table saved successfully at', now);
                    resolve();
                };
            });
        } catch (error) {
            console.error('[PlannerDB] saveTable error:', error);
            throw error;
        }
    }

    /**
     * Delete a table
     * @param {string} tableId 
     * @returns {Promise<void>}
     */
    async function deleteTable(tableId = 'default') {
        try {
            await init();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([STORE_NAME], 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.delete(tableId);

                request.onerror = () => {
                    console.error('[PlannerDB] Error deleting table:', request.error);
                    reject(request.error);
                };

                request.onsuccess = () => {
                    console.log('[PlannerDB] Table deleted:', tableId);
                    resolve();
                };
            });
        } catch (error) {
            console.error('[PlannerDB] deleteTable error:', error);
            throw error;
        }
    }

    /**
     * Generate a unique ID
     * @returns {string}
     */
    function generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Get current timestamp in local format
     * @returns {string} YYYY-MM-DD HH:MM:SS
     */
    function getLocalTimestamp() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    /**
     * Create a default table structure
     * @returns {Object}
     */
    function createDefaultTable() {
        const now = getLocalTimestamp();
        return {
            id: 'default',
            name: 'My Tasks',
            columns: [
                {
                    id: generateId(),
                    name: 'C1',
                    type: 'freetext',
                    order: 0,
                    options: [],
                    maxLength: 500
                },
                {
                    id: generateId(),
                    name: 'C2',
                    type: 'freetext',
                    order: 1,
                    options: [],
                    maxLength: 500
                },
                {
                    id: generateId(),
                    name: 'C3',
                    type: 'freetext',
                    order: 2,
                    options: [],
                    maxLength: 500
                }
            ],
            rows: [],
            createdAt: now,
            updatedAt: now
        };
    }

    /**
     * Create a new row with default cells
     * @param {Array} columns 
     * @param {number} rowIndex 
     * @returns {Object}
     */
    function createRow(columns, rowIndex = 0) {
        const now = getLocalTimestamp();
        const cells = {};

        columns.forEach(col => {
            cells[col.id] = {
                value: '',
                updatedAt: now
            };
        });

        return {
            id: generateId(),
            cells: cells,
            createdAt: now,
            updatedAt: now
        };
    }

    /**
     * Update a cell and set its updatedAt timestamp
     * @param {Object} row 
     * @param {string} columnId 
     * @param {any} value 
     * @returns {Object} Updated row
     */
    function updateCell(row, columnId, value) {
        const now = getLocalTimestamp();
        row.cells[columnId] = {
            value: value,
            updatedAt: now
        };
        
        // Update row's updatedAt to max of all cell updatedAt
        row.updatedAt = Object.values(row.cells)
            .map(cell => cell.updatedAt)
            .reduce((max, ts) => ts > max ? ts : max, row.createdAt);

        return row;
    }

    /**
     * Add a new column to the table
     * @param {Object} table 
     * @param {string} name 
     * @param {string} type 
     * @returns {Object} Updated table
     */
    function addColumn(table, name, columnType = 'freetext') {
        const newColumn = {
            id: generateId(),
            name: name,
            type: columnType,
            order: table.columns.length,
            options: [],
            maxLength: columnType === 'freetext' ? 500 : (columnType === 'dropdown' ? 150 : null)
        };

        table.columns.push(newColumn);

        // Add cell to each row for the new column
        const now = getLocalTimestamp();
        table.rows.forEach(row => {
            row.cells[newColumn.id] = {
                value: '',
                updatedAt: now
            };
        });

        return table;
    }

    /**
     * Remove a column from the table
     * @param {Object} table 
     * @param {string} columnId 
     * @returns {Object} Updated table
     */
    function removeColumn(table, columnId) {
        table.columns = table.columns.filter(col => col.id !== columnId);
        
        table.rows.forEach(row => {
            delete row.cells[columnId];
        });

        // Re-order remaining columns
        table.columns.forEach((col, index) => {
            col.order = index;
        });

        return table;
    }

    /**
     * Collect all unique values from a dropdown column
     * @param {Object} table 
     * @param {string} columnId 
     * @returns {Array<string>}
     */
    function collectDropdownOptions(table, columnId) {
        const options = new Set();
        
        table.rows.forEach(row => {
            const cellValue = row.cells[columnId]?.value;
            if (cellValue && typeof cellValue === 'string' && cellValue.trim()) {
                options.add(cellValue.trim());
            }
        });

        return Array.from(options).sort();
    }

    /**
     * Export table to JSON format for file download
     * @param {Object} table 
     * @returns {Object}
     */
    function exportToJSON(table) {
        return {
            version: '1.0',
            exportedAt: getLocalTimestamp(),
            name: table.name,
            columns: table.columns.map(col => ({
                name: col.name,
                type: col.type,
                options: col.options || [],
                maxLength: col.maxLength || null
            })),
            rows: table.rows.map(row => ({
                cells: Object.values(row.cells).map(cell => cell.value),
                createdAt: row.createdAt,
                updatedAt: row.updatedAt
            }))
        };
    }

    /**
     * Import table from JSON (file format)
     * @param {Object} jsonData 
     * @returns {Object}
     */
    function importFromJSON(jsonData) {
        if (!jsonData.version || !jsonData.columns || !jsonData.rows) {
            throw new Error('Invalid table data format');
        }

        const now = getLocalTimestamp();
        const columns = jsonData.columns.map((col, index) => ({
            id: generateId(),
            name: col.name,
            type: col.type || 'freetext',
            order: index,
            options: col.options || [],
            maxLength: col.maxLength || (col.type === 'dropdown' ? 150 : 500)
        }));

        const rows = jsonData.rows.map(rowData => {
            const cells = {};
            columns.forEach((col, index) => {
                cells[col.id] = {
                    value: rowData.cells[index] || '',
                    updatedAt: rowData.updatedAt || now
                };
            });

            return {
                id: generateId(),
                cells: cells,
                createdAt: rowData.createdAt || now,
                updatedAt: rowData.updatedAt || now
            };
        });

        return {
            id: 'default',
            name: jsonData.name || 'Imported Table',
            columns: columns,
            rows: rows,
            createdAt: now,
            updatedAt: now
        };
    }

    // Public API
    return {
        init,
        getTable,
        saveTable,
        deleteTable,
        generateId,
        getLocalTimestamp,
        createDefaultTable,
        createRow,
        updateCell,
        addColumn,
        removeColumn,
        collectDropdownOptions,
        exportToJSON,
        importFromJSON
    };
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlannerDB;
}
