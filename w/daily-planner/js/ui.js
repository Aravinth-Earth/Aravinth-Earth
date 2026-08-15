/**
 * Local Planner - UI Module
 * Handles modals, status indicators, toasts
 */

const PlannerUI = (function() {
    'use strict';

    function showStatus(status, message = '') {
        let statusEl = document.getElementById('save-status');
        if (!statusEl) {
            statusEl = document.createElement('div');
            statusEl.id = 'save-status';
            statusEl.className = 'status-indicator';
            document.body.appendChild(statusEl);
        }

        statusEl.className = `status-indicator ${status}`;

        switch (status) {
            case 'saving':
                statusEl.innerHTML = '<span class="spinner"></span> Saving...';
                break;
            case 'saved':
                statusEl.innerHTML = '✓ Saved';
                setTimeout(() => statusEl.classList.add('hidden'), 2000);
                break;
            case 'error':
                statusEl.innerHTML = `✕ ${message || 'Error'}`;
                break;
            case 'ready':
                statusEl.innerHTML = '✓ Ready';
                statusEl.classList.add('saved');
                setTimeout(() => statusEl.classList.add('hidden'), 1500);
                break;
        }
    }

    function showToast(message, type = '') {
        let toast = document.querySelector('.toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'toast';
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.className = `toast ${type} show`;

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    function showColumnTypeModal(column, onSave) {
        closeExistingModals();

        const types = ['freetext', 'date', 'time', 'datetime', 'number', 'dropdown'];
        const typeLabels = {
            freetext: 'Freetext',
            date: 'Date',
            time: 'Time',
            datetime: 'Date & Time',
            number: 'Number',
            dropdown: 'Dropdown'
        };

        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3>Column Type: ${escapeHtml(column.name)}</h3>
                    <button class="icon-btn" data-action="close-modal">✖️</button>
                </div>
                <div class="modal-body">
                    <label for="column-type-select">Type:</label>
                    <select id="column-type-select" class="modal-select">
                        ${types.map(t => `
                            <option value="${t}" ${column.type === t ? 'selected' : ''}>
                                ${typeLabels[t]}
                            </option>
                        `).join('')}
                    </select>
                    
                    <div id="dropdown-options-section" class="${column.type === 'dropdown' ? '' : 'hidden'}">
                        <label for="dropdown-options-input">Options (comma-separated):</label>
                        <input type="text" 
                               id="dropdown-options-input" 
                               class="modal-input"
                               value="${column.options ? column.options.join(', ') : ''}"
                               placeholder="Option1, Option2, Option3">
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="controls button" data-action="close-modal">Cancel</button>
                    <button class="controls button primary" data-action="save-column-type">Save</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const typeSelect = modal.querySelector('#column-type-select');
        const optionsSection = modal.querySelector('#dropdown-options-section');

        typeSelect.addEventListener('change', () => {
            if (typeSelect.value === 'dropdown') {
                optionsSection.classList.remove('hidden');
            } else {
                optionsSection.classList.add('hidden');
            }
        });

        modal.addEventListener('click', (e) => {
            if (e.target.dataset?.action === 'close-modal' || e.target === modal) {
                modal.remove();
            }

            if (e.target.dataset?.action === 'save-column-type') {
                const newType = typeSelect.value;
                let options = [];
                
                if (newType === 'dropdown') {
                    const optionsInput = modal.querySelector('#dropdown-options-input').value;
                    options = optionsInput.split(',').map(o => o.trim()).filter(o => o);
                }

                onSave(newType, options);
                modal.remove();
            }
        });

        return modal;
    }

    function showAddDropdownValueModal(columnId, rowId, onSave) {
        closeExistingModals();

        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.innerHTML = `
            <div class="modal add-value-modal">
                <div class="modal-header">
                    <h3>Add New Value</h3>
                    <button class="icon-btn" data-action="close-modal">✖️</button>
                </div>
                <div class="modal-body">
                    <input type="text" 
                           class="add-value-input" 
                           id="new-dropdown-value"
                           placeholder="Enter new value"
                           maxlength="150"
                           autofocus>
                </div>
                <div class="modal-footer">
                    <button class="controls button" data-action="close-modal">Cancel</button>
                    <button class="controls button primary" data-action="save-dropdown-value" data-column-id="${columnId}" data-row-id="${rowId}">Add</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const input = modal.querySelector('#new-dropdown-value');
        input.focus();

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && input.value.trim()) {
                onSave(input.value.trim());
                modal.remove();
            }
        });

        modal.addEventListener('click', (e) => {
            if (e.target.dataset?.action === 'close-modal' || e.target === modal) {
                modal.remove();
            }

            if (e.target.dataset?.action === 'save-dropdown-value') {
                const value = input.value.trim();
                if (value) {
                    onSave(value);
                }
                modal.remove();
            }
        });

        return modal;
    }

    function showConfirmDialog(message, onConfirm, onCancel) {
        closeExistingModals();

        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.innerHTML = `
            <div class="modal confirm-modal">
                <div class="modal-header">
                    <h3>Confirm</h3>
                </div>
                <div class="modal-body">
                    <p>${escapeHtml(message)}</p>
                </div>
                <div class="modal-footer">
                    <button class="controls button" data-action="close-modal">Cancel</button>
                    <button class="controls button danger" id="confirm-action">Confirm</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.addEventListener('click', (e) => {
            if (e.target.dataset?.action === 'close-modal' || e.target === modal) {
                modal.remove();
                if (onCancel) onCancel();
            }

            if (e.target.id === 'confirm-action') {
                modal.remove();
                if (onConfirm) onConfirm();
            }
        });

        return modal;
    }

    function closeExistingModals() {
        document.querySelectorAll('.modal-overlay').forEach(m => m.remove());
    }

    function escapeHtml(text) {
        if (text === null || text === undefined) return '';
        const div = document.createElement('div');
        div.textContent = String(text);
        return div.innerHTML;
    }

    return {
        showStatus,
        showToast,
        showColumnTypeModal,
        showAddDropdownValueModal,
        showConfirmDialog,
        closeExistingModals,
        escapeHtml
    };
})();
