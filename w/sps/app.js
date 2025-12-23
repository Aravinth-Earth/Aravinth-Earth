// Stock Portfolio Split - App Logic

// Configuration Constants
const CONFIG = {
    CURRENCY_SYMBOL: '₹',
    CURRENCY_LOCALE: 'en-IN',
    MAX_AMOUNT: 1000000000000, // 1 trillion max
    MIN_AMOUNT: 0.01,
    PIE_CHART_THRESHOLD: 20, // Switch to bar chart above this many holdings
    LABEL_VISIBILITY_THRESHOLD: 3, // Show labels only for slices >3%
    MAX_TICKER_LENGTH: 10,
    NOTIFICATION_DURATION: 3000,
    MAX_NOTIFICATIONS: 3
};

class PortfolioManager {
    constructor() {
        this.holdings = [];
        this.chart = null;
        this.editingIndex = null;
        this.forceChartType = null; // 'pie', 'bar', or null for auto
        this.nextId = 1; // For unique holding IDs
        this.activeNotifications = 0;
        this.init();
    }

    init() {
        this.loadFromLocalStorage();
        this.setupEventListeners();
        this.initChart();
        this.updateUI();
    }

    setupEventListeners() {
        // Form submission
        document.getElementById('holding-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });

        // Header actions
        document.getElementById('chart-toggle-btn').addEventListener('click', () => this.toggleChartView());
        document.getElementById('export-btn').addEventListener('click', () => this.exportData());
        document.getElementById('import-btn').addEventListener('click', () => this.openImportModal());
        document.getElementById('clear-all-btn').addEventListener('click', () => this.clearAll());

        // Modal actions
        document.getElementById('close-import-modal').addEventListener('click', () => this.closeImportModal());
        document.getElementById('cancel-import-btn').addEventListener('click', () => this.closeImportModal());
        document.getElementById('confirm-import-btn').addEventListener('click', () => this.importData());
        document.getElementById('choose-file-btn').addEventListener('click', () => {
            document.getElementById('import-file').click();
        });
        document.getElementById('import-file').addEventListener('change', (e) => this.handleFileUpload(e));

        // Cancel edit button
        document.getElementById('cancel-edit-btn').addEventListener('click', () => this.cancelEdit());

        // Event delegation for table actions (CSP-safe)
        document.getElementById('portfolio-body').addEventListener('click', (e) => {
            const target = e.target.closest('.btn-icon');
            if (!target) return;
            
            const row = target.closest('tr');
            if (!row) return;
            
            const holdingId = parseInt(row.dataset.holdingId);
            if (isNaN(holdingId)) return;
            
            if (target.classList.contains('btn-edit')) {
                this.editHoldingById(holdingId);
            } else if (target.classList.contains('btn-delete')) {
                this.deleteHoldingById(holdingId);
            }
        });

        // Input validation
        const amountInput = document.getElementById('amount');
        amountInput.addEventListener('input', (e) => {
            let value = parseFloat(e.target.value);
            if (isNaN(value)) return;
            if (value < 0) e.target.value = '';
            if (value > CONFIG.MAX_AMOUNT) e.target.value = CONFIG.MAX_AMOUNT;
        });

        // Close modal on outside click
        document.getElementById('import-modal').addEventListener('click', (e) => {
            if (e.target.id === 'import-modal') {
                this.closeImportModal();
            }
        });
    }

    handleFormSubmit() {
        const tickerInput = document.getElementById('ticker').value.trim().toUpperCase();
        const amountInput = parseFloat(document.getElementById('amount').value);

        // Sanitize ticker input (XSS protection)
        const ticker = this.sanitizeTicker(tickerInput);
        
        if (!ticker || ticker.length > CONFIG.MAX_TICKER_LENGTH) {
            this.showNotification(`Ticker must be 1-${CONFIG.MAX_TICKER_LENGTH} characters`, 'error');
            return;
        }

        // Validate amount
        const amount = this.validateAmount(amountInput);
        if (amount === null) {
            this.showNotification(
                `Amount must be between ${CONFIG.CURRENCY_SYMBOL}${CONFIG.MIN_AMOUNT} and ${CONFIG.CURRENCY_SYMBOL}${CONFIG.MAX_AMOUNT.toLocaleString(CONFIG.CURRENCY_LOCALE)}`, 
                'error'
            );
            return;
        }

        if (this.editingIndex !== null) {
            // Update existing holding
            const holding = this.holdings.find(h => h.id === this.editingIndex);
            if (holding) {
                holding.ticker = ticker;
                holding.amount = amount;
            }
            this.editingIndex = null;
            document.getElementById('add-btn').innerHTML = '➕ Add Holding';
            document.getElementById('cancel-edit-btn').style.display = 'none';
            this.showNotification('Holding updated successfully', 'success');
        } else {
            // Check for duplicate ticker
            const existingHolding = this.holdings.find(h => h.ticker === ticker);
            if (existingHolding) {
                // Update existing instead of creating duplicate
                existingHolding.amount += amount;
                this.showNotification(`Added ${CONFIG.CURRENCY_SYMBOL}${amount.toLocaleString(CONFIG.CURRENCY_LOCALE)} to existing ${ticker} holding`, 'success');
            } else {
                // Add new holding with unique ID
                this.holdings.push({ 
                    id: this.nextId++, 
                    ticker, 
                    amount 
                });
                this.showNotification('Holding added successfully', 'success');
            }
        }

        this.saveToLocalStorage();
        this.resetForm();
        this.updateUI();
    }

    sanitizeTicker(ticker) {
        // Remove any non-alphanumeric characters except dash and dot
        return ticker.replace(/[^A-Z0-9.-]/g, '');
    }

    validateAmount(amount) {
        if (isNaN(amount) || amount < CONFIG.MIN_AMOUNT || amount > CONFIG.MAX_AMOUNT) {
            return null;
        }
        return amount;
    }

    editHoldingById(holdingId) {
        const holding = this.holdings.find(h => h.id === holdingId);
        if (!holding) return;
        
        this.editingIndex = holdingId;
        
        document.getElementById('ticker').value = holding.ticker;
        document.getElementById('amount').value = holding.amount;
        document.getElementById('add-btn').innerHTML = '💾 Update Holding';
        document.getElementById('cancel-edit-btn').style.display = 'inline-flex';
        
        // Scroll to form
        document.querySelector('.form-card').scrollIntoView({ behavior: 'smooth' });
    }

    editHolding(index) {
        const holding = this.holdings[index];
        if (!holding || typeof holding.id === 'undefined') {
            return;
        }
        this.editHoldingById(holding.id);
    }

    cancelEdit() {
        this.editingIndex = null;
        document.getElementById('add-btn').innerHTML = '➕ Add Holding';
        document.getElementById('cancel-edit-btn').style.display = 'none';
        this.resetForm();
    }

    toggleChartView() {
        if (!this.chart || this.holdings.length === 0) return;
        
        const currentType = this.chart.config.type;
        this.forceChartType = currentType === 'pie' ? 'bar' : 'pie';
        this.updateChart();
    }

    deleteHoldingById(holdingId) {
        const holding = this.holdings.find(h => h.id === holdingId);
        if (!holding) return;
        
        if (confirm(`Are you sure you want to delete ${holding.ticker}?`)) {
            const index = this.holdings.findIndex(h => h.id === holdingId);
            this.holdings.splice(index, 1);
            
            // Clear editing state if deleting the holding being edited
            if (this.editingIndex === holdingId) {
                this.cancelEdit();
            }
            
            this.saveToLocalStorage();
            this.updateUI();
            this.showNotification('Holding deleted', 'success');
        }
    }

    deleteHolding(index) {
        // Legacy method - find by index
        const holding = this.holdings[index];
        if (!holding) return;
        this.deleteHoldingById(holding.id);
    }

    resetForm() {
        document.getElementById('holding-form').reset();
        document.getElementById('ticker').focus();
    }

    updateUI() {
        this.updateSummary();
        this.updateTable();
        this.updateChart();
    }

    updateSummary() {
        const total = this.holdings.reduce((sum, h) => sum + h.amount, 0);
        const count = this.holdings.length;
        const avg = count > 0 ? (100 / count).toFixed(1) : 0;

        document.getElementById('total-value').textContent = this.formatCurrency(total);
        document.getElementById('holding-count').textContent = count;
        document.getElementById('avg-allocation').textContent = `${avg}%`;
    }

    updateTable() {
        const tbody = document.getElementById('portfolio-body');
        const total = this.holdings.reduce((sum, h) => sum + h.amount, 0);

        if (this.holdings.length === 0) {
            tbody.innerHTML = `
                <tr class="empty-state">
                    <td colspan="4">
                        <div class="empty-message">
                            <span class="empty-icon">📊</span>
                            <p>No holdings yet. Add your first stock above!</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        // Sort holdings by amount descending
        const sortedHoldings = [...this.holdings].sort((a, b) => b.amount - a.amount);

        // Use textContent for security, data attributes for IDs
        tbody.innerHTML = sortedHoldings.map((holding) => {
            const percentage = total > 0 ? (holding.amount / total * 100).toFixed(2) : 0;
            
            return `
                <tr data-holding-id="${holding.id}">
                    <td class="ticker"></td>
                    <td class="amount">${this.formatCurrency(holding.amount)}</td>
                    <td>
                        <div class="allocation">
                            <div class="allocation-bar">
                                <div class="allocation-fill" style="width: ${percentage}%"></div>
                            </div>
                            <span class="allocation-text">${percentage}%</span>
                        </div>
                    </td>
                    <td>
                        <div class="actions">
                            <button class="btn-icon btn-edit" title="Edit" aria-label="Edit ${this.escapeHtml(holding.ticker)}">
                                ✏️
                            </button>
                            <button class="btn-icon btn-delete" title="Delete" aria-label="Delete ${this.escapeHtml(holding.ticker)}">
                                🗑️
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        
        // Safely set ticker text content (XSS protection)
        sortedHoldings.forEach((holding, index) => {
            const row = tbody.children[index];
            if (row) {
                const tickerCell = row.querySelector('.ticker');
                if (tickerCell) {
                    tickerCell.textContent = holding.ticker;
                }
            }
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    initChart() {
        const ctx = document.getElementById('allocation-chart').getContext('2d');
        
        this.chart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [],
                    borderColor: '#1e293b',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: '#0f172a',
                        titleColor: '#f1f5f9',
                        bodyColor: '#94a3b8',
                        borderColor: '#334155',
                        borderWidth: 1,
                        padding: 12,
                        displayColors: true,
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(2);
                                return `${label}: ${CONFIG.CURRENCY_SYMBOL}${value.toLocaleString(CONFIG.CURRENCY_LOCALE)} (${percentage}%)`;
                            }
                        }
                    },
                    datalabels: {
                        color: '#f1f5f9',
                        font: {
                            size: 11,
                            weight: 500,
                            family: "'Inter', sans-serif"
                        },
                        formatter: (value, ctx) => {
                            const total = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            const label = ctx.chart.data.labels[ctx.dataIndex];
                            const amount = CONFIG.CURRENCY_SYMBOL + value.toLocaleString(CONFIG.CURRENCY_LOCALE, { maximumFractionDigits: 0 });
                            
                            // Show labels only if >3% to avoid clutter
                            if (parseFloat(percentage) < CONFIG.LABEL_VISIBILITY_THRESHOLD) return '';
                            
                            return `${label}\n${percentage}%\n${amount}`;
                        },
                        align: 'end',
                        anchor: 'end',
                        offset: 8,
                        backgroundColor: 'rgba(15, 23, 42, 0.8)',
                        borderRadius: 4,
                        padding: 6
                    },
                    title: {
                        display: false
                    }
                },
                layout: {
                    padding: 40
                }
            },
            plugins: [ChartDataLabels]
        });
    }

    updateChart() {
        if (!this.chart) return;
        
        const noDataMsg = document.getElementById('no-data-message');
        const canvas = document.getElementById('allocation-chart');
        const toggleBtn = document.getElementById('chart-toggle-btn');
        
        if (this.holdings.length === 0) {
            this.chart.data.labels = [];
            this.chart.data.datasets[0].data = [];
            this.chart.data.datasets[0].backgroundColor = [];
            this.chart.update();
            noDataMsg.classList.remove('hidden');
            canvas.style.display = 'none';
            toggleBtn.style.display = 'none';
            return;
        }

        noDataMsg.classList.add('hidden');
        canvas.style.display = 'block';
        toggleBtn.style.display = 'inline-flex';

        // Sort holdings by amount descending for better visualization
        const sortedHoldings = [...this.holdings].sort((a, b) => b.amount - a.amount);
        
        // Smart view switching: use forced type or auto-select
        let usePieChart;
        if (this.forceChartType) {
            usePieChart = this.forceChartType === 'pie';
        } else {
            usePieChart = sortedHoldings.length <= CONFIG.PIE_CHART_THRESHOLD;
        }
        
        const currentType = this.chart.config.type;
        const needsRecreate = currentType !== (usePieChart ? 'pie' : 'bar');
        
        // Adjust canvas height for bar charts with many items
        const wrapper = canvas.parentElement;
        if (!usePieChart && sortedHoldings.length > 20) {
            wrapper.style.height = Math.min(sortedHoldings.length * 25 + 100, 800) + 'px';
        } else {
            wrapper.style.height = '';
        }
        
        if (needsRecreate) {
            // Only destroy and recreate if type actually changed
            this.chart.destroy();
            this.chart = null;
            this.initChart();
            this.chart.config.type = usePieChart ? 'pie' : 'bar';
            
            if (!usePieChart) {
                // Configure for horizontal bar chart

            if (usePieChart) {
                // Recreate default pie chart
                this.initChart();
            } else {
                // Create a new bar chart directly with the correct type
                const ctx = canvas.getContext('2d');
                this.chart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: [],
                        datasets: [{
                            data: [],
                            backgroundColor: []
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            }
                        }
                    }
                });
            }
                this.chart.options.plugins.datalabels = {
                    color: '#f1f5f9',
                    anchor: 'end',
                    align: 'end',
                    formatter: (value, ctx) => {
                        const total = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                        return percentage + '%';
                    },
                    font: {
                        size: 10,
                        weight: 500
                    }
                };
                this.chart.options.scales = {
                    x: {
                        grid: { color: '#334155' },
                        ticks: { color: '#94a3b8' }
                    },
                    y: {
                        grid: { display: false },
                        ticks: { color: '#94a3b8', font: { size: 10 } }
                    }
                };
            }
        }

        this.chart.data.labels = sortedHoldings.map(h => h.ticker);
        this.chart.data.datasets[0].data = sortedHoldings.map(h => h.amount);
        this.chart.data.datasets[0].backgroundColor = this.generateColors(sortedHoldings.length);
        this.chart.update();
    }

    generateColors(count) {
        // Base palette - vibrant, distinct colors
        const baseColors = [
            '#10b981', '#3b82f6', '#a855f7', '#06b6d4', '#f59e0b', 
            '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
            '#84cc16', '#6366f1', '#f43f5e', '#22d3ee', '#eab308',
            '#fb923c', '#4ade80', '#818cf8', '#fb7185', '#38bdf8'
        ];

        if (count <= baseColors.length) {
            return baseColors.slice(0, count);
        }

        // For many entries, generate colors using HSL for even distribution
        const colors = [];
        const hueStep = 360 / count;
        
        for (let i = 0; i < count; i++) {
            if (i < baseColors.length) {
                colors.push(baseColors[i]);
            } else {
                // Generate distributed hues with good saturation and lightness
                const hue = (i * hueStep) % 360;
                const saturation = 65 + (i % 3) * 10; // 65-85%
                const lightness = 55 + (i % 4) * 5;   // 55-70%
                colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
            }
        }
        
        return colors;
    }

    formatCurrency(amount) {
        return `${CONFIG.CURRENCY_SYMBOL}${amount.toLocaleString(CONFIG.CURRENCY_LOCALE, { maximumFractionDigits: 2 })}`;
    }

    // Local Storage
    saveToLocalStorage() {
        try {
            const data = JSON.stringify({
                holdings: this.holdings,
                nextId: this.nextId
            });
            localStorage.setItem('portfolio-holdings', data);
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                this.showNotification('Storage quota exceeded. Consider exporting your data.', 'error');
            } else {
                console.error('Failed to save to localStorage:', e);
                this.showNotification('Failed to save data locally', 'error');
            }
        }
    }

    loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem('portfolio-holdings');
            if (saved) {
                const data = JSON.parse(saved);
                
                // Handle old format (array) and new format (object)
                if (Array.isArray(data)) {
                    // Migrate old format
                    this.holdings = data.map((h, index) => ({
                        id: index + 1,
                        ticker: h.ticker,
                        amount: parseFloat(h.amount)
                    }));
                    this.nextId = this.holdings.length + 1;
                } else {
                    this.holdings = data.holdings || [];
                    this.nextId = data.nextId || this.holdings.length + 1;
                }
            }
        } catch (e) {
            console.error('Failed to load holdings:', e);
            this.holdings = [];
            this.nextId = 1;
            this.showNotification('Failed to load saved data', 'error');
        }
    }

    // Import/Export
    exportData() {
        if (this.holdings.length === 0) {
            this.showNotification('No data to export', 'error');
            return;
        }

        const dataStr = JSON.stringify(this.holdings, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `portfolio-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('Portfolio exported successfully', 'success');
    }

    openImportModal() {
        document.getElementById('import-modal').classList.add('show');
        document.getElementById('import-textarea').value = '';
        document.getElementById('file-name').textContent = '';
    }

    closeImportModal() {
        document.getElementById('import-modal').classList.remove('show');
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        document.getElementById('file-name').textContent = file.name;

        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('import-textarea').value = e.target.result;
        };
        reader.readAsText(file);
    }

    importData() {
        const textarea = document.getElementById('import-textarea');
        const data = textarea.value.trim();

        if (!data) {
            this.showNotification('Please paste or upload data to import', 'error');
            return;
        }

        try {
            const imported = JSON.parse(data);
            
            if (!Array.isArray(imported)) {
                throw new Error('Data must be an array');
            }

            if (imported.length === 0) {
                throw new Error('No data to import');
            }

            // Validate and clean structure with detailed error tracking
            const validItems = [];
            const errors = [];
            
            imported.forEach((item, index) => {
                if (!item.ticker || typeof item.ticker !== 'string') {
                    errors.push(`Row ${index + 1}: Missing or invalid ticker`);
                    return;
                }
                
                const sanitizedTicker = this.sanitizeTicker(item.ticker.toUpperCase());
                if (sanitizedTicker.length === 0 || sanitizedTicker.length > CONFIG.MAX_TICKER_LENGTH) {
                    errors.push(`Row ${index + 1}: Ticker "${item.ticker}" is invalid (must be 1-${CONFIG.MAX_TICKER_LENGTH} characters)`);
                    return;
                }
                
                const amount = parseFloat(item.amount);
                if (isNaN(amount)) {
                    errors.push(`Row ${index + 1}: Amount is not a number`);
                    return;
                }
                
                if (amount < CONFIG.MIN_AMOUNT) {
                    errors.push(`Row ${index + 1}: Amount too small (min: ${CONFIG.CURRENCY_SYMBOL}${CONFIG.MIN_AMOUNT})`);
                    return;
                }
                
                if (amount > CONFIG.MAX_AMOUNT) {
                    errors.push(`Row ${index + 1}: Amount too large (max: ${CONFIG.CURRENCY_SYMBOL}${CONFIG.MAX_AMOUNT.toLocaleString(CONFIG.CURRENCY_LOCALE)})`);
                    return;
                }
                
                validItems.push({
                    ticker: sanitizedTicker,
                    amount: amount
                });
            });

            if (validItems.length === 0) {
                const errorMsg = errors.length > 0 
                    ? 'No valid holdings found:\\n\\n' + errors.slice(0, 5).join('\\n') + (errors.length > 5 ? `\\n...and ${errors.length - 5} more` : '')
                    : 'No valid holdings found';
                throw new Error(errorMsg);
            }

            // Show warnings if some items were skipped
            if (errors.length > 0) {
                const proceed = confirm(
                    `${errors.length} invalid entries found:\\n\\n` +
                    errors.slice(0, 3).join('\\n') +
                    (errors.length > 3 ? `\\n...and ${errors.length - 3} more` : '') +
                    `\\n\\nImport ${validItems.length} valid holdings?`
                );
                if (!proceed) return;
            }

            // Confirm before replacing
            if (this.holdings.length > 0 && validItems.length === imported.length) {
                if (!confirm('This will replace your current portfolio. Continue?')) {
                    return;
                }
            }

            // Assign unique IDs to imported items
            this.holdings = validItems.map(item => ({
                id: this.nextId++,
                ticker: item.ticker,
                amount: item.amount
            }));

            this.saveToLocalStorage();
            this.closeImportModal();
            this.updateUI();
            this.showNotification(`Imported ${this.holdings.length} holdings successfully`, 'success');
        } catch (e) {
            this.showNotification(`Import failed: ${e.message}`, 'error');
        }
    }

    clearAll() {
        if (this.holdings.length === 0) {
            this.showNotification('Portfolio is already empty', 'error');
            return;
        }

        if (confirm('Are you sure you want to clear all holdings? This cannot be undone.')) {
            this.holdings = [];
            this.saveToLocalStorage();
            this.updateUI();
            this.cancelEdit();
            this.showNotification('Portfolio cleared', 'success');
        }
    }

    // Notifications
    showNotification(message, type = 'info') {
        // Limit number of active notifications
        if (this.activeNotifications >= CONFIG.MAX_NOTIFICATIONS) {
            return;
        }

        this.activeNotifications++;

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        // Use textContent for security
        const messageSpan = document.createElement('span');
        messageSpan.textContent = message;
        notification.appendChild(messageSpan);

        document.body.appendChild(notification);

        // Remove after duration
        setTimeout(() => {
            notification.classList.add('notification-exit');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
                this.activeNotifications--;
            }, 300);
        }, CONFIG.NOTIFICATION_DURATION);
    }
}

// Add notification styles
const style = document.createElement('style');
style.textContent = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        color: white;
        border-radius: 0.5rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 9999;
        font-weight: 500;
        max-width: 300px;
        animation: slideIn 0.3s ease;
        font-family: var(--font-sans);
    }
    
    .notification-success {
        background: var(--primary, #10b981);
    }
    
    .notification-error {
        background: var(--danger, #ef4444);
    }
    
    .notification-info {
        background: var(--secondary, #3b82f6);
    }
    
    .notification-exit {
        animation: slideOut 0.3s ease;
    }
    
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize app
const portfolioManager = new PortfolioManager();

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Escape key to close modal or cancel edit
    if (e.key === 'Escape') {
        const modal = document.getElementById('import-modal');
        if (modal.classList.contains('show')) {
            portfolioManager.closeImportModal();
        } else if (portfolioManager.editingIndex !== null) {
            portfolioManager.cancelEdit();
        }
    }
});

console.log('📊 Stock Portfolio Split initialized');
