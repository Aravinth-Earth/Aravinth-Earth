// Stock Portfolio Split - App Logic

class PortfolioManager {
    constructor() {
        this.holdings = [];
        this.chart = null;
        this.editingIndex = null;
        this.forceChartType = null; // 'pie', 'bar', or null for auto
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

        // Close modal on outside click
        document.getElementById('import-modal').addEventListener('click', (e) => {
            if (e.target.id === 'import-modal') {
                this.closeImportModal();
            }
        });
    }

    handleFormSubmit() {
        const ticker = document.getElementById('ticker').value.trim().toUpperCase();
        const amount = parseFloat(document.getElementById('amount').value);

        if (!ticker || isNaN(amount) || amount <= 0) {
            this.showNotification('Please enter valid ticker and amount', 'error');
            return;
        }

        if (this.editingIndex !== null) {
            // Update existing holding
            this.holdings[this.editingIndex] = { ticker, amount };
            this.editingIndex = null;
            document.getElementById('add-btn').innerHTML = '➕ Add Holding';
            document.getElementById('cancel-edit-btn').style.display = 'none';
            this.showNotification('Holding updated successfully', 'success');
        } else {
            // Check for duplicate ticker
            const existingIndex = this.holdings.findIndex(h => h.ticker === ticker);
            if (existingIndex !== -1) {
                // Update existing instead of creating duplicate
                this.holdings[existingIndex].amount += amount;
                this.showNotification(`Added to existing ${ticker} holding`, 'success');
            } else {
                // Add new holding
                this.holdings.push({ ticker, amount });
                this.showNotification('Holding added successfully', 'success');
            }
        }

        this.saveToLocalStorage();
        this.resetForm();
        this.updateUI();
    }

    editHolding(index) {
        this.editingIndex = index;
        const holding = this.holdings[index];
        
        document.getElementById('ticker').value = holding.ticker;
        document.getElementById('amount').value = holding.amount;
        document.getElementById('add-btn').innerHTML = '💾 Update Holding';
        document.getElementById('cancel-edit-btn').style.display = 'inline-flex';
        
        // Scroll to form
        document.querySelector('.form-card').scrollIntoView({ behavior: 'smooth' });
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

    deleteHolding(index) {
        const holding = this.holdings[index];
        if (confirm(`Are you sure you want to delete ${holding.ticker}?`)) {
            this.holdings.splice(index, 1);
            this.saveToLocalStorage();
            this.updateUI();
            this.showNotification('Holding deleted', 'success');
            
            if (this.editingIndex === index) {
                this.cancelEdit();
            }
        }
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

        tbody.innerHTML = sortedHoldings.map((holding, sortedIndex) => {
            const originalIndex = this.holdings.findIndex(h => h.ticker === holding.ticker && h.amount === holding.amount);
            const percentage = total > 0 ? (holding.amount / total * 100).toFixed(2) : 0;
            
            return `
                <tr>
                    <td class="ticker">${holding.ticker}</td>
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
                            <button class="btn-icon btn-edit" onclick="portfolioManager.editHolding(${originalIndex})" title="Edit">
                                ✏️
                            </button>
                            <button class="btn-icon btn-delete" onclick="portfolioManager.deleteHolding(${originalIndex})" title="Delete">
                                🗑️
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
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
                                return `${label}: ₹${value.toLocaleString('en-IN')} (${percentage}%)`;
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
                            const amount = '₹' + value.toLocaleString('en-IN', { maximumFractionDigits: 0 });
                            
                            // Show labels only if >3% to avoid clutter
                            if (parseFloat(percentage) < 3) return '';
                            
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
            usePieChart = sortedHoldings.length <= 20;
        }
        
        // Adjust canvas height for bar charts with many items
        const wrapper = canvas.parentElement;
        if (!usePieChart && sortedHoldings.length > 20) {
            wrapper.style.height = Math.min(sortedHoldings.length * 25 + 100, 800) + 'px';
        } else {
            wrapper.style.height = '';
        }
        
        if (this.chart.config.type !== (usePieChart ? 'pie' : 'bar')) {
            this.chart.destroy();
            this.initChart();
            // Change chart type
            this.chart.config.type = usePieChart ? 'pie' : 'bar';
            
            if (!usePieChart) {
                // Configure for horizontal bar chart
                this.chart.options.indexAxis = 'y';
                this.chart.options.plugins.legend.display = false;
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
            } else {
                // Reset to pie chart config
                delete this.chart.options.indexAxis;
                delete this.chart.options.scales;
                this.chart.options.plugins.datalabels = {
                    color: '#f1f5f9',
                    font: { size: 11, weight: 500, family: "'Inter', sans-serif" },
                    formatter: (value, ctx) => {
                        const total = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                        const label = ctx.chart.data.labels[ctx.dataIndex];
                        const amount = '₹' + value.toLocaleString('en-IN', { maximumFractionDigits: 0 });
                        if (parseFloat(percentage) < 3) return '';
                        return `${label}\n${percentage}%\n${amount}`;
                    },
                    align: 'end',
                    anchor: 'end',
                    offset: 8,
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    borderRadius: 4,
                    padding: 6
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
        return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
    }

    // Local Storage
    saveToLocalStorage() {
        localStorage.setItem('portfolio-holdings', JSON.stringify(this.holdings));
    }

    loadFromLocalStorage() {
        const saved = localStorage.getItem('portfolio-holdings');
        if (saved) {
            try {
                this.holdings = JSON.parse(saved);
            } catch (e) {
                console.error('Failed to load holdings:', e);
                this.holdings = [];
            }
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

            // Validate and clean structure
            const validItems = imported.filter(item => {
                if (!item.ticker || typeof item.ticker !== 'string') return false;
                const amt = parseFloat(item.amount);
                if (isNaN(amt) || amt <= 0) return false;
                return true;
            });

            if (validItems.length === 0) {
                throw new Error('No valid holdings found. Each item must have ticker (string) and amount (positive number)');
            }

            if (validItems.length < imported.length) {
                const skipped = imported.length - validItems.length;
                if (!confirm(`${skipped} invalid entries will be skipped. Import ${validItems.length} valid holdings?`)) {
                    return;
                }
            }

            // Confirm before replacing
            if (this.holdings.length > 0 && validItems.length === imported.length) {
                if (!confirm('This will replace your current portfolio. Continue?')) {
                    return;
                }
            }

            this.holdings = validItems.map(item => ({
                ticker: item.ticker.toUpperCase(),
                amount: parseFloat(item.amount)
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
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Add styles
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '1rem 1.5rem',
            background: type === 'success' ? '#10b981' : '#ef4444',
            color: 'white',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            zIndex: '9999',
            fontWeight: '500',
            animation: 'slideIn 0.3s ease',
            maxWidth: '300px'
        });

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Add animations
const style = document.createElement('style');
style.textContent = `
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
