// Expense Splitter - Vanilla JavaScript
console.log('🚀 Expense Splitter - Vanilla Version Started');

// Global State
let currentTrip = null;
let members = [];
let expenses = [];
let currentExpenseSort = 'date-desc'; // Default sort
let currentMemberSort = 'name-asc'; // Default sort for members

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
    expenseModal: document.getElementById('expense-modal'),
    
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
    
    // Ensure all modals are closed on startup
    closeModals();
    
    // Load data from localStorage
    loadData();
    
    // Set up event listeners
    setupEventListeners();
    
    // Update display
    updateDisplay();
    
    // Calculate and display balances if we have data
    if (expenses.length > 0) {
        calculateAndDisplayBalances();
        setupChartControls(); // Initialize chart controls
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
    
    // Expense amount change handler (for updating totals in shares and custom)
    document.getElementById('expense-amount').addEventListener('input', function() {
        const splitType = document.querySelector('input[name="split-type"]:checked')?.value;
        if (splitType === 'shares') {
            updateSharesTotal();
        } else if (splitType === 'custom') {
            updateCustomTotal();
        }
    });
    
    // Expense sorting
    const expenseSortSelect = document.getElementById('expense-sort');
    if (expenseSortSelect) {
        expenseSortSelect.addEventListener('change', function() {
            currentExpenseSort = this.value;
            renderExpenses();
            saveData(); // Save preference
        });
    }
    
    // Member sorting
    const memberSortSelect = document.getElementById('member-sort');
    if (memberSortSelect) {
        memberSortSelect.addEventListener('change', function() {
            currentMemberSort = this.value;
            renderMembers();
            saveData(); // Save preference
        });
    }
    
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
    
    modal.classList.add('show');
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
    
    elements.memberModal.classList.add('show');
    elements.memberForm.reset();
    
    // Debug: Confirm modal is shown
    console.log('Member modal opened, visible:', elements.memberModal.classList.contains('show'));
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
        
        // Set the member sort dropdown value
        const memberSortSelect = document.getElementById('member-sort');
        if (memberSortSelect) {
            memberSortSelect.value = currentMemberSort;
        }
        
        renderMembers();
    } else {
        elements.membersSection.style.display = 'none';
    }
    
    if (expenses.length > 0) {
        elements.expensesSection.style.display = 'block';
        
        // Set the sort dropdown value
        const expenseSortSelect = document.getElementById('expense-sort');
        if (expenseSortSelect) {
            expenseSortSelect.value = currentExpenseSort;
        }
        
        renderExpenses();
        
        // Calculate and display balances/settlements
        calculateAndDisplayBalances();
        
        // Show consolidated settlement section
        const settlementOverview = document.getElementById('settlement-overview');
        const chartSection = document.getElementById('chart-section');
        
        if (settlementOverview) {
            settlementOverview.style.display = 'block';
        }
        if (chartSection) {
            chartSection.style.display = 'block';
        }
    } else {
        elements.expensesSection.style.display = 'none';
        
        // Hide settlement and chart sections
        const settlementOverview = document.getElementById('settlement-overview');
        const chartSection = document.getElementById('chart-section');
        
        if (settlementOverview) {
            settlementOverview.style.display = 'none';
        }
        if (chartSection) {
            chartSection.style.display = 'none';
        }
    }
}

function getSortedMembers() {
    const membersCopy = [...members];
    
    switch (currentMemberSort) {
        case 'name-asc':
            return membersCopy.sort((a, b) => a.name.localeCompare(b.name)); // A-Z
            
        case 'name-desc':
            return membersCopy.sort((a, b) => b.name.localeCompare(a.name)); // Z-A
            
        case 'date-desc':
            return membersCopy.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt)); // Recently added
            
        case 'date-asc':
            return membersCopy.sort((a, b) => new Date(a.addedAt) - new Date(b.addedAt)); // First added
            
        default:
            return membersCopy; // No sorting
    }
}

function renderMembers() {
    console.log('👥 Rendering members list with sort:', currentMemberSort);
    
    elements.membersList.innerHTML = '';
    
    // Sort members based on current sort option
    const sortedMembers = getSortedMembers();
    
    // Update count badge
    const countBadge = document.getElementById('member-count-badge');
    if (countBadge) {
        countBadge.textContent = sortedMembers.length;
    }
    
    sortedMembers.forEach(member => {
        const memberCard = document.createElement('div');
        memberCard.className = 'member-card';
        
        // Check if member is involved in any expense
        const isInvolvedInExpenses = expenses.some(expense => 
            expense.paidBy === member.name || expense.involvedMembers.includes(member.name)
        );
        
        memberCard.innerHTML = `
            <div class="member-info">
                <h4>${member.name}</h4>
                <p>Added ${new Date(member.addedAt).toLocaleDateString()}</p>
            </div>
            <div class="member-actions">
                <button class="btn btn-secondary btn-small" onclick="editMember(${member.id})">✏️ Edit</button>
                <button class="btn btn-danger btn-small" onclick="deleteMember(${member.id})" 
                    ${isInvolvedInExpenses ? 'disabled title="Cannot delete: Member is involved in expenses"' : ''}>
                    🗑️ Delete
                </button>
            </div>
        `;
        elements.membersList.appendChild(memberCard);
    });
}

function getSortedExpenses() {
    const expensesCopy = [...expenses];
    
    switch (currentExpenseSort) {
        case 'date-desc':
            return expensesCopy.sort((a, b) => {
                const dateA = new Date(a.date + (a.time ? ` ${a.time}` : ''));
                const dateB = new Date(b.date + (b.time ? ` ${b.time}` : ''));
                return dateB - dateA; // Latest first
            });
            
        case 'date-asc':
            return expensesCopy.sort((a, b) => {
                const dateA = new Date(a.date + (a.time ? ` ${a.time}` : ''));
                const dateB = new Date(b.date + (b.time ? ` ${b.time}` : ''));
                return dateA - dateB; // Oldest first
            });
            
        case 'amount-desc':
            return expensesCopy.sort((a, b) => b.amount - a.amount); // Highest first
            
        case 'amount-asc':
            return expensesCopy.sort((a, b) => a.amount - b.amount); // Lowest first
            
        case 'paidby-asc':
            return expensesCopy.sort((a, b) => a.paidBy.localeCompare(b.paidBy)); // A-Z
            
        case 'paidby-desc':
            return expensesCopy.sort((a, b) => b.paidBy.localeCompare(a.paidBy)); // Z-A
            
        case 'name-asc':
            return expensesCopy.sort((a, b) => a.description.localeCompare(b.description)); // A-Z
            
        case 'name-desc':
            return expensesCopy.sort((a, b) => b.description.localeCompare(a.description)); // Z-A
            
        default:
            return expensesCopy; // No sorting
    }
}

function renderExpenses() {
    console.log('💰 Rendering expenses list with sort:', currentExpenseSort);
    
    elements.expensesList.innerHTML = '';
    
    // Sort expenses based on current sort option
    const sortedExpenses = getSortedExpenses();
    
    // Update count badge
    const countBadge = document.getElementById('expense-count-badge');
    if (countBadge) {
        countBadge.textContent = sortedExpenses.length;
    }
    
    sortedExpenses.forEach(expense => {
        const expenseItem = document.createElement('div');
        expenseItem.className = 'expense-item';
        
        // Generate split info based on split type
        let splitInfo = '';
        switch (expense.splitType) {
            case 'equal':
                const equalAmounts = Object.entries(expense.splitData).map(([memberName, amount]) => {
                    return `${memberName}: ${formatCurrency(amount, currentTrip.currency)}`;
                }).join(', ');
                splitInfo = `Split equally: ${equalAmounts}`;
                break;
            case 'select-equal':
                const selectEqualAmounts = Object.entries(expense.splitData).map(([memberName, amount]) => {
                    return `${memberName}: ${formatCurrency(amount, currentTrip.currency)}`;
                }).join(', ');
                splitInfo = `Split equally among selected: ${selectEqualAmounts}`;
                break;
            case 'percentage':
                const percentages = Object.entries(expense.splitData).map(([memberName, amount]) => {
                    const percentage = ((amount / expense.amount) * 100).toFixed(1);
                    return `${memberName}: ${formatCurrency(amount, currentTrip.currency)} (${percentage}%)`;
                }).join(', ');
                splitInfo = `${percentages}`;
                break;
            case 'shares':
                const shares = Object.entries(expense.splitData).map(([memberName, amount]) => {
                    return `${memberName}: ${formatCurrency(amount, currentTrip.currency)}`;
                }).join(', ');
                splitInfo = `${shares}`;
                break;
            case 'custom':
                const amounts = Object.entries(expense.splitData).map(([memberName, amount]) => {
                    return `${memberName}: ${formatCurrency(amount, currentTrip.currency)}`;
                }).join(', ');
                splitInfo = `${amounts}`;
                break;
            default:
                splitInfo = `Split among: ${expense.involvedMembers.join(', ')}`;
        }
        
        expenseItem.innerHTML = `
            <div class="expense-info">
                <h4>${expense.description}</h4>
                <p>Paid by ${expense.paidBy} • ${formatDate(expense.date)}${expense.time ? ` at ${expense.time}` : ''}</p>
                <p class="expense-split-info">${splitInfo}</p>
            </div>
            <div class="expense-right">
                <div class="expense-amount">${formatCurrency(expense.amount, currentTrip.currency)}</div>
                <div class="expense-actions">
                    <button class="btn btn-secondary btn-small" onclick="editExpense(${expense.id})">✏️ Edit</button>
                    <button class="btn btn-danger btn-small" onclick="deleteExpense(${expense.id})">🗑️ Delete</button>
                </div>
            </div>
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
    
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    
    // Check if member is involved in any expense
    const isInvolvedInExpenses = expenses.some(expense => 
        expense.paidBy === member.name || expense.involvedMembers.includes(member.name)
    );
    
    if (isInvolvedInExpenses) {
        showMessage('Cannot delete member: They are involved in existing expenses. Delete related expenses first.', 'error');
        return;
    }
    
    if (confirm(`Are you sure you want to delete ${member.name}?`)) {
        const memberIndex = members.findIndex(m => m.id === memberId);
        if (memberIndex > -1) {
            members.splice(memberIndex, 1);
            saveData();
            updateDisplay();
            showMessage(`${member.name} removed successfully!`, 'success');
        }
    }
}

function editMember(memberId) {
    console.log('✏️ Editing member:', memberId);
    
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    
    const newName = prompt('Enter new name:', member.name);
    if (newName && newName.trim() !== '' && newName !== member.name) {
        // Check for duplicate names
        if (members.find(m => m.name.toLowerCase() === newName.toLowerCase() && m.id !== memberId)) {
            showMessage('Member with this name already exists', 'error');
            return;
        }
        
        const oldName = member.name;
        member.name = newName.trim();
        
        // Update expenses that reference this member
        expenses.forEach(expense => {
            if (expense.paidBy === oldName) {
                expense.paidBy = member.name;
            }
            if (expense.involvedMembers.includes(oldName)) {
                const index = expense.involvedMembers.indexOf(oldName);
                expense.involvedMembers[index] = member.name;
            }
        });
        
        saveData();
        updateDisplay();
        calculateAndDisplayBalances();
        showMessage(`Member updated from ${oldName} to ${member.name}!`, 'success');
    }
}

function deleteExpense(expenseId) {
    console.log('🗑️ Deleting expense:', expenseId);
    
    const expense = expenses.find(e => e.id === expenseId);
    if (!expense) return;
    
    if (confirm(`Are you sure you want to delete the expense "${expense.description}"?`)) {
        const expenseIndex = expenses.findIndex(e => e.id === expenseId);
        if (expenseIndex > -1) {
            expenses.splice(expenseIndex, 1);
            saveData();
            updateDisplay();
            calculateAndDisplayBalances();
            showMessage(`Expense "${expense.description}" deleted successfully!`, 'success');
        }
    }
}

function editExpense(expenseId) {
    console.log('✏️ Editing expense:', expenseId);
    
    const expense = expenses.find(e => e.id === expenseId);
    if (!expense) return;
    
    // Pre-fill the expense form with existing data
    openExpenseModal();
    
    // Set the form to edit mode
    const form = document.getElementById('expense-form');
    form.dataset.mode = 'edit';
    form.dataset.expenseId = expenseId;
    
    // Fill the form with existing values
    document.getElementById('expense-description').value = expense.description;
    document.getElementById('expense-amount').value = expense.amount;
    document.getElementById('expense-paid-by').value = expense.paidBy;
    document.getElementById('expense-date').value = expense.date;
    document.getElementById('expense-time').value = expense.time || '';
    
    // Set split type and update options
    const splitTypeRadio = document.querySelector(`input[name="split-type"][value="${expense.splitType}"]`);
    if (splitTypeRadio) {
        splitTypeRadio.checked = true;
        updateSplitOptions(expense.splitType);
        
        // Pre-fill split data based on type
        setTimeout(() => {
            switch (expense.splitType) {
                case 'select-equal':
                    expense.involvedMembers.forEach(memberName => {
                        const checkbox = document.querySelector(`[name="selected-members"][value="${memberName}"]`);
                        if (checkbox) checkbox.checked = true;
                    });
                    break;
                    
                case 'percentage':
                    Object.entries(expense.splitData).forEach(([memberName, amount]) => {
                        const percentage = (amount / expense.amount * 100).toFixed(1);
                        const input = document.querySelector(`[name="percentage-${memberName}"]`);
                        if (input) input.value = percentage;
                    });
                    updatePercentageTotal();
                    break;
                    
                case 'shares':
                    // Calculate shares from amounts (reverse engineering)
                    const totalAmount = Object.values(expense.splitData).reduce((sum, amt) => sum + amt, 0);
                    const baseShare = Math.min(...Object.values(expense.splitData));
                    Object.entries(expense.splitData).forEach(([memberName, amount]) => {
                        const shares = Math.round(amount / baseShare);
                        const input = document.querySelector(`[name="shares-${memberName}"]`);
                        if (input) input.value = shares;
                    });
                    updateSharesTotal();
                    break;
                    
                case 'custom':
                    Object.entries(expense.splitData).forEach(([memberName, amount]) => {
                        const input = document.querySelector(`[name="custom-${memberName}"]`);
                        if (input) input.value = amount.toFixed(2);
                    });
                    updateCustomTotal();
                    break;
            }
        }, 100);
    }
    
    // Change modal title and button text
    elements.expenseModal.querySelector('h3').textContent = 'Edit Expense';
    document.getElementById('save-expense').textContent = 'Update Expense';
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
    elements.tripModal.classList.remove('show');
    elements.memberModal.classList.remove('show');
    elements.expenseModal.classList.remove('show');
    
    // Debug: Log modal states
    console.log('Modal states after close:', {
        trip: elements.tripModal.classList.contains('show'),
        member: elements.memberModal.classList.contains('show'),
        expense: elements.expenseModal.classList.contains('show')
    });
}

// Data Persistence
function saveData() {
    const data = {
        currentTrip,
        members,
        expenses,
        preferences: {
            expenseSort: currentExpenseSort,
            memberSort: currentMemberSort
        },
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
            
            // Load preferences
            if (data.preferences) {
                currentExpenseSort = data.preferences.expenseSort || 'date-desc';
                currentMemberSort = data.preferences.memberSort || 'name-asc';
            }
            
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
    
    // Reset modal to add mode
    const form = document.getElementById('expense-form');
    form.reset();
    delete form.dataset.mode;
    delete form.dataset.expenseId;
    
    // Reset modal title and button text
    elements.expenseModal.querySelector('h3').textContent = 'Add Expense';
    document.getElementById('save-expense').textContent = 'Add Expense';
    
    // Populate the paid-by dropdown
    populateMemberCheckboxes();
    
    // Initialize split options (default to equal)
    updateSplitOptions('equal');
    
    elements.expenseModal.classList.add('show');
}

function populateMemberCheckboxes() {
    const paidBySelect = document.getElementById('expense-paid-by');
    
    // Clear existing options
    paidBySelect.innerHTML = '<option value="">Who paid?</option>';
    
    members.forEach(member => {
        // Add to paid-by select
        const option = document.createElement('option');
        option.value = member.name;
        option.textContent = member.name;
        paidBySelect.appendChild(option);
    });
}

function updateSplitOptions(splitType) {
    const splitConfig = document.getElementById('split-config');
    const sections = [
        'select-members-section',
        'percentage-split-section', 
        'shares-split-section',
        'custom-split-section'
    ];
    
    // Hide all sections first
    sections.forEach(id => {
        document.getElementById(id).style.display = 'none';
    });
    
    if (splitType === 'equal') {
        splitConfig.style.display = 'none';
    } else {
        splitConfig.style.display = 'block';
        
        switch (splitType) {
            case 'select-equal':
                document.getElementById('select-members-section').style.display = 'block';
                populateSelectMemberCheckboxes();
                break;
            case 'percentage':
                document.getElementById('percentage-split-section').style.display = 'block';
                populatePercentageInputs();
                break;
            case 'shares':
                document.getElementById('shares-split-section').style.display = 'block';
                populateSharesInputs();
                break;
            case 'custom':
                document.getElementById('custom-split-section').style.display = 'block';
                populateCustomInputs();
                break;
        }
    }
}

function populateSelectMemberCheckboxes() {
    const container = document.getElementById('select-member-checkboxes');
    container.innerHTML = '';
    
    members.forEach(member => {
        const label = document.createElement('label');
        label.innerHTML = `
            <input type="checkbox" name="selected-members" value="${member.name}" checked>
            <span>${member.name}</span>
        `;
        container.appendChild(label);
    });
}

function populatePercentageInputs() {
    const container = document.getElementById('percentage-inputs');
    container.innerHTML = '';
    
    members.forEach(member => {
        const div = document.createElement('div');
        div.className = 'split-input-item';
        div.innerHTML = `
            <label>${member.name}</label>
            <input type="number" 
                   name="percentage-${member.name}" 
                   placeholder="0" 
                   min="0" 
                   max="100" 
                   step="0.1"
                   oninput="updatePercentageTotal()">
        `;
        container.appendChild(div);
    });
    
    updatePercentageTotal();
}

function populateSharesInputs() {
    const container = document.getElementById('shares-inputs');
    container.innerHTML = '';
    
    members.forEach(member => {
        const div = document.createElement('div');
        div.className = 'split-input-item';
        div.innerHTML = `
            <label>${member.name}</label>
            <input type="number" 
                   name="shares-${member.name}" 
                   placeholder="0" 
                   min="0" 
                   step="1"
                   oninput="updateSharesTotal()">
        `;
        container.appendChild(div);
    });
    
    updateSharesTotal();
}

function populateCustomInputs() {
    const container = document.getElementById('custom-inputs');
    container.innerHTML = '';
    
    members.forEach(member => {
        const div = document.createElement('div');
        div.className = 'split-input-item';
        div.innerHTML = `
            <label>${member.name}</label>
            <input type="number" 
                   name="custom-${member.name}" 
                   placeholder="0.00" 
                   min="0" 
                   step="0.01"
                   oninput="updateCustomTotal()">
        `;
        container.appendChild(div);
    });
    
    updateCustomTotal();
}

function updatePercentageTotal() {
    const inputs = document.querySelectorAll('[name^="percentage-"]');
    let total = 0;
    
    inputs.forEach(input => {
        const value = parseFloat(input.value) || 0;
        total += value;
        
        // Update input styling
        if (value > 0 && value <= 100) {
            input.classList.remove('invalid');
            input.classList.add('valid');
        } else if (value > 100) {
            input.classList.add('invalid');
            input.classList.remove('valid');
        } else {
            input.classList.remove('valid', 'invalid');
        }
    });
    
    const totalSpan = document.getElementById('percentage-total');
    const statusSpan = document.getElementById('percentage-status');
    
    totalSpan.textContent = `${total.toFixed(1)}%`;
    
    if (total === 100) {
        statusSpan.textContent = '✓ Perfect!';
        statusSpan.className = 'tally-status valid';
        totalSpan.style.color = 'var(--accent-green)';
    } else if (total > 100) {
        statusSpan.textContent = `⚠ Over by ${(total - 100).toFixed(1)}%`;
        statusSpan.className = 'tally-status invalid';
        totalSpan.style.color = 'var(--accent-red)';
    } else if (total > 0) {
        statusSpan.textContent = `⚠ Under by ${(100 - total).toFixed(1)}%`;
        statusSpan.className = 'tally-status warning';
        totalSpan.style.color = 'var(--accent-yellow)';
    } else {
        statusSpan.textContent = '';
        statusSpan.className = 'tally-status';
        totalSpan.style.color = 'var(--text-primary)';
    }
}

function updateSharesTotal() {
    const inputs = document.querySelectorAll('[name^="shares-"]');
    let total = 0;
    const expenseAmount = parseFloat(document.getElementById('expense-amount').value) || 0;
    
    inputs.forEach(input => {
        const value = parseInt(input.value) || 0;
        total += value;
        
        // Update input styling
        if (value > 0) {
            input.classList.remove('invalid');
            input.classList.add('valid');
        } else {
            input.classList.remove('valid', 'invalid');
        }
    });
    
    document.getElementById('shares-total').textContent = total;
    
    // Update breakdown
    const breakdown = document.getElementById('shares-breakdown');
    if (total > 0 && expenseAmount > 0) {
        breakdown.style.display = 'block';
        let breakdownHTML = '<h4>Share Breakdown:</h4>';
        
        inputs.forEach(input => {
            const shares = parseInt(input.value) || 0;
            if (shares > 0) {
                const memberName = input.name.replace('shares-', '');
                const percentage = (shares / total * 100).toFixed(1);
                const amount = (expenseAmount * shares / total).toFixed(2);
                breakdownHTML += `
                    <div class="share-breakdown-item">
                        <span>${memberName} (${shares} shares)</span>
                        <span>${percentage}% = ${formatCurrency(parseFloat(amount), currentTrip?.currency || 'INR')}</span>
                    </div>
                `;
            }
        });
        
        breakdown.innerHTML = breakdownHTML;
    } else {
        breakdown.style.display = 'none';
    }
}

function updateCustomTotal() {
    const inputs = document.querySelectorAll('[name^="custom-"]');
    const expenseAmount = parseFloat(document.getElementById('expense-amount').value) || 0;
    let total = 0;
    
    inputs.forEach(input => {
        const value = parseFloat(input.value) || 0;
        total += value;
        
        // Update input styling
        if (value > 0) {
            input.classList.remove('invalid');
            input.classList.add('valid');
        } else {
            input.classList.remove('valid', 'invalid');
        }
    });
    
    const totalSpan = document.getElementById('custom-total');
    const statusSpan = document.getElementById('custom-status');
    
    totalSpan.textContent = formatCurrency(total, currentTrip?.currency || 'INR');
    
    if (expenseAmount > 0) {
        const diff = total - expenseAmount;
        if (Math.abs(diff) < 0.01) {
            statusSpan.textContent = '✓ Perfect!';
            statusSpan.className = 'tally-status valid';
            totalSpan.style.color = 'var(--accent-green)';
        } else if (diff > 0) {
            statusSpan.textContent = `⚠ Over by ${formatCurrency(diff, currentTrip?.currency || 'INR')}`;
            statusSpan.className = 'tally-status invalid';
            totalSpan.style.color = 'var(--accent-red)';
        } else {
            statusSpan.textContent = `⚠ Under by ${formatCurrency(Math.abs(diff), currentTrip?.currency || 'INR')}`;
            statusSpan.className = 'tally-status warning';
            totalSpan.style.color = 'var(--accent-yellow)';
        }
    } else {
        statusSpan.textContent = '';
        statusSpan.className = 'tally-status';
        totalSpan.style.color = 'var(--text-primary)';
    }
}

function handleExpenseSubmit(e) {
    e.preventDefault();
    console.log('💰 Handling expense submission');
    
    const form = e.target;
    const isEdit = form.dataset.mode === 'edit';
    const expenseId = isEdit ? parseInt(form.dataset.expenseId) : Date.now();
    
    const description = document.getElementById('expense-description').value.trim();
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const paidBy = document.getElementById('expense-paid-by').value;
    const splitType = document.querySelector('input[name="split-type"]:checked').value;
    
    // Validation
    if (!description || !amount || amount <= 0 || !paidBy) {
        showMessage('Please fill in all required fields with valid values!', 'error');
        return;
    }
    
    // Get involved members and their splits
    let splitData = {};
    let involvedMembers = [];
    
    switch (splitType) {
        case 'equal':
            involvedMembers = members.map(m => m.name);
            const equalAmount = amount / involvedMembers.length;
            involvedMembers.forEach(name => {
                splitData[name] = equalAmount;
            });
            break;
            
        case 'select-equal':
            const selectedBoxes = document.querySelectorAll('[name="selected-members"]:checked');
            involvedMembers = Array.from(selectedBoxes).map(cb => cb.value);
            if (involvedMembers.length === 0) {
                showMessage('Please select at least one member!', 'error');
                return;
            }
            const selectEqualAmount = amount / involvedMembers.length;
            involvedMembers.forEach(name => {
                splitData[name] = selectEqualAmount;
            });
            break;
            
        case 'percentage':
            const percentageInputs = document.querySelectorAll('[name^="percentage-"]');
            let totalPercentage = 0;
            
            percentageInputs.forEach(input => {
                const percentage = parseFloat(input.value) || 0;
                if (percentage > 0) {
                    const memberName = input.name.replace('percentage-', '');
                    involvedMembers.push(memberName);
                    splitData[memberName] = (amount * percentage / 100);
                }
                totalPercentage += percentage;
            });
            
            if (Math.abs(totalPercentage - 100) > 0.1) {
                showMessage(`Percentages must total 100%. Current total: ${totalPercentage.toFixed(1)}%`, 'error');
                return;
            }
            
            if (involvedMembers.length === 0) {
                showMessage('Please enter percentages for at least one member!', 'error');
                return;
            }
            break;
            
        case 'shares':
            const sharesInputs = document.querySelectorAll('[name^="shares-"]');
            let totalShares = 0;
            
            sharesInputs.forEach(input => {
                const shares = parseInt(input.value) || 0;
                if (shares > 0) {
                    const memberName = input.name.replace('shares-', '');
                    involvedMembers.push(memberName);
                    totalShares += shares;
                }
            });
            
            if (totalShares === 0) {
                showMessage('Please enter shares for at least one member!', 'error');
                return;
            }
            
            // Calculate amounts based on shares
            sharesInputs.forEach(input => {
                const shares = parseInt(input.value) || 0;
                if (shares > 0) {
                    const memberName = input.name.replace('shares-', '');
                    splitData[memberName] = (amount * shares / totalShares);
                }
            });
            break;
            
        case 'custom':
            const customInputs = document.querySelectorAll('[name^="custom-"]');
            let totalCustom = 0;
            
            customInputs.forEach(input => {
                const customAmount = parseFloat(input.value) || 0;
                if (customAmount > 0) {
                    const memberName = input.name.replace('custom-', '');
                    involvedMembers.push(memberName);
                    splitData[memberName] = customAmount;
                }
                totalCustom += customAmount;
            });
            
            if (Math.abs(totalCustom - amount) > 0.01) {
                showMessage(`Custom amounts must total ${formatCurrency(amount, currentTrip.currency)}. Current total: ${formatCurrency(totalCustom, currentTrip.currency)}`, 'error');
                return;
            }
            
            if (involvedMembers.length === 0) {
                showMessage('Please enter amounts for at least one member!', 'error');
                return;
            }
            break;
            
        default:
            showMessage('Invalid split type selected!', 'error');
            return;
    }
    
    // Create or update expense
    const expenseData = {
        id: expenseId,
        description,
        amount,
        paidBy,
        splitType,
        involvedMembers,
        splitData, // Store individual amounts for each member
        date: document.getElementById('expense-date').value || new Date().toISOString().split('T')[0],
        time: document.getElementById('expense-time').value || ''
    };
    
    if (isEdit) {
        // Update existing expense
        const expenseIndex = expenses.findIndex(e => e.id === expenseId);
        if (expenseIndex > -1) {
            expenseData.createdAt = expenses[expenseIndex].createdAt; // Preserve original creation time
            expenses[expenseIndex] = expenseData;
            console.log('✅ Expense updated:', expenseData);
            showMessage(`Expense "${description}" updated successfully!`, 'success');
        }
    } else {
        // Add new expense
        expenseData.createdAt = new Date().toISOString();
        expenses.push(expenseData);
        console.log('✅ Expense added:', expenseData);
        showMessage(`Expense "${description}" added successfully!`, 'success');
    }
    
    // Reset form and close modal
    e.target.reset();
    delete form.dataset.mode;
    delete form.dataset.expenseId;
    closeModals();
    
    // Save data and update display
    saveData();
    updateDisplay();
    calculateAndDisplayBalances();
    
    // Debug: Log current state
    console.log('💾 Current expenses in memory:', expenses);
    console.log('💾 Current localStorage:', localStorage.getItem('expenseSplitter'));
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
        const { paidBy, amount, splitData } = expense;
        
        // Person who paid gets credited
        balances[paidBy] += amount;
        
        // All involved members get debited their individual share
        Object.entries(splitData).forEach(([memberName, memberAmount]) => {
            balances[memberName] -= memberAmount;
        });
    });
    
    displayConsolidatedSettlement(balances);
    updateExpenseChart();
}

function displayConsolidatedSettlement(balances) {
    console.log('💸 Displaying consolidated settlement');
    
    // Calculate settlements
    const settlements = calculateOptimalSettlements(balances);
    
    // Display settlements list
    const settlementsList = document.getElementById('settlements-list');
    if (!settlementsList) {
        console.error('Settlements list element not found');
        return;
    }
    
    settlementsList.innerHTML = '';
    
    if (settlements.length === 0) {
        settlementsList.innerHTML = '<p style="text-align: center; color: #28a745; font-weight: bold; padding: 20px;">🎉 All settled up!</p>';
    } else {
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
    }
    
    // Balance summary removed for cleaner UI
    // displayBalanceSummary(balances);
    
    const settlementOverview = document.getElementById('settlement-overview');
    if (settlementOverview) {
        settlementOverview.style.display = 'block';
    }
}

function displayBalanceSummary(balances) {
    const balanceSummary = document.getElementById('balance-summary');
    if (!balanceSummary) return;
    
    let summaryHTML = '<h4>💰 Balance Summary</h4>';
    
    Object.entries(balances).forEach(([member, balance]) => {
        const balanceClass = balance > 0.01 ? 'positive' : balance < -0.01 ? 'negative' : 'zero';
        const balanceText = balance > 0.01 ? 'gets back' : balance < -0.01 ? 'owes' : 'settled';
        
        summaryHTML += `
            <div class="balance-item">
                <span class="balance-name">${member}</span>
                <span class="balance-amount ${balanceClass}">
                    ${balanceClass === 'zero' ? 'Settled' : formatCurrency(Math.abs(balance), currentTrip.currency)}
                </span>
            </div>
        `;
    });
    
    balanceSummary.innerHTML = summaryHTML;
}

function calculateOptimalSettlements(balances) {
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
    
    return settlements;
}

// Chart Functions
let expenseChart = null;
let currentChartType = 'paid'; // 'paid' or 'incurred'

function updateExpenseChart() {
    console.log('📊 Updating expense chart, current type:', currentChartType);
    const canvas = document.getElementById('expense-chart');
    if (!canvas) {
        console.error('❌ Canvas element not found');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart
    if (expenseChart) {
        expenseChart.destroy();
    }
    
    if (expenses.length === 0) {
        // Show empty state
        const chartSection = document.getElementById('chart-section');
        if (chartSection) {
            chartSection.style.display = 'none';
        }
        return;
    }
    
    // Setup chart controls if not already done
    setupChartControls();
    
    // Calculate data based on current chart type
    const chartData = currentChartType === 'paid' ? getExpensesPaidData() : getExpensesIncurredData();
    
    const labels = Object.keys(chartData);
    const data = Object.values(chartData);
    const colors = [
        '#667eea', '#764ba2', '#f093fb', '#f5576c', 
        '#4facfe', '#00f2fe', '#43e97b', '#38f9d7'
    ];
    
    expenseChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: currentChartType === 'paid' ? 'Expenses Paid' : 'Expenses Incurred',
                data: data,
                backgroundColor: colors.slice(0, labels.length).map(color => color + '80'), // Add transparency
                borderColor: colors.slice(0, labels.length),
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y', // Horizontal bars
            plugins: {
                legend: {
                    display: false, // Hide legend for cleaner look
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = formatCurrency(context.parsed.x, currentTrip.currency);
                            return `${value}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#8b949e',
                        callback: function(value) {
                            return formatCurrency(value, currentTrip.currency);
                        }
                    }
                },
                y: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#f0f6fc',
                        font: {
                            weight: 'bold'
                        }
                    }
                }
            },
            layout: {
                padding: {
                    left: 10,
                    right: 10,
                    top: 10,
                    bottom: 10
                }
            }
        }
    });
    
    updateChartSummary(chartData);
    
    const chartSection = document.getElementById('chart-section');
    if (chartSection) {
        chartSection.style.display = 'block';
    }
}

function getExpensesPaidData() {
    const memberTotals = {};
    members.forEach(member => {
        memberTotals[member.name] = 0;
    });
    
    expenses.forEach(expense => {
        memberTotals[expense.paidBy] += expense.amount;
    });
    
    return memberTotals;
}

function getExpensesIncurredData() {
    const memberTotals = {};
    members.forEach(member => {
        memberTotals[member.name] = 0;
    });
    
    expenses.forEach(expense => {
        Object.entries(expense.splitData).forEach(([memberName, memberAmount]) => {
            memberTotals[memberName] += memberAmount;
        });
    });
    
    return memberTotals;
}

function setupChartControls() {
    console.log('🔧 Setting up chart controls');
    const paidBtn = document.getElementById('chart-paid-btn');
    const incurredBtn = document.getElementById('chart-incurred-btn');
    
    if (!paidBtn || !incurredBtn) {
        console.error('❌ Chart control buttons not found:', { paidBtn: !!paidBtn, incurredBtn: !!incurredBtn });
        return;
    }
    
    // Remove existing listeners
    paidBtn.removeEventListener('click', switchToPaidChart);
    incurredBtn.removeEventListener('click', switchToIncurredChart);
    
    // Add event listeners
    paidBtn.addEventListener('click', switchToPaidChart);
    incurredBtn.addEventListener('click', switchToIncurredChart);
}

function switchToPaidChart() {
    currentChartType = 'paid';
    updateChartButtons();
    updateExpenseChart();
}

function switchToIncurredChart() {
    currentChartType = 'incurred';
    updateChartButtons();
    updateExpenseChart();
}

function updateChartButtons() {
    const paidBtn = document.getElementById('chart-paid-btn');
    const incurredBtn = document.getElementById('chart-incurred-btn');
    
    if (!paidBtn || !incurredBtn) return;
    
    paidBtn.classList.toggle('active', currentChartType === 'paid');
    incurredBtn.classList.toggle('active', currentChartType === 'incurred');
}

function updateChartSummary(chartData) {
    const summaryDiv = document.getElementById('chart-summary');
    if (!summaryDiv) return;
    
    const total = Object.values(chartData).reduce((sum, amount) => sum + amount, 0);
    const chartTypeLabel = currentChartType === 'paid' ? 'paid for expenses' : 'incurred in expenses';
    
    summaryDiv.innerHTML = `
        Showing how much each person ${chartTypeLabel}. 
        Total: ${formatCurrency(total, currentTrip.currency)}
    `;
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
