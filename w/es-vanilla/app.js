// Expense Splitter - Vanilla JavaScript
console.log('🚀 Expense Splitter - Vanilla Version Started');

// Global State
let currentTrip = null;
let members = [];
let expenses = [];

// DOM Elements
const elements = {
    // Screens
    welcomeScreen: document.getElementById('welcome-screen'),
    currentTripDiv: document.getElementById('current-trip'),
    membersSection: document.getElementById('members-section'),
    expensesSection: document.getElementById('expenses-section'),
    
    // Trip Display
    tripName: document.getElementById('trip-name'),
    tripDates: document.getElementById('trip-dates'),
    totalExpenses: document.getElementById('total-expenses'),
    memberCount: document.getElementById('member-count'),
    expenseCount: document.getElementById('expense-count'),
    
    // Buttons
    newTripBtn: document.getElementById('new-trip-btn'),
    createFirstTripBtn: document.getElementById('create-first-trip-btn'),
    editTripBtn: document.getElementById('edit-trip-btn'),
    addMemberBtn: document.getElementById('add-member-btn'),
    addExpenseBtn: document.getElementById('add-expense-btn'),
    viewBalancesBtn: document.getElementById('view-balances-btn'),
    
    // Modals
    tripModal: document.getElementById('trip-modal'),
    memberModal: document.getElementById('member-modal'),
    
    // Forms
    tripForm: document.getElementById('trip-form'),
    memberForm: document.getElementById('member-form'),
    
    // Lists
    membersList: document.getElementById('members-list'),
    expensesList: document.getElementById('expenses-list')
};

// Initialize App
function init() {
    console.log('📱 Initializing Expense Splitter App');
    
    // Load data from localStorage
    loadData();
    
    // Set up event listeners
    setupEventListeners();
    
    // Update display
    updateDisplay();
    
    // Calculate and display balances if we have data
    if (expenses.length > 0) {
        calculateAndDisplayBalances();
    }
    
    console.log('✅ App initialized successfully');
}

// Event Listeners
function setupEventListeners() {
    console.log('🔧 Setting up event listeners');
    
    // Trip creation buttons
    elements.newTripBtn.addEventListener('click', () => openTripModal());
    elements.createFirstTripBtn.addEventListener('click', () => openTripModal());
    elements.editTripBtn.addEventListener('click', () => openTripModal(true));
    
    // Export/Import functionality
    document.getElementById('export-data-btn').addEventListener('click', exportData);
    document.getElementById('import-data-btn').addEventListener('click', () => {
        document.getElementById('import-file-input').click();
    });
    document.getElementById('import-file-input').addEventListener('change', importData);
    
    // Member management
    elements.addMemberBtn.addEventListener('click', () => openMemberModal());
    
    // Expense management
    document.getElementById('add-expense-btn').addEventListener('click', () => openExpenseModal());
    
    // Form submissions
    elements.tripForm.addEventListener('submit', handleTripSubmit);
    elements.memberForm.addEventListener('submit', handleMemberSubmit);
    document.getElementById('expense-form').addEventListener('submit', handleExpenseSubmit);
    
    // Split type change handler
    document.querySelectorAll('input[name="split-type"]').forEach(radio => {
        radio.addEventListener('change', function() {
            updateSplitOptions(this.value);
        });
    });
    
    // Modal close buttons
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', closeModals);
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModals();
        }
    });
    
    // Cancel buttons
    document.getElementById('cancel-trip').addEventListener('click', closeModals);
    document.getElementById('cancel-member').addEventListener('click', closeModals);
    document.getElementById('cancel-expense').addEventListener('click', closeModals);
    
    console.log('✅ Event listeners set up');
}

// Trip Modal Functions
function openTripModal(isEdit = false) {
    console.log(`📝 Opening trip modal (Edit: ${isEdit})`);
    
    const modal = elements.tripModal;
    const title = document.getElementById('modal-title');
    const form = elements.tripForm;
    
    if (isEdit && currentTrip) {
        title.textContent = 'Edit Trip';
        document.getElementById('trip-name-input').value = currentTrip.name;
        document.getElementById('start-date').value = currentTrip.startDate;
        document.getElementById('end-date').value = currentTrip.endDate;
        document.getElementById('currency').value = currentTrip.currency;
        document.getElementById('description').value = currentTrip.description || '';
        form.dataset.mode = 'edit';
    } else {
        title.textContent = 'Create Trip';
        form.reset();
        form.dataset.mode = 'create';
    }
    
    modal.style.display = 'block';
    console.log('✅ Trip modal opened');
}

function handleTripSubmit(e) {
    e.preventDefault();
    console.log('💾 Handling trip form submission');
    
    const formData = new FormData(elements.tripForm);
    const tripData = {
        id: currentTrip?.id || Date.now(),
        name: document.getElementById('trip-name-input').value,
        startDate: document.getElementById('start-date').value,
        endDate: document.getElementById('end-date').value,
        currency: document.getElementById('currency').value,
        description: document.getElementById('description').value,
        createdAt: currentTrip?.createdAt || new Date().toISOString()
    };
    
    // Validation
    if (!tripData.name) {
        showMessage('Please enter a trip name', 'error');
        return;
    }
    
    if (tripData.startDate && tripData.endDate && new Date(tripData.startDate) > new Date(tripData.endDate)) {
        showMessage('End date must be after start date', 'error');
        return;
    }
    
    const isEdit = elements.tripForm.dataset.mode === 'edit';
    
    if (isEdit) {
        console.log('📝 Updating existing trip:', tripData);
        currentTrip = { ...currentTrip, ...tripData };
        showMessage('Trip updated successfully!', 'success');
    } else {
        console.log('🆕 Creating new trip:', tripData);
        currentTrip = tripData;
        members = [];
        expenses = [];
        showMessage('Trip created successfully!', 'success');
    }
    
    saveData();
    updateDisplay();
    closeModals();
}

// Member Modal Functions
function openMemberModal() {
    console.log('👥 Opening member modal');
    
    if (!currentTrip) {
        showMessage('Please create a trip first', 'error');
        return;
    }
    
    elements.memberModal.style.display = 'block';
    elements.memberForm.reset();
}

function handleMemberSubmit(e) {
    e.preventDefault();
    console.log('👤 Handling member form submission');
    
    const memberData = {
        id: Date.now(),
        name: document.getElementById('member-name').value,
        balance: 0,
        addedAt: new Date().toISOString()
    };
    
    if (!memberData.name) {
        showMessage('Member name is required', 'error');
        return;
    }
    
    // Check for duplicate names
    if (members.find(m => m.name.toLowerCase() === memberData.name.toLowerCase())) {
        showMessage('Member with this name already exists', 'error');
        return;
    }
    
    console.log('✅ Adding new member:', memberData);
    members.push(memberData);
    
    saveData();
    updateDisplay();
    closeModals();
    showMessage(`${memberData.name} added successfully!`, 'success');
}

// Display Functions
function updateDisplay() {
    console.log('🔄 Updating display');
    
    if (currentTrip) {
        showTripView();
    } else {
        showWelcomeView();
    }
}

function showWelcomeView() {
    console.log('🏠 Showing welcome view');
    elements.welcomeScreen.style.display = 'block';
    elements.currentTripDiv.style.display = 'none';
    elements.membersSection.style.display = 'none';
    elements.expensesSection.style.display = 'none';
}

function showTripView() {
    console.log('🗺️ Showing trip view for:', currentTrip.name);
    
    elements.welcomeScreen.style.display = 'none';
    elements.currentTripDiv.style.display = 'block';
    
    // Update trip info
    elements.tripName.textContent = currentTrip.name;
    
    // Handle optional dates
    let dateText = '';
    if (currentTrip.startDate && currentTrip.endDate) {
        dateText = `${formatDate(currentTrip.startDate)} - ${formatDate(currentTrip.endDate)}`;
    } else if (currentTrip.startDate) {
        dateText = `From ${formatDate(currentTrip.startDate)}`;
    } else if (currentTrip.endDate) {
        dateText = `Until ${formatDate(currentTrip.endDate)}`;
    } else {
        dateText = 'No dates set';
    }
    elements.tripDates.textContent = dateText;
    
    // Update stats
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    elements.totalExpenses.textContent = formatCurrency(totalExpenses, currentTrip.currency);
    elements.memberCount.textContent = members.length;
    elements.expenseCount.textContent = expenses.length;
    
    // Show/hide sections based on data
    if (members.length > 0) {
        elements.membersSection.style.display = 'block';
        renderMembers();
    } else {
        elements.membersSection.style.display = 'none';
    }
    
    if (expenses.length > 0) {
        elements.expensesSection.style.display = 'block';
        renderExpenses();
        
        // Show live sections
        document.getElementById('balance-overview').style.display = 'block';
        document.getElementById('settlements-section').style.display = 'block';
        document.getElementById('chart-section').style.display = 'block';
    } else {
        elements.expensesSection.style.display = 'none';
        
        // Hide live sections
        document.getElementById('balance-overview').style.display = 'none';
        document.getElementById('settlements-section').style.display = 'none';
        document.getElementById('chart-section').style.display = 'none';
    }
}

function renderMembers() {
    console.log('👥 Rendering members list');
    
    elements.membersList.innerHTML = '';
    
    members.forEach(member => {
        const memberCard = document.createElement('div');
        memberCard.className = 'member-card';
        memberCard.innerHTML = `
            <div class="member-info">
                <h4>${member.name}</h4>
                <p>Added ${new Date(member.addedAt).toLocaleDateString()}</p>
            </div>
            <button class="btn btn-secondary" onclick="deleteMember(${member.id})">Remove</button>
        `;
        elements.membersList.appendChild(memberCard);
    });
}

function renderExpenses() {
    console.log('💰 Rendering expenses list');
    
    elements.expensesList.innerHTML = '';
    
    expenses.forEach(expense => {
        const expenseItem = document.createElement('div');
        expenseItem.className = 'expense-item';
        expenseItem.innerHTML = `
            <div class="expense-info">
                <h4>${expense.description}</h4>
                <p>Paid by ${expense.paidBy} • ${formatDate(expense.date)}${expense.time ? ` at ${expense.time}` : ''}</p>
            </div>
            <div class="expense-amount">${formatCurrency(expense.amount, currentTrip.currency)}</div>
        `;
        elements.expensesList.appendChild(expenseItem);
    });
}

// Utility Functions
function formatCurrency(amount, currency = 'INR') {
    const symbols = {
        'INR': '₹',
        'USD': '$',
        'EUR': '€',
        'GBP': '£'
    };
    
    return `${symbols[currency] || '₹'}${amount.toFixed(2)}`;
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function deleteMember(memberId) {
    console.log('🗑️ Deleting member:', memberId);
    
    const memberIndex = members.findIndex(m => m.id === memberId);
    if (memberIndex > -1) {
        const memberName = members[memberIndex].name;
        members.splice(memberIndex, 1);
        saveData();
        updateDisplay();
        showMessage(`${memberName} removed successfully!`, 'success');
    }
}

function showMessage(text, type = 'success') {
    console.log(`💬 Showing ${type} message: ${text}`);
    
    // Remove existing messages
    document.querySelectorAll('.message').forEach(msg => msg.remove());
    
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    
    document.querySelector('.container').insertBefore(message, document.querySelector('.container').firstChild);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        message.remove();
    }, 3000);
}

function closeModals() {
    console.log('❌ Closing all modals');
    elements.tripModal.style.display = 'none';
    elements.memberModal.style.display = 'none';
    document.getElementById('expense-modal').style.display = 'none';
}

// Data Persistence
function saveData() {
    const data = {
        currentTrip,
        members,
        expenses,
        lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem('expenseSplitter', JSON.stringify(data));
    console.log('💾 Data saved to localStorage');
}

function loadData() {
    console.log('📂 Loading data from localStorage');
    
    const saved = localStorage.getItem('expenseSplitter');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            currentTrip = data.currentTrip;
            members = data.members || [];
            expenses = data.expenses || [];
            console.log('✅ Data loaded successfully:', data);
        } catch (error) {
            console.error('❌ Error loading data:', error);
            showMessage('Error loading saved data', 'error');
        }
    } else {
        console.log('📝 No saved data found, starting fresh');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// ========================
// EXPENSE FUNCTIONALITY
// ========================

// Expense Modal Functions
function openExpenseModal() {
    console.log('📝 Opening expense modal');
    
    if (members.length === 0) {
        showMessage('Please add members first before creating expenses!', 'error');
        return;
    }
    
    populateMemberCheckboxes();
    document.getElementById('expense-modal').style.display = 'block';
}

function populateMemberCheckboxes() {
    const container = document.getElementById('member-checkboxes');
    const paidBySelect = document.getElementById('expense-paid-by');
    
    // Clear existing options
    container.innerHTML = '';
    paidBySelect.innerHTML = '<option value="">Who paid?</option>';
    
    members.forEach(member => {
        // Add to checkboxes
        const label = document.createElement('label');
        label.innerHTML = `
            <input type="checkbox" name="members" value="${member.name}" checked>
            ${member.name}
        `;
        container.appendChild(label);
        
        // Add to paid-by select
        const option = document.createElement('option');
        option.value = member.name;
        option.textContent = member.name;
        paidBySelect.appendChild(option);
    });
}

function updateSplitOptions(splitType) {
    const customSplit = document.getElementById('custom-split');
    
    if (splitType === 'custom') {
        customSplit.style.display = 'block';
    } else {
        customSplit.style.display = 'none';
    }
}

function handleExpenseSubmit(e) {
    e.preventDefault();
    console.log('💰 Handling expense submission');
    
    const formData = new FormData(e.target);
    const description = document.getElementById('expense-description').value.trim();
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const paidBy = document.getElementById('expense-paid-by').value;
    const splitType = document.querySelector('input[name="split-type"]:checked').value;
    
    // Validation
    if (!description || !amount || amount <= 0 || !paidBy) {
        showMessage('Please fill in all required fields with valid values!', 'error');
        return;
    }
    
    // Get involved members
    let involvedMembers;
    if (splitType === 'equal') {
        involvedMembers = members.map(m => m.name);
    } else if (splitType === 'custom') {
        const checkedBoxes = document.querySelectorAll('#member-checkboxes input[type="checkbox"]:checked');
        involvedMembers = Array.from(checkedBoxes).map(cb => cb.value);
        
        if (involvedMembers.length === 0) {
            showMessage('Please select at least one member for the expense!', 'error');
            return;
        }
    }
    
    // Create expense
    const expense = {
        id: Date.now(),
        description,
        amount,
        paidBy,
        splitType,
        involvedMembers,
        date: document.getElementById('expense-date').value || new Date().toISOString().split('T')[0],
        time: document.getElementById('expense-time').value || '',
        createdAt: new Date().toISOString(),
        splitAmount: amount / involvedMembers.length
    };
    
    expenses.push(expense);
    console.log('✅ Expense added:', expense);
    
    // Reset form and close modal
    e.target.reset();
    closeModals();
    
    // Save data and update display
    saveData();
    updateDisplay();
    calculateAndDisplayBalances();
    
    showMessage(`Expense "${description}" added successfully!`, 'success');
}

// Balance Calculation Functions
function calculateAndDisplayBalances() {
    console.log('🧮 Calculating balances');
    
    // Initialize member balances
    const balances = {};
    members.forEach(member => {
        balances[member.name] = 0;
    });
    
    // Calculate balances from expenses
    expenses.forEach(expense => {
        const { paidBy, amount, involvedMembers, splitAmount } = expense;
        
        // Person who paid gets credited
        balances[paidBy] += amount;
        
        // All involved members get debited their share
        involvedMembers.forEach(member => {
            balances[member] -= splitAmount;
        });
    });
    
    displayBalances(balances);
    calculateSettlements(balances);
    updateExpenseChart();
}

function displayBalances(balances) {
    const container = document.getElementById('balance-overview');
    const balanceGrid = document.getElementById('balance-cards');
    
    if (!balanceGrid) {
        console.error('Balance grid element not found');
        return;
    }
    
    balanceGrid.innerHTML = '';
    
    Object.entries(balances).forEach(([member, balance]) => {
        const balanceCard = document.createElement('div');
        balanceCard.className = `balance-card ${balance >= 0 ? 'positive' : 'negative'}`;
        
        balanceCard.innerHTML = `
            <div class="balance-name">${member}</div>
            <div class="balance-amount ${balance >= 0 ? 'positive' : 'negative'}">
                ${formatCurrency(Math.abs(balance), currentTrip.currency)}
            </div>
            <div class="balance-status">
                ${balance >= 0 ? 'Gets back' : 'Owes'}
            </div>
        `;
        
        balanceGrid.appendChild(balanceCard);
    });
    
    container.style.display = 'block';
}

function calculateSettlements(balances) {
    console.log('💸 Calculating settlements');
    
    // Separate creditors and debtors
    const creditors = [];
    const debtors = [];
    
    Object.entries(balances).forEach(([member, balance]) => {
        if (balance > 0.01) { // Small threshold for floating point precision
            creditors.push({ name: member, amount: balance });
        } else if (balance < -0.01) {
            debtors.push({ name: member, amount: Math.abs(balance) });
        }
    });
    
    // Sort by amount for better optimization
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);
    
    const settlements = [];
    
    // Calculate minimal settlements
    while (creditors.length > 0 && debtors.length > 0) {
        const creditor = creditors[0];
        const debtor = debtors[0];
        
        const settleAmount = Math.min(creditor.amount, debtor.amount);
        
        settlements.push({
            from: debtor.name,
            to: creditor.name,
            amount: settleAmount
        });
        
        creditor.amount -= settleAmount;
        debtor.amount -= settleAmount;
        
        if (creditor.amount < 0.01) creditors.shift();
        if (debtor.amount < 0.01) debtors.shift();
    }
    
    displaySettlements(settlements);
}

function displaySettlements(settlements) {
    const container = document.getElementById('settlements-section');
    const settlementsList = document.getElementById('settlements-list');
    
    if (!settlementsList) {
        console.error('Settlements list element not found');
        return;
    }
    
    settlementsList.innerHTML = '';
    
    if (settlements.length === 0) {
        settlementsList.innerHTML = '<p style="text-align: center; color: #28a745; font-weight: bold;">🎉 All settled up!</p>';
        container.style.display = 'block';
        return;
    }
    
    settlements.forEach(settlement => {
        const settlementItem = document.createElement('div');
        settlementItem.className = 'settlement-item';
        
        settlementItem.innerHTML = `
            <div class="settlement-text">
                <strong>${settlement.from}</strong> owes <strong>${settlement.to}</strong>
                <span class="settlement-amount">${formatCurrency(settlement.amount, currentTrip.currency)}</span>
            </div>
        `;
        
        settlementsList.appendChild(settlementItem);
    });
    
    container.style.display = 'block';
}

// Chart Functions
let expenseChart = null;

function updateExpenseChart() {
    const canvas = document.getElementById('expense-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart
    if (expenseChart) {
        expenseChart.destroy();
    }
    
    if (expenses.length === 0) {
        // Show empty state
        document.getElementById('chart-section').style.display = 'none';
        return;
    }
    
    // Calculate expense totals by member
    const memberTotals = {};
    members.forEach(member => {
        memberTotals[member.name] = 0;
    });
    
    expenses.forEach(expense => {
        memberTotals[expense.paidBy] += expense.amount;
    });
    
    const labels = Object.keys(memberTotals);
    const data = Object.values(memberTotals);
    const colors = [
        '#667eea', '#764ba2', '#f093fb', '#f5576c', 
        '#4facfe', '#00f2fe', '#43e97b', '#38f9d7'
    ];
    
    expenseChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                label: 'Expenses Paid',
                data: data,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = formatCurrency(context.parsed, currentTrip.currency);
                            return `${label}: ${value}`;
                        }
                    }
                }
            }
        }
    });
    
    document.getElementById('chart-section').style.display = 'block';
}

function displayExpenses() {
    console.log('📋 Displaying expenses');
    updateExpenseChart();
}

// Enhanced showMessage function
function showMessage(text, type = 'success') {
    // Remove existing messages
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    
    const container = document.querySelector('.container');
    container.insertBefore(message, container.firstChild);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (message.parentNode) {
            message.remove();
        }
    }, 5000);
    
    console.log(`📢 Message: ${text} (${type})`);
}

// Export/Import Functionality
function exportData() {
    console.log('📤 Exporting data');
    
    const exportData = {
        currentTrip,
        members,
        expenses,
        exportedAt: new Date().toISOString(),
        version: '1.0'
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `expense-splitter-${currentTrip?.name || 'data'}-${new Date().toISOString().split('T')[0]}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showMessage('Data exported successfully!', 'success');
}

function importData(event) {
    console.log('📥 Importing data');
    
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // Validate data structure
            if (!importedData.currentTrip && !importedData.members && !importedData.expenses) {
                throw new Error('Invalid data format');
            }
            
            // Confirm import
            if (confirm('This will replace all current data. Are you sure?')) {
                currentTrip = importedData.currentTrip || null;
                members = importedData.members || [];
                expenses = importedData.expenses || [];
                
                saveData();
                updateDisplay();
                
                if (expenses.length > 0) {
                    calculateAndDisplayBalances();
                }
                
                showMessage('Data imported successfully!', 'success');
            }
        } catch (error) {
            console.error('Import error:', error);
            showMessage('Error importing data. Please check the file format.', 'error');
        }
    };
    
    reader.readAsText(file);
    // Reset file input
    event.target.value = '';
}
