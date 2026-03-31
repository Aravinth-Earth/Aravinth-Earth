/**
 * Local Planner - Events Module
 * Handles all event listeners and delegates
 */

const PlannerEvents = (function() {
    'use strict';

    function setupEventListeners(tableEl, handlers) {
        const { onClick, onInput, onChange, onBlur, onKeydown, onFilterInput, onColumnHeaderInput } = handlers;

        tableEl.addEventListener('click', (e) => {
            if (e.target.closest('.column-type-badge') ||
                e.target.closest('[data-action="delete-column"]') ||
                e.target.closest('[data-action="sort"]') ||
                e.target.closest('[data-action="delete-row"]') ||
                e.target.closest('[data-action="move-row"]') ||
                e.target.closest('[data-action="add-dropdown-value"]') ||
                e.target.closest('[data-action="close-modal"]') ||
                e.target.closest('.dropdown-add-new') ||
                e.target.closest('.modal-overlay')) {
                onClick(e);
            }
        });

        tableEl.addEventListener('input', (e) => {
            if (e.target.classList.contains('filter-input')) return;
            if (e.target.classList.contains('cell-input')) return;
            if (e.target.dataset?.field === 'name') {
                onColumnHeaderInput(e);
            }
        });

        tableEl.addEventListener('change', (e) => {
            if (e.target.classList.contains('cell-input')) {
                onChange(e);
            }
        });

        tableEl.addEventListener('blur', (e) => {
            if (e.target.matches('[data-field="value"]') || 
                e.target.matches('[data-field="name"]')) {
                onBlur(e);
            }
        }, true);

        document.addEventListener('keydown', (e) => {
            onKeydown(e);
        });

        tableEl.addEventListener('input', (e) => {
            if (e.target.classList.contains('filter-input')) {
                onFilterInput(e);
            }
        });
    }

    function setupModalEvents(modal, handlers) {
        const { onClose, onSave } = handlers;

        modal.addEventListener('click', (e) => {
            if (e.target.dataset?.action === 'close-modal' || e.target === modal) {
                onClose();
            }

            if (e.target.dataset?.action === 'save-column-type') {
                onSave();
            }
        });

        const closeBtn = modal.querySelector('[data-action="close-modal"]');
        if (closeBtn) {
            closeBtn.addEventListener('click', onClose);
        }
    }

    return {
        setupEventListeners,
        setupModalEvents
    };
})();
