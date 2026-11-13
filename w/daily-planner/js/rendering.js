/**
 * Local Planner - Rendering Module
 * Handles all table rendering functions
 */

const PlannerRenderer = (function() {
    'use strict';

    function renderHeader(thead, columns, filterRowHTML, sortState, onColumnHeaderClick) {
        let headerHTML = `
            <tr>
                <th><span class="visually-hidden">Row actions</span></th>
                <th><span class="visually-hidden">Row number</span></th>
                ${columns.map(col => `
                    <th>
                        <div class="column-header">
                            <span class="header-text" 
                                  contenteditable="true" 
                                  data-field="name" 
                                  data-column-id="${escapeAttr(col.id)}">${escapeHtml(col.name)}</span>
                            <span class="column-type-badge" 
                                  title="Click to change column type"
                                  data-column-id="${escapeAttr(col.id)}"
                                  data-action="change-type">${escapeHtml(col.type)}</span>
                            <div class="header-actions">
                                <button class="icon-btn" 
                                        title="Sort" 
                                        data-action="sort"
                                        data-column-id="${escapeAttr(col.id)}"
                                        data-sort-dir="${escapeAttr(sortState[col.id] || '')}">↕️</button>
                                <button class="icon-btn danger" 
                                        title="Delete column" 
                                        data-action="delete-column"
                                        data-column-id="${escapeAttr(col.id)}">✖️</button>
                            </div>
                        </div>
                    </th>
                `).join('')}
            </tr>
        `;

        thead.innerHTML = headerHTML + filterRowHTML;
    }

    function renderFilterRow(columns) {
        return `
            <tr class="filter-row">
                <th><span class="visually-hidden">Row actions</span></th>
                <th><span class="visually-hidden">Row number</span></th>
                ${columns.map(col => `
                    <th>
                        <input type="text" 
                               class="filter-input" 
                               placeholder="Filter..."
                               data-filter-column="${escapeAttr(col.id)}">
                    </th>
                `).join('')}
            </tr>
        `;
    }

    function renderBody(tbody, rows, columns, getDropdownOptions, filterVisible = null) {
        if (!rows || rows.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="${columns.length + 2}" class="empty-state">
                        <div class="empty-state-icon">📋</div>
                        <div class="empty-state-text">No tasks yet</div>
                        <div class="empty-state-hint">Click "Add Row" to create your first task</div>
                    </td>
                </tr>
            `;
            return;
        }

        let bodyHTML = rows.map((row, index) => {
            const isFiltered = filterVisible !== null && !filterVisible[row.id];
            const isFirst = index === 0;
            const isLast = index === rows.length - 1;
            const rowId = escapeAttr(row.id);

            return `
                <tr data-row-id="${rowId}" ${isFiltered ? 'style="display:none"' : ''}>
                    <td>
                        <div class="action-buttons">
                            <button class="icon-btn ${isFirst ? 'disabled' : ''}" 
                                    title="${isFirst ? 'Move up (first row)' : 'Move up'}" 
                                    data-action="move-row"
                                    data-row-id="${rowId}"
                                    data-direction="up"
                                    ${isFirst ? 'disabled' : ''}>⬆️</button>
                            <button class="icon-btn ${isLast ? 'disabled' : ''}" 
                                    title="${isLast ? 'Move down (last row)' : 'Move down'}" 
                                    data-action="move-row"
                                    data-row-id="${rowId}"
                                    data-direction="down"
                                    ${isLast ? 'disabled' : ''}>⬇️</button>
                            <button class="icon-btn danger" 
                                    title="Delete row" 
                                    data-action="delete-row"
                                    data-row-id="${rowId}">🗑️</button>
                        </div>
                    </td>
                    <td>${index + 1}</td>
                    ${columns.map(col => renderCell(row, col, getDropdownOptions)).join('')}
                </tr>
            `;
        }).join('');

        tbody.innerHTML = bodyHTML;
    }

    function renderCell(row, column, getDropdownOptions) {
        if (!column || !row) {
            return '<td></td>';
        }

        const cellData = row.cells?.[column.id];
        const rawValue = cellData?.value ?? '';
        const value = escapeAttr(rawValue);
        const columnId = escapeAttr(column.id);
        const rowId = escapeAttr(row.id);

        switch (column.type) {
            case 'date':
                return `<td data-column-id="${columnId}" data-row-id="${rowId}">
                            <input type="date" 
                                   class="cell-input cell-date"
                                   value="${value}"
                                   data-column-id="${columnId}"
                                   data-row-id="${rowId}"
                                   data-field="value">
                        </td>`;

            case 'time':
                return `<td data-column-id="${columnId}" data-row-id="${rowId}">
                            <input type="time" 
                                   class="cell-input cell-time"
                                   value="${value}"
                                   data-column-id="${columnId}"
                                   data-row-id="${rowId}"
                                   data-field="value">
                        </td>`;

            case 'datetime':
                return `<td data-column-id="${columnId}" data-row-id="${rowId}">
                            <input type="datetime-local" 
                                   class="cell-input cell-datetime"
                                   value="${value}"
                                   data-column-id="${columnId}"
                                   data-row-id="${rowId}"
                                   data-field="value">
                        </td>`;

            case 'number':
                return `<td data-column-id="${columnId}" data-row-id="${rowId}">
                            <input type="number" 
                                   class="cell-input cell-number"
                                   value="${value}"
                                   data-column-id="${columnId}"
                                   data-row-id="${rowId}"
                                   data-field="value"
                                   placeholder="0">
                        </td>`;

            case 'dropdown':
                const options = getDropdownOptions ? getDropdownOptions(column) : [];
                return `<td data-column-id="${columnId}" data-row-id="${rowId}">
                            <div class="dropdown-cell">
                                <select class="cell-input cell-dropdown"
                                        data-column-id="${columnId}"
                                        data-row-id="${rowId}"
                                        data-field="value">
                                    <option value="">-- Select --</option>
                                    ${options.map(opt => `
                                        <option value="${escapeAttr(opt)}" ${rawValue === opt ? 'selected' : ''}>
                                            ${escapeHtml(opt)}
                                        </option>
                                    `).join('')}
                                </select>
                                <button class="dropdown-add-new" 
                                        type="button" 
                                        data-action="add-dropdown-value"
                                        data-column-id="${columnId}"
                                        data-row-id="${rowId}"
                                        title="Add new value">+</button>
                            </div>
                        </td>`;

            default:
                const maxLength = Math.max(1, Math.min(10000, parseInt(column.maxLength, 10) || 500));
                return `<td data-column-id="${columnId}"
                             data-row-id="${rowId}"
                             contenteditable="true"
                             data-field="value"
                             data-max-length="${maxLength}">${escapeHtml(rawValue)}</td>`;
        }
    }

    function updateSerialNumbers(tbody) {
        const rows = tbody.querySelectorAll('tbody tr');
        let visibleIndex = 1;
        
        rows.forEach(row => {
            if (row.style.display !== 'none') {
                const serialCell = row.cells[1];
                if (serialCell) {
                    serialCell.textContent = visibleIndex++;
                }
            }
        });
    }

    function renderColumnCells(tbody, column, rows, getDropdownOptions) {
        if (!tbody || !column || !rows) return;

        const options = getDropdownOptions ? getDropdownOptions(column) : [];
        const cells = Array.from(tbody.querySelectorAll('td[data-row-id][data-column-id]'));
        const columnId = String(column.id);
        rows.forEach(row => {
            const rowId = String(row.id);
            const cell = cells.find(el =>
                el.dataset.rowId === rowId && el.dataset.columnId === columnId
            );
            if (cell) {
                if (column.type === 'dropdown') {
                    const select = cell.querySelector('select');
                    if (select) {
                        const value = row.cells?.[column.id]?.value ?? '';
                        select.innerHTML = `
                            <option value="">-- Select --</option>
                            ${options.map(opt => `
                                <option value="${escapeAttr(opt)}" ${value === opt ? 'selected' : ''}>
                                    ${escapeHtml(opt)}
                                </option>
                            `).join('')}
                        `;
                    }
                }
            }
        });
    }

    function escapeHtml(text) {
        if (text === null || text === undefined) return '';
        const div = document.createElement('div');
        div.textContent = String(text);
        return div.innerHTML;
    }

    /**
     * Escape a value for an HTML attribute position.
     *
     * escapeHtml() round-trips through textContent -> innerHTML, which
     * escapes &, < and > but deliberately leaves quotes alone. A quoted
     * attribute value needs both quote characters escaped as well, or a
     * value from an imported table can close the attribute and open a new
     * one.
     */
    function escapeAttr(text) {
        return escapeHtml(text)
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    return {
        renderHeader,
        renderFilterRow,
        renderBody,
        renderCell,
        updateSerialNumbers,
        renderColumnCells,
        escapeHtml,
        escapeAttr
    };
})();
