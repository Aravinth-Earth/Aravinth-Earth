// Expense Splitter
let currentTrip = null, members = [], expenses = [];
let currentExpenseSort = 'date-desc', currentMemberSort = 'name-asc';
let chartPaid = null, chartIncurred = null;

const $ = id => document.getElementById(id);
const qs = (sel, ctx) => (ctx || document).querySelector(sel);
const qsa = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

function formatCurrency(amount, currency = 'INR') {
  const symbols = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
  if (currency === 'INR') return '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${symbols[currency] || '$'}${amount.toFixed(2)}`;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getAvatarColor(name) {
  const colors = ['#a855f7','#3b82f6','#10b981','#ef4444','#f59e0b','#06b6d4','#ec4899','#8b5cf6'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// ======= TOAST =======
function showMessage(text, type = 'success') {
  const container = $('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = text;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastOut .2s ease';
    setTimeout(() => toast.remove(), 200);
  }, 3000);
}

// ======= DATA =======
function saveData() {
  localStorage.setItem('expenseSplitter', JSON.stringify({
    currentTrip, members, expenses,
    preferences: { expenseSort: currentExpenseSort },
    firstCachedAt: getCacheMeta().firstCachedAt || new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  }));
}

function getCacheMeta() {
  const raw = localStorage.getItem('expenseSplitter');
  if (!raw) return null;
  try { return JSON.parse(raw) } catch(e) { return null }
}

function loadData() {
  const data = getCacheMeta();
  if (!data) return;
  currentTrip = data.currentTrip;
  members = data.members || [];
  expenses = data.expenses || [];
  if (data.preferences) currentExpenseSort = data.preferences.expenseSort || 'date-desc';
}

function clearCache() {
  if (!confirm('Clear all cached data from this browser?')) return;
  localStorage.removeItem('expenseSplitter');
  currentTrip = null; members = []; expenses = [];
  updateDisplay();
  showMessage('Cache cleared', 'success');
}

function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function promptCache() {
  const meta = getCacheMeta();
  if (!meta) { updateDisplay(); if (expenses.length) calcSettlements(); return }
  const modal = $('cache-modal');
  const info = $('cache-info');
  const tripName = meta.currentTrip?.name || 'Untitled Trip';
  const created = meta.currentTrip?.createdAt || meta.firstCachedAt;
  info.textContent = '';
  const rows = [
    ['Trip', tripName],
    ['Members', (meta.members || []).length],
    ['Expenses', (meta.expenses || []).length],
    ['Trip created', formatDateTime(meta.currentTrip?.createdAt)],
    ['Last updated', formatDateTime(meta.lastUpdated)]
  ];
  rows.forEach(([label, value]) => {
    const row = info.appendChild(document.createElement('div'));
    row.className = 'cache-info-row';
    const l = row.appendChild(document.createElement('span'));
    l.className = 'label'; l.textContent = label;
    const v = row.appendChild(document.createElement('span'));
    v.className = 'value'; v.textContent = value;
  });
  modal.style.display = 'flex';

  $('cache-load-btn').onclick = () => {
    loadData();
    modal.style.display = 'none';
    updateDisplay();
    if (expenses.length) calcSettlements();
  };

  $('cache-fresh-btn').onclick = () => {
    localStorage.removeItem('expenseSplitter');
    currentTrip = null; members = []; expenses = [];
    modal.style.display = 'none';
    updateDisplay();
    showMessage('Starting fresh', 'success');
  };

  $('cache-import-btn').onclick = () => {
    modal.style.display = 'none';
    $('import-file-input').click();
  };
}

// ======= MODALS =======
function closeModals() { qsa('.modal').forEach(m => m.style.display = 'none') }

function openTripModal(isEdit = false) {
  $('modal-title').textContent = isEdit ? 'Edit Trip' : 'Create Trip';
  $('save-trip').textContent = isEdit ? 'Update Trip' : 'Save Trip';
  const form = $('trip-form');
  if (isEdit && currentTrip) {
    $('trip-name-input').value = currentTrip.name;
    $('start-date').value = currentTrip.startDate || '';
    $('end-date').value = currentTrip.endDate || '';
    $('currency').value = currentTrip.currency;
    $('description').value = currentTrip.description || '';
    form.dataset.mode = 'edit';
  } else { form.reset(); delete form.dataset.mode }
  $('trip-modal').style.display = 'flex';
}

function openMemberModal(editMemberData = null) {
  if (!currentTrip && !editMemberData) { showMessage('Create a trip first', 'error'); return }
  const form = $('member-form');
  form.reset();
  if (editMemberData) {
    $('member-name').value = editMemberData.name;
    form.dataset.mode = 'edit';
    form.dataset.memberId = editMemberData.id;
    qs('#member-modal h3').textContent = 'Edit Member';
    $('save-member').textContent = 'Update';
  } else {
    delete form.dataset.mode;
    delete form.dataset.memberId;
    qs('#member-modal h3').textContent = 'Add Member';
    $('save-member').textContent = 'Add Member';
  }
  $('member-modal').style.display = 'flex';
}

function openExpenseModal() {
  if (members.length === 0) { showMessage('Add members first', 'error'); return }
  const form = $('expense-form');
  form.reset(); delete form.dataset.mode; delete form.dataset.expenseId;
  qs('#expense-modal h3').textContent = 'Add Expense';
  $('save-expense').textContent = 'Add Expense';
  populatePaidBy();
  updateSplitOptions('equal');
  $('expense-modal').style.display = 'flex';
}

// ======= TRIP =======
function handleTripSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const tripData = {
    id: currentTrip?.id || Date.now(),
    name: $('trip-name-input').value.trim(),
    startDate: $('start-date').value,
    endDate: $('end-date').value,
    currency: $('currency').value,
    description: $('description').value,
    createdAt: currentTrip?.createdAt || new Date().toISOString()
  };
  if (!tripData.name) { showMessage('Enter a trip name', 'error'); return }
  if (tripData.startDate && tripData.endDate && new Date(tripData.startDate) > new Date(tripData.endDate)) {
    showMessage('End must be after start', 'error'); return;
  }
  if (form.dataset.mode === 'edit') { currentTrip = { ...currentTrip, ...tripData }; showMessage('Trip updated', 'success') }
  else { currentTrip = tripData; members = []; expenses = []; showMessage('Trip created!', 'success') }
  saveData(); updateDisplay(); closeModals();
}

// ======= MEMBERS =======
function handleMemberSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const name = $('member-name').value.trim();
  if (!name) { showMessage('Enter a name', 'error'); return }
  const isEdit = form.dataset.mode === 'edit';
  const memberId = parseInt(form.dataset.memberId);
  if (members.find(m => m.name.toLowerCase() === name.toLowerCase() && m.id !== memberId)) { showMessage('Name already exists', 'error'); return }

  if (isEdit) {
    const m = members.find(x => x.id === memberId);
    if (!m) return;
    const old = m.name;
    m.name = name;
    expenses.forEach(e => {
      if (e.paidBy === old) e.paidBy = m.name;
      const idx = e.involvedMembers.indexOf(old);
      if (idx > -1) e.involvedMembers[idx] = m.name;
      if (e.splitData[old]) { e.splitData[m.name] = e.splitData[old]; delete e.splitData[old] }
    });
    saveData(); updateDisplay(); calcSettlements(); closeModals(); showMessage(`${name} updated`, 'success');
  } else {
    members.push({ id: Date.now(), name, balance: 0, addedAt: new Date().toISOString() });
    saveData(); updateDisplay(); closeModals(); showMessage(`${name} added`, 'success');
  }
}

function deleteMember(id) {
  const m = members.find(x => x.id === id);
  if (!m) return;
  if (expenses.some(e => e.paidBy === m.name || e.involvedMembers.includes(m.name))) {
    showMessage('Member is in expenses. Delete those first.', 'error'); return;
  }
  members = members.filter(x => x.id !== id);
  saveData(); updateDisplay();
}

function editMember(id) {
  const m = members.find(x => x.id === id);
  if (!m) return;
  openMemberModal(m);
}

// ======= RENDER MEMBERS (simple list, no balance) =======
function renderMembers() {
  const list = $('members-list');
  list.innerHTML = '';
  members.forEach(m => {
    const card = document.createElement('div'); card.className = 'member-card';

    const avatar = card.appendChild(document.createElement('div'));
    avatar.className = 'member-avatar';
    avatar.style.background = getAvatarColor(m.name);
    avatar.textContent = getInitials(m.name);

    const info = card.appendChild(document.createElement('div'));
    info.className = 'member-info';
    const nameDiv = info.appendChild(document.createElement('div'));
    nameDiv.className = 'member-name';
    nameDiv.textContent = m.name;

    const actions = card.appendChild(document.createElement('div'));
    actions.className = 'member-actions';
    const editBtn = actions.appendChild(document.createElement('button'));
    editBtn.className = 'btn btn-secondary btn-sm';
    editBtn.textContent = '✏️';
    editBtn.addEventListener('click', () => editMember(m.id));
    const delBtn = actions.appendChild(document.createElement('button'));
    delBtn.className = 'btn btn-danger btn-sm';
    delBtn.textContent = '🗑️';
    delBtn.addEventListener('click', () => deleteMember(m.id));

    list.appendChild(card);
  });
}

// ======= EXPENSES =======
function populatePaidBy() {
  const sel = $('expense-paid-by');
  sel.innerHTML = '<option value="">Who paid?</option>';
  members.forEach(m => { const o = document.createElement('option'); o.value = m.name; o.textContent = m.name; sel.appendChild(o) });
}

function updateSplitOptions(splitType) {
  const cfg = $('split-config');
  ['select-members-section','percentage-split-section','shares-split-section','custom-split-section'].forEach(id => $(id).style.display = 'none');
  qsa('.split-option').forEach(el => el.classList.toggle('selected', el.dataset.split === splitType));
  if (splitType === 'equal') { cfg.style.display = 'none'; return }
  cfg.style.display = 'block';
  if (splitType === 'select-equal') { $('select-members-section').style.display = 'block'; populateSelectMembers() }
  else if (splitType === 'percentage') { $('percentage-split-section').style.display = 'block'; populatePercentages() }
  else if (splitType === 'shares') { $('shares-split-section').style.display = 'block'; populateShares() }
  else if (splitType === 'custom') { $('custom-split-section').style.display = 'block'; populateCustom() }
}

qsa('.split-option').forEach(el => {
  el.addEventListener('click', function() {
    const radio = qs('input[type="radio"]', this);
    if (radio) { radio.checked = true; updateSplitOptions(radio.value) }
  });
});

function populateSelectMembers() {
  const c = $('select-member-checkboxes'); c.innerHTML = '';
  members.forEach(m => {
    const l = document.createElement('label');
    const cb = l.appendChild(document.createElement('input'));
    cb.type = 'checkbox'; cb.name = 'selected-members'; cb.value = m.name; cb.checked = true;
    l.appendChild(document.createElement('span')).textContent = m.name;
    c.appendChild(l);
  });
}

function populatePercentages() {
  const c = $('percentage-inputs'); c.innerHTML = '';
  members.forEach(m => {
    const d = document.createElement('div'); d.className = 'split-input-item';
    const lab = d.appendChild(document.createElement('label'));
    lab.textContent = m.name;
    const inp = d.appendChild(document.createElement('input'));
    inp.type = 'number'; inp.name = `percentage-${m.name}`; inp.placeholder = '0'; inp.min = '0'; inp.max = '100'; inp.step = '0.1';
    c.appendChild(d);
  });
  qsa('#percentage-inputs input').forEach(i => i.addEventListener('input', updatePercentageTotal));
  updatePercentageTotal();
}

function updatePercentageTotal() {
  const inputs = qsa('#percentage-inputs input');
  let total = 0;
  inputs.forEach(i => { const v = parseFloat(i.value) || 0; total += v; i.classList.toggle('valid', v > 0 && v <= 100); i.classList.toggle('invalid', v > 100) });
  $('percentage-total').textContent = total.toFixed(1) + '%';
  $('percentage-total').style.color = total === 100 ? 'var(--green)' : total > 100 ? 'var(--red)' : 'var(--yellow)';
}

function populateShares() {
  const c = $('shares-inputs'); c.innerHTML = '';
  members.forEach(m => {
    const d = document.createElement('div'); d.className = 'split-input-item';
    const lab = d.appendChild(document.createElement('label'));
    lab.textContent = m.name;
    const inp = d.appendChild(document.createElement('input'));
    inp.type = 'number'; inp.name = `shares-${m.name}`; inp.placeholder = '0'; inp.min = '0'; inp.step = '1';
    c.appendChild(d);
  });
  qsa('#shares-inputs input').forEach(i => i.addEventListener('input', updateSharesTotal));
  updateSharesTotal();
}

function updateSharesTotal() {
  const inputs = qsa('#shares-inputs input');
  let total = 0;
  const expenseAmount = parseFloat($('expense-amount').value) || 0;
  inputs.forEach(i => { const v = parseInt(i.value) || 0; total += v; i.classList.toggle('valid', v > 0) });
  $('shares-total').textContent = total + ' shares';
  const bd = $('shares-breakdown');
  if (total > 0 && expenseAmount > 0) {
    bd.style.display = 'block';
    bd.textContent = '';
    inputs.forEach(i => {
      const s = parseInt(i.value) || 0;
      if (s > 0) {
        const n = i.name.replace('shares-','');
        const item = bd.appendChild(document.createElement('div'));
        item.className = 'share-breakdown-item';
        const nm = item.appendChild(document.createElement('span'));
        nm.textContent = `${n} (${s})`;
        const amt = item.appendChild(document.createElement('span'));
        amt.textContent = `${(s/total*100).toFixed(1)}% = ${formatCurrency(expenseAmount*s/total, currentTrip?.currency)}`;
      }
    });
  } else { bd.style.display = 'none' }
}

function populateCustom() {
  const c = $('custom-inputs'); c.innerHTML = '';
  members.forEach(m => {
    const d = document.createElement('div'); d.className = 'split-input-item';
    const lab = d.appendChild(document.createElement('label'));
    lab.textContent = m.name;
    const inp = d.appendChild(document.createElement('input'));
    inp.type = 'number'; inp.name = `custom-${m.name}`; inp.placeholder = '0.00'; inp.min = '0'; inp.step = '0.01';
    c.appendChild(d);
  });
  qsa('#custom-inputs input').forEach(i => i.addEventListener('input', updateCustomTotal));
  updateCustomTotal();
}

function updateCustomTotal() {
  const inputs = qsa('#custom-inputs input');
  let total = 0;
  const expenseAmount = parseFloat($('expense-amount').value) || 0;
  inputs.forEach(i => { const v = parseFloat(i.value) || 0; total += v; i.classList.toggle('valid', v > 0) });
  $('custom-total').textContent = formatCurrency(total, currentTrip?.currency);
  $('custom-total').style.color = Math.abs(total - expenseAmount) < 0.01 ? 'var(--green)' : 'var(--red)';
}

function handleExpenseSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const isEdit = form.dataset.mode === 'edit';
  const expenseId = isEdit ? parseInt(form.dataset.expenseId) : Date.now();
  const description = $('expense-description').value.trim();
  const amount = parseFloat($('expense-amount').value);
  const paidBy = $('expense-paid-by').value;
  const splitType = qs('input[name="split-type"]:checked').value;
  if (!description || !amount || amount <= 0 || !paidBy) { showMessage('Fill all fields', 'error'); return }
  let splitData = {}, involvedMembers = [];
  switch (splitType) {
    case 'equal':
      involvedMembers = members.map(m => m.name);
      involvedMembers.forEach(n => splitData[n] = amount / involvedMembers.length);
      break;
    case 'select-equal': {
      const sel = qsa('[name="selected-members"]:checked').map(cb => cb.value);
      if (!sel.length) { showMessage('Select at least one member', 'error'); return }
      involvedMembers = sel;
      sel.forEach(n => splitData[n] = amount / sel.length);
      break;
    }
    case 'percentage': {
      let totalPct = 0;
      qsa('[name^="percentage-"]').forEach(i => { const pct = parseFloat(i.value) || 0; if (pct > 0) { involvedMembers.push(i.name.replace('percentage-','')); totalPct += pct } });
      if (Math.abs(totalPct - 100) > 0.1) { showMessage('Percentages must total 100%', 'error'); return }
      qsa('[name^="percentage-"]').forEach(i => { const pct = parseFloat(i.value) || 0; if (pct > 0) splitData[i.name.replace('percentage-','')] = amount * pct / 100 });
      break;
    }
    case 'shares': {
      let totalShares = 0;
      qsa('[name^="shares-"]').forEach(i => { const s = parseInt(i.value) || 0; if (s > 0) { involvedMembers.push(i.name.replace('shares-','')); totalShares += s } });
      if (!totalShares) { showMessage('Enter shares for some member', 'error'); return }
      qsa('[name^="shares-"]').forEach(i => { const s = parseInt(i.value) || 0; if (s > 0) splitData[i.name.replace('shares-','')] = amount * s / totalShares });
      break;
    }
    case 'custom': {
      let totalC = 0;
      qsa('[name^="custom-"]').forEach(i => { const a = parseFloat(i.value) || 0; if (a > 0) { involvedMembers.push(i.name.replace('custom-','')); totalC += a } });
      if (Math.abs(totalC - amount) > 0.01) { showMessage('Amounts must total ' + formatCurrency(amount, currentTrip?.currency), 'error'); return }
      qsa('[name^="custom-"]').forEach(i => { const a = parseFloat(i.value) || 0; if (a > 0) splitData[i.name.replace('custom-','')] = a });
      break;
    }
    default: showMessage('Invalid split type', 'error'); return;
  }
  const expenseData = { id: expenseId, description, amount, paidBy, splitType, involvedMembers, splitData, date: $('expense-date').value || new Date().toISOString().split('T')[0], time: $('expense-time').value || '', createdAt: new Date().toISOString() };
  if (isEdit) { const idx = expenses.findIndex(e => e.id === expenseId); if (idx > -1) { expenseData.createdAt = expenses[idx].createdAt; expenses[idx] = expenseData } showMessage('Expense updated', 'success') }
  else { expenses.push(expenseData); showMessage('Expense added', 'success') }
  form.reset(); closeModals(); saveData(); updateDisplay(); calcSettlements();
}

function getSortedExpenses() {
  const copy = [...expenses];
  switch (currentExpenseSort) {
    case 'date-desc': return copy.sort((a,b) => new Date(b.date+' '+b.time) - new Date(a.date+' '+a.time));
    case 'date-asc': return copy.sort((a,b) => new Date(a.date+' '+a.time) - new Date(b.date+' '+b.time));
    case 'amount-desc': return copy.sort((a,b) => b.amount - a.amount);
    case 'amount-asc': return copy.sort((a,b) => a.amount - b.amount);
    case 'paidby-asc': return copy.sort((a,b) => a.paidBy.localeCompare(b.paidBy));
    case 'paidby-desc': return copy.sort((a,b) => b.paidBy.localeCompare(a.paidBy));
    default: return copy;
  }
}

function renderExpenses() {
  const list = $('expenses-list');
  list.innerHTML = '';
  const sorted = getSortedExpenses();
  sorted.forEach(exp => {
    const row = document.createElement('div'); row.className = 'expense-row';

    const main = row.appendChild(document.createElement('div'));
    main.className = 'expense-main';
    const desc = main.appendChild(document.createElement('div'));
    desc.className = 'expense-desc'; desc.textContent = exp.description;
    const meta = main.appendChild(document.createElement('div'));
    meta.className = 'expense-meta';
    const payer = meta.appendChild(document.createElement('span'));
    payer.className = 'payer'; payer.textContent = exp.paidBy;
    meta.appendChild(document.createTextNode(` • ${formatDate(exp.date)}`));

    const amtCol = row.appendChild(document.createElement('div'));
    amtCol.className = 'expense-amount-col';
    amtCol.textContent = formatCurrency(exp.amount, currentTrip?.currency);

    const actCol = row.appendChild(document.createElement('div'));
    actCol.className = 'expense-actions-col';
    const editBtn = actCol.appendChild(document.createElement('button'));
    editBtn.className = 'btn btn-secondary btn-sm';
    editBtn.textContent = '✏️';
    editBtn.addEventListener('click', () => editExpense(exp.id));
    const delBtn = actCol.appendChild(document.createElement('button'));
    delBtn.className = 'btn btn-danger btn-sm';
    delBtn.textContent = '🗑️';
    delBtn.addEventListener('click', () => deleteExpense(exp.id));

    list.appendChild(row);
  });
}

function editExpense(id) {
  const exp = expenses.find(e => e.id === id);
  if (!exp) return;
  openExpenseModal();
  const form = $('expense-form');
  form.dataset.mode = 'edit'; form.dataset.expenseId = id;
  $('expense-description').value = exp.description;
  $('expense-amount').value = exp.amount;
  $('expense-paid-by').value = exp.paidBy;
  $('expense-date').value = exp.date;
  $('expense-time').value = exp.time || '';
  qs('#expense-modal h3').textContent = 'Edit Expense';
  $('save-expense').textContent = 'Update Expense';
  const radio = qs(`input[name="split-type"][value="${exp.splitType}"]`);
  if (radio) { radio.checked = true; updateSplitOptions(exp.splitType) }
  setTimeout(() => {
    switch (exp.splitType) {
      case 'select-equal': exp.involvedMembers.forEach(n => { const cb = qs(`[name="selected-members"][value="${n}"]`); if (cb) cb.checked = true }); break;
      case 'percentage': Object.entries(exp.splitData).forEach(([n,a]) => { const i = qs(`[name="percentage-${n}"]`); if (i) i.value = (a/exp.amount*100).toFixed(1) }); updatePercentageTotal(); break;
      case 'shares': { const base = Math.min(...Object.values(exp.splitData)); Object.entries(exp.splitData).forEach(([n,a]) => { const i = qs(`[name="shares-${n}"]`); if (i) i.value = Math.round(a/base) }); updateSharesTotal(); break }
      case 'custom': Object.entries(exp.splitData).forEach(([n,a]) => { const i = qs(`[name="custom-${n}"]`); if (i) i.value = a.toFixed(2) }); updateCustomTotal(); break;
    }
  }, 100);
}

function deleteExpense(id) {
  const exp = expenses.find(e => e.id === id);
  if (!exp || !confirm(`Delete "${exp.description}"?`)) return;
  expenses = expenses.filter(e => e.id !== id);
  saveData(); updateDisplay(); calcSettlements();
}

// ======= BALANCE CALCULATIONS =======
function calcBalances() {
  const b = {};
  members.forEach(m => b[m.name] = 0);
  expenses.forEach(e => { b[e.paidBy] += e.amount; Object.entries(e.splitData).forEach(([n, a]) => b[n] -= a) });
  return b;
}

function calcOptimalSettlements(balances) {
  const creditors = [], debtors = [];
  Object.entries(balances).forEach(([n, b]) => {
    if (b > 0.01) creditors.push({ name: n, amount: b });
    else if (b < -0.01) debtors.push({ name: n, amount: Math.abs(b) });
  });
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);
  const settlements = [];
  while (creditors.length && debtors.length) {
    const amt = Math.min(creditors[0].amount, debtors[0].amount);
    settlements.push({ from: debtors[0].name, to: creditors[0].name, amount: amt });
    creditors[0].amount -= amt; debtors[0].amount -= amt;
    if (creditors[0].amount < 0.01) creditors.shift();
    if (debtors[0].amount < 0.01) debtors.shift();
  }
  return settlements;
}

function calcSettlements() {
  const balances = calcBalances();
  renderBalanceBars(balances);
  renderSettlementFlow(balances);
  updateCharts();
}

// ======= BIDIRECTIONAL BAR GRAPH (segment 1) =======
function renderBalanceBars(balances) {
  const container = $('balance-bars');
  container.innerHTML = '';
  const entries = Object.entries(balances);
  if (!entries.length) return;
  const maxAbs = Math.max(...entries.map(([,v]) => Math.abs(v)), 0.01);
  entries.forEach(([name, bal]) => {
    const absBal = Math.abs(bal);
    const pct = Math.max(3, (absBal / maxAbs) * 100);
    const row = document.createElement('div'); row.className = 'bidir-row';
    if (bal > 0.01) {
      row.innerHTML = `
        <span class="bidir-label">${name}</span>
        <div class="bidir-track-wrap">
          <div class="bidir-track"></div>
          <div class="bidir-divider"></div>
          <div class="bidir-track"><div class="bidir-bar positive" style="width:${pct}%"></div></div>
        </div>
        <span class="bidir-amt positive">+${formatCurrency(bal, currentTrip?.currency)}</span>`;
    } else if (bal < -0.01) {
      row.innerHTML = `
        <span class="bidir-label">${name}</span>
        <div class="bidir-track-wrap">
          <div class="bidir-track"><div class="bidir-bar negative" style="width:${pct}%"></div></div>
          <div class="bidir-divider"></div>
          <div class="bidir-track"></div>
        </div>
        <span class="bidir-amt negative">${formatCurrency(absBal, currentTrip?.currency)}</span>`;
    } else {
      row.innerHTML = `
        <span class="bidir-label">${name}</span>
        <div class="bidir-track-wrap">
          <div class="bidir-track"></div>
          <div class="bidir-divider"></div>
          <div class="bidir-track"></div>
        </div>
        <span class="bidir-amt zero">Settled</span>`;
    }
    container.appendChild(row);
  });
}

// ======= SETTLEMENT FLOW DIAGRAM (segment 2) =======
function renderSettlementFlow(balances) {
  const settlements = calcOptimalSettlements(balances);
  const visual = $('settlements-visual');
  const settledMsg = $('all-settled-msg');
  const badge = $('settle-status-badge');

  visual.innerHTML = '';

  if (!settlements.length) {
    settledMsg.style.display = 'flex';
    badge.style.display = 'inline-block';
    return;
  }

  settledMsg.style.display = 'none';
  badge.style.display = 'none';

  const maxAmt = Math.max(...settlements.map(s => s.amount), 0.01);

  settlements.forEach(s => {
    const pct = Math.max(8, (s.amount / maxAmt) * 100);
    const flow = document.createElement('div'); flow.className = 'flow-row';
    flow.innerHTML = `
      <span class="flow-from">${s.from}</span>
      <div class="flow-track">
        <div class="flow-line" style="width:${pct}%">
          <span class="flow-amt">${formatCurrency(s.amount, currentTrip?.currency)}</span>
        </div>
      </div>
      <span class="flow-to">${s.to}</span>`;
    visual.appendChild(flow);
  });
}

// ======= CHARTS (paid + incurred, side by side) =======
function updateCharts() {
  if (!expenses.length) return;
  renderMiniChart('chart-paid', 'Paid', getPaidData(), ['#10b981','#34d399','#6ee7b7','#a7f3d0'], chartPaid, c => chartPaid = c);
  renderMiniChart('chart-incurred', 'Incurred', getIncurredData(), ['#a855f7','#c084fc','#d8b4fe','#e9d5ff'], chartIncurred, c => chartIncurred = c);
}

function renderMiniChart(canvasId, label, data, palette, existingChart, setChart) {
  const canvas = $(canvasId);
  if (!canvas) return;
  if (existingChart) existingChart.destroy();
  const labels = Object.keys(data);
  const vals = Object.values(data);
  if (!labels.length) return;
  setChart(new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: { labels, datasets: [{ label, data: vals, backgroundColor: palette.slice(0,labels.length).map(c => c + '80'), borderColor: palette.slice(0,labels.length), borderWidth: 1.5, borderRadius: 4, borderSkipped: false }] },
    options: {
      responsive: true, maintainAspectRatio: false, indexAxis: 'y',
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => formatCurrency(ctx.parsed.x, currentTrip?.currency) } } },
      scales: {
        x: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#8b949e', font: { size: 11 }, callback: v => formatCurrency(v, currentTrip?.currency) } },
        y: { grid: { display: false }, ticks: { color: '#f0f6fc', font: { size: 11, weight: 'bold' } } }
      }
    }
  }));
}

function getPaidData() {
  const d = {};
  members.forEach(m => d[m.name] = 0);
  expenses.forEach(e => d[e.paidBy] = (d[e.paidBy] || 0) + e.amount);
  return d;
}

function getIncurredData() {
  const d = {};
  members.forEach(m => d[m.name] = 0);
  expenses.forEach(e => Object.entries(e.splitData).forEach(([n, a]) => d[n] = (d[n] || 0) + a));
  return d;
}

// ======= EXPORT/IMPORT =======
function formatLocalDT(sep) {
  const d = new Date();
  const pad = n => String(n).padStart(2,'0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}${sep}${pad(d.getHours())}${sep}${pad(d.getMinutes())}${sep}${pad(d.getSeconds())}`;
}

function exportData() {
  const data = { currentTrip, members, expenses, exportedAt: new Date().toISOString(), version: '1.0' };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `expense-splitter-${(currentTrip?.name || 'data').replace(/\s+/g,'-')}-${formatLocalDT('-')}.json`;
  document.body.appendChild(link); link.click(); document.body.removeChild(link);
  showMessage('Data exported!', 'success');
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.currentTrip && !data.members && !data.expenses) throw new Error('Invalid');
      if (!confirm('Replace all current data?')) return;
      currentTrip = data.currentTrip || null;
      members = data.members || [];
      expenses = data.expenses || [];
      saveData(); updateDisplay(); calcSettlements();
      showMessage('Data imported!', 'success');
    } catch (err) { showMessage('Import failed. Check file.', 'error') }
  };
  reader.readAsText(file);
  event.target.value = '';
}

// ======= DISPLAY =======
function updateDisplay() {
  if (currentTrip) showTripView();
  else showWelcomeView();
}

function showWelcomeView() {
  $('welcome-screen').style.display = 'flex';
  $('dashboard').style.display = 'none';
  $('header-trip-info').style.display = 'none';
  $('header-stats').style.display = 'none';
  $('chip-created').style.display = 'none';
  $('chip-updated').style.display = 'none';
}

function showTripView() {
  $('welcome-screen').style.display = 'none';
  $('dashboard').style.display = 'block';
  $('header-trip-info').style.display = 'flex';
  $('header-stats').style.display = 'flex';

  $('header-trip-name').textContent = currentTrip.name;
  let dt = '';
  if (currentTrip.startDate && currentTrip.endDate) dt = `${formatDate(currentTrip.startDate)} - ${formatDate(currentTrip.endDate)}`;
  else if (currentTrip.startDate) dt = `From ${formatDate(currentTrip.startDate)}`;
  else if (currentTrip.endDate) dt = `Until ${formatDate(currentTrip.endDate)}`;
  else dt = 'No dates';
  $('header-trip-dates').textContent = dt;
  $('header-currency-badge').textContent = currentTrip.currency;

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  $('chip-total').textContent = formatCurrency(total, currentTrip.currency);
  $('chip-members').textContent = members.length + ' member' + (members.length !== 1 ? 's' : '');
  $('chip-expenses').textContent = expenses.length + ' expense' + (expenses.length !== 1 ? 's' : '');

  const meta = getCacheMeta();
  const createdChip = $('chip-created');
  const updatedChip = $('chip-updated');
  if (meta) {
    createdChip.textContent = '📅 ' + formatDateTime(currentTrip.createdAt);
    updatedChip.textContent = '🔄 ' + formatDateTime(meta.lastUpdated);
    createdChip.style.display = 'inline-block';
    updatedChip.style.display = 'inline-block';
  } else {
    createdChip.style.display = 'none';
    updatedChip.style.display = 'none';
  }

  renderMembers();
  $('expense-sort').value = currentExpenseSort;
  if (expenses.length) renderExpenses();
  else $('expenses-list').innerHTML = '';

  calcSettlements();
}

// ======= INIT =======
function init() {
  closeModals();

  $('new-trip-btn').onclick = () => openTripModal();
  $('create-first-trip-btn').onclick = () => openTripModal();
  $('edit-trip-btn').onclick = () => openTripModal(true);
  $('export-data-btn').onclick = exportData;
  $('import-data-btn').onclick = () => $('import-file-input').click();
  $('import-file-input').onchange = importData;
  $('clear-data-btn').onclick = clearCache;
  $('add-member-btn').onclick = openMemberModal;
  $('add-expense-btn').onclick = openExpenseModal;
  $('trip-form').onsubmit = handleTripSubmit;
  $('member-form').onsubmit = handleMemberSubmit;
  $('expense-form').onsubmit = handleExpenseSubmit;
  $('cancel-trip').onclick = closeModals;
  $('cancel-member').onclick = closeModals;
  $('cancel-expense').onclick = closeModals;
  qsa('.modal-close').forEach(b => b.onclick = closeModals);
  qsa('.modal-backdrop').forEach(b => b.onclick = closeModals);

  $('expense-amount').oninput = function() {
    const type = qs('input[name="split-type"]:checked')?.value;
    if (type === 'shares') updateSharesTotal();
    else if (type === 'custom') updateCustomTotal();
  };

  $('expense-sort').onchange = function() { currentExpenseSort = this.value; if (expenses.length) renderExpenses(); saveData() };

  window.addEventListener('keydown', e => { if (e.key === 'Escape') closeModals() });

  // Show cache prompt if data exists, otherwise normal load
  if (getCacheMeta()) promptCache();
  else { loadData(); updateDisplay(); if (expenses.length) calcSettlements() }
}

document.addEventListener('DOMContentLoaded', init);
