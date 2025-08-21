// Main Vue.js Application for Expense Splitter
console.log('Loading app.js');

const { createApp } = Vue;

const ExpenseSplitterApp = {
  data() {
    return {
      // App state
      currentTrip: null,
      trips: [],
      expenses: [],
      activeTab: 'expenses',
      
      // Dialog states
      showCreateTrip: false,
      showAddMember: false,
      showAddExpense: false,
      showEditTrip: false,
      showSettings: false,
      
      // Debug
      debugCounter: 0,
      
      // Loading states
      loading: true,
      
      // Settings
      settings: {
        currency: 'INR',
        theme: 'light',
        dateFormat: 'DD/MM/YYYY'
      }
    };
  },
  
  computed: {
    totalExpenses() {
      return this.expenses.reduce((sum, expense) => sum + expense.amount, 0);
    },
    
    memberBalances() {
      if (!this.currentTrip || !this.currentTrip.members) return {};
      return ExpenseCalculations.calculateMemberBalances(this.currentTrip.members, this.expenses);
    },
    
    settlements() {
      return ExpenseCalculations.calculateSettlements(this.memberBalances);
    }
  },
  
  async mounted() {
    console.log('App mounted, initializing...');
    try {
      console.log('Loading settings...');
      await this.loadSettings();
      console.log('Loading trips...');
      await this.loadTrips();
      console.log('Loading current trip...');
      await this.loadCurrentTrip();
      console.log('App initialization complete');
      this.loading = false;
    } catch (error) {
      console.error('Failed to initialize app:', error);
      this.loading = false;
      this.$q?.notify({
        type: 'negative',
        message: 'Failed to initialize application'
      });
    }
  },
  
  methods: {
    // Data loading methods
    async loadSettings() {
      console.log('DatabaseService available:', !!window.DatabaseService);
      this.settings.currency = await DatabaseService.getSetting('currency', 'INR');
      this.settings.theme = await DatabaseService.getSetting('theme', 'light');
      this.settings.dateFormat = await DatabaseService.getSetting('dateFormat', 'DD/MM/YYYY');
      console.log('Settings loaded:', this.settings);
    },
    
    async loadTrips() {
      this.trips = await DatabaseService.getAllTrips();
    },
    
    async loadCurrentTrip() {
      const currentTripId = await DatabaseService.getSetting('currentTripId');
      if (currentTripId && this.trips.find(t => t.id === currentTripId)) {
        await this.selectTrip(currentTripId);
      } else if (this.trips.length > 0) {
        await this.selectTrip(this.trips[0].id);
      }
    },
    
    async selectTrip(tripId) {
      try {
        console.log('Selecting trip:', tripId);
        this.currentTrip = await DatabaseService.getTrip(tripId);
        if (this.currentTrip) {
          console.log('Trip loaded:', this.currentTrip.name);
          this.currentTrip.members = await DatabaseService.getTripMembers(tripId) || [];
          this.expenses = await DatabaseService.getTripExpenses(tripId) || [];
          console.log(`Loaded ${this.currentTrip.members.length} members and ${this.expenses.length} expenses`);
          await DatabaseService.setSetting('currentTripId', tripId);
        } else {
          // Ensure we have empty arrays even if trip doesn't exist
          this.expenses = [];
        }
      } catch (error) {
        console.error('Failed to load trip:', error);
        this.$q?.notify({
          type: 'negative',
          message: 'Failed to load trip data'
        });
      }
    },
    
    // Trip management
    async onTripCreated(trip) {
      this.trips.unshift(trip);
      await this.selectTrip(trip.id);
    },
    
    // Member management
    async onMemberAdded(member) {
      this.currentTrip.members.push(member);
    },
    
    async editMember(member) {
      // TODO: Implement member editing dialog
      console.log('Edit member:', member);
    },
    
    async deleteMember(member) {
      try {
        await DatabaseService.deleteMember(member.id);
        const index = this.currentTrip.members.findIndex(m => m.id === member.id);
        if (index > -1) {
          this.currentTrip.members.splice(index, 1);
        }
        this.$q.notify({
          type: 'positive',
          message: 'Member deleted successfully'
        });
      } catch (error) {
        this.$q.notify({
          type: 'negative',
          message: error.message || 'Failed to delete member'
        });
      }
    },
    
    // Expense management
    async onExpenseAdded(expense) {
      this.expenses.unshift(expense);
    },
    
    async editExpense(expense) {
      // TODO: Implement expense editing dialog
      console.log('Edit expense:', expense);
    },
    
    async deleteExpense(expense) {
      try {
        await DatabaseService.deleteExpense(expense.id);
        const index = this.expenses.findIndex(e => e.id === expense.id);
        if (index > -1) {
          this.expenses.splice(index, 1);
        }
        this.$q.notify({
          type: 'positive',
          message: 'Expense deleted successfully'
        });
      } catch (error) {
        this.$q.notify({
          type: 'negative',
          message: 'Failed to delete expense'
        });
      }
    },
    
    // Data export/import
    async exportData() {
      try {
        await DatabaseService.createBackup();
        this.$q.notify({
          type: 'positive',
          message: 'Data exported successfully'
        });
      } catch (error) {
        this.$q.notify({
          type: 'negative',
          message: 'Failed to export data'
        });
      }
    },
    
    importData() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = async (event) => {
        const file = event.target.files[0];
        if (file) {
          try {
            await DatabaseService.restoreBackup(file);
            await this.loadTrips();
            await this.loadCurrentTrip();
            this.$q.notify({
              type: 'positive',
              message: 'Data imported successfully'
            });
          } catch (error) {
            this.$q.notify({
              type: 'negative',
              message: 'Failed to import data'
            });
          }
        }
      };
      input.click();
    },
    
    // Utility methods
    formatCurrency(amount) {
      return ExpenseCalculations.formatCurrency(amount, this.settings.currency);
    },
    
    getMemberById(id) {
      return this.currentTrip?.members?.find(member => member.id === id);
    },
    
    // Trip editing
    editTrip() {
      console.log('APP: Edit trip button clicked');
      console.log('APP: Current trip data:', this.currentTrip);
      console.log('APP: showEditTrip BEFORE:', this.showEditTrip);
      
      if (!this.currentTrip) {
        console.error('APP: No current trip to edit');
        this.$q.notify({
          type: 'negative',
          message: 'No trip selected to edit'
        });
        return;
      }
      
      console.log('APP: Opening edit trip dialog');
      this.showEditTrip = true;
      console.log('APP: showEditTrip AFTER:', this.showEditTrip);
      
      // Force Vue to update the DOM
      this.$nextTick(() => {
        console.log('APP: NextTick - showEditTrip:', this.showEditTrip);
        console.log('APP: NextTick - DOM should be updated now');
      });
    },
    
    // Handle trip update from dialog
    onTripUpdated(updatedTrip) {
      console.log('APP: Trip updated event received:', updatedTrip);
      
      // Update current trip data
      this.currentTrip = { ...this.currentTrip, ...updatedTrip };
      console.log('APP: Current trip updated in app:', this.currentTrip);
      
      // Refresh the display
      this.$forceUpdate();
      console.log('APP: Forced Vue update to refresh display');
    },
    
    // Clear current trip and start fresh
    clearTrip() {
      this.$q.dialog({
        title: 'Clear Trip',
        message: 'This will clear the current trip and start fresh. This action cannot be undone.',
        cancel: true,
        persistent: true,
        ok: {
          label: 'Clear Trip',
          color: 'negative'
        }
      }).onOk(async () => {
        try {
          this.currentTrip = null;
          this.expenses = [];
          await DatabaseService.setSetting('currentTripId', null);
          this.$q.notify({
            type: 'positive',
            message: 'Trip cleared successfully'
          });
        } catch (error) {
          console.error('Failed to clear trip:', error);
          this.$q.notify({
            type: 'negative',
            message: 'Failed to clear trip'
          });
        }
      });
    }
  },
  
  // Register components
  components: {
    'expense-card': window.ExpenseCard,
    'member-card': window.MemberCard,
    'balance-overview': window.BalanceOverview,
    'settlement-suggestions': window.SettlementSuggestions,
    'create-trip-dialog': window.CreateTripDialog,
    'add-member-dialog': window.AddMemberDialog,
    'edit-trip-dialog': window.EditTripDialog
  }
};

// Additional components that need to be created
const AddExpenseDialog = {
  props: ['modelValue', 'members'],
  emits: ['update:modelValue', 'added'],
  data() {
    return {
      step: 1,
      expenseData: {
        description: '',
        amount: 0,
        category: '',
        date: new Date().toISOString().split('T')[0],
        time: '',
        paidBy: {
          mode: 'single',
          memberId: null,
          members: [],
          splitType: 'equal',
          shares: []
        },
        splitAmong: {
          splitType: 'equal',
          members: [],
          shares: []
        }
      },
      categories: [
        'Food & Dining',
        'Transportation', 
        'Accommodation',
        'Entertainment',
        'Shopping',
        'Groceries',
        'Utilities',
        'Medical',
        'Fuel',
        'Other'
      ]
    };
  },
  template: `
    <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" persistent maximized>
      <q-card>
        <q-card-section>
          <div class="text-h6">Add Expense</div>
          <q-stepper v-model="step" vertical color="primary" animated>
            <!-- Step 1: Basic Info -->
            <q-step :name="1" title="Basic Information" icon="info" :done="step > 1">
              <q-form class="q-gutter-md">
                <q-input
                  v-model="expenseData.description"
                  label="Description"
                  filled
                  required
                />
                
                <q-input
                  v-model.number="expenseData.amount"
                  label="Amount"
                  type="number"
                  step="0.01"
                  filled
                  required
                  prefix="$"
                />
                
                <q-input
                  v-model="expenseData.date"
                  label="Date (optional)"
                  type="date"
                  filled
                />
                
                <q-input
                  v-model="expenseData.time"
                  label="Time (optional)"
                  type="time"
                  filled
                />
                
                <q-select
                  v-model="expenseData.category"
                  label="Category"
                  :options="categories"
                  filled
                  use-input
                  hide-selected
                  fill-input
                  input-debounce="0"
                  @new-value="createCategory"
                  hint="Select from list or type a custom category"
                />
              </q-form>
              
              <q-stepper-navigation>
                <q-btn @click="step = 2" color="primary" label="Next" :disable="!canProceedToStep2" />
              </q-stepper-navigation>
            </q-step>

            <!-- Step 2: Who Paid -->
            <q-step :name="2" title="Who Paid?" icon="payment" :done="step > 2">
              <div class="q-gutter-md">
                <q-option-group
                  v-model="expenseData.paidBy.mode"
                  :options="[
                    { label: 'Single person paid', value: 'single' },
                    { label: 'Multiple people paid', value: 'multiple' }
                  ]"
                  color="primary"
                />
                
                <div v-if="expenseData.paidBy.mode === 'single'">
                  <q-select
                    v-model="expenseData.paidBy.memberId"
                    label="Who paid?"
                    :options="memberOptions"
                    filled
                    emit-value
                    map-options
                  />
                </div>
                
                <div v-if="expenseData.paidBy.mode === 'multiple'">
                  <!-- Multiple payers implementation -->
                  <q-select
                    v-model="expenseData.paidBy.members"
                    label="Who paid?"
                    :options="memberOptions"
                    filled
                    multiple
                    emit-value
                    map-options
                  />
                  
                  <q-select
                    v-model="expenseData.paidBy.splitType"
                    label="How to split payment?"
                    :options="[
                      { label: 'Equal split', value: 'equal' },
                      { label: 'By percentage', value: 'percentage' },
                      { label: 'By amount', value: 'amount' },
                      { label: 'By shares', value: 'shares' }
                    ]"
                    filled
                    emit-value
                    map-options
                  />
                </div>
              </div>
              
              <q-stepper-navigation>
                <q-btn flat @click="step = 1" color="primary" label="Back" />
                <q-btn @click="step = 3" color="primary" label="Next" :disable="!canProceedToStep3" />
              </q-stepper-navigation>
            </q-step>

            <!-- Step 3: Split Among -->
            <q-step :name="3" title="Split Among?" icon="group" :done="step > 3">
              <div class="q-gutter-md">
                <q-select
                  v-model="expenseData.splitAmong.members"
                  label="Split among whom?"
                  :options="memberOptions"
                  filled
                  multiple
                  emit-value
                  map-options
                />
                
                <q-select
                  v-model="expenseData.splitAmong.splitType"
                  label="How to split expense?"
                  :options="[
                    { label: 'Equal split', value: 'equal' },
                    { label: 'By percentage', value: 'percentage' },
                    { label: 'By amount', value: 'amount' },
                    { label: 'By shares', value: 'shares' }
                  ]"
                  filled
                  emit-value
                  map-options
                />
              </div>
              
              <q-stepper-navigation>
                <q-btn flat @click="step = 2" color="primary" label="Back" />
                <q-btn @click="step = 4" color="primary" label="Next" :disable="!canProceedToStep4" />
              </q-stepper-navigation>
            </q-step>

            <!-- Step 4: Review -->
            <q-step :name="4" title="Review" icon="check">
              <div class="q-gutter-md">
                <q-card flat bordered>
                  <q-card-section>
                    <div class="text-h6">{{ expenseData.description }}</div>
                    <div class="text-h4 text-primary">{{ formatCurrency(expenseData.amount) }}</div>
                    <div class="text-caption">{{ expenseData.date }} • {{ expenseData.category }}</div>
                  </q-card-section>
                </q-card>
                
                <div class="text-body1">
                  <strong>Paid by:</strong> {{ getPaidByPreview() }}
                </div>
                <div class="text-body1">
                  <strong>Split among:</strong> {{ getSplitAmongPreview() }}
                </div>
              </div>
              
              <q-stepper-navigation>
                <q-btn flat @click="step = 3" color="primary" label="Back" />
                <q-btn @click="addExpense" color="positive" label="Add Expense" />
              </q-stepper-navigation>
            </q-step>
          </q-stepper>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="grey" @click="closeDialog" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  `,
  computed: {
    memberOptions() {
      return this.members.map(member => ({
        label: member.name,
        value: member.id
      }));
    },
    canProceedToStep2() {
      return this.expenseData.description && this.expenseData.amount > 0;
    },
    canProceedToStep3() {
      if (this.expenseData.paidBy.mode === 'single') {
        return this.expenseData.paidBy.memberId;
      } else {
        return this.expenseData.paidBy.members.length > 0;
      }
    },
    canProceedToStep4() {
      return this.expenseData.splitAmong.members.length > 0;
    }
  },
  methods: {
    formatCurrency(amount) {
      return ExpenseCalculations.formatCurrency(amount);
    },
    createCategory(val, done) {
      // Allow users to create custom categories
      if (val.length > 0) {
        if (!this.categories.includes(val)) {
          this.categories.push(val);
        }
        done(val, 'toggle');
      }
    },
    getPaidByPreview() {
      if (this.expenseData.paidBy.mode === 'single') {
        const member = this.members.find(m => m.id === this.expenseData.paidBy.memberId);
        return member ? member.name : '';
      } else {
        return `${this.expenseData.paidBy.members.length} members`;
      }
    },
    getSplitAmongPreview() {
      return `${this.expenseData.splitAmong.members.length} members (${this.expenseData.splitAmong.splitType})`;
    },
    async addExpense() {
      try {
        const errors = ExpenseCalculations.validateExpense(this.expenseData);
        if (errors.length > 0) {
          this.$q.notify({
            type: 'negative',
            message: errors[0]
          });
          return;
        }

        const expense = {
          ...this.expenseData,
          tripId: this.$parent.currentTrip.id
        };
        
        const addedExpense = await DatabaseService.addExpense(expense);
        this.$emit('added', addedExpense);
        this.closeDialog();
        
        this.$q.notify({
          type: 'positive',
          message: 'Expense added successfully'
        });
      } catch (error) {
        this.$q.notify({
          type: 'negative',
          message: 'Failed to add expense'
        });
      }
    },
    closeDialog() {
      this.$emit('update:modelValue', false);
      this.resetForm();
    },
    resetForm() {
      this.step = 1;
      this.expenseData = {
        description: '',
        amount: 0,
        category: '',
        date: new Date().toISOString().split('T')[0],
        time: '',
        paidBy: {
          mode: 'single',
          memberId: null,
          members: [],
          splitType: 'equal',
          shares: []
        },
        splitAmong: {
          splitType: 'equal',
          members: [],
          shares: []
        }
      };
    }
  }
};

const SettingsDialog = {
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template: `
    <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Settings</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="text-body1">Settings panel coming soon...</div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Close" color="primary" @click="$emit('update:modelValue', false)" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  `
};

// Create and mount the Vue app
console.log('Creating Vue app...');
const app = createApp(ExpenseSplitterApp);

// Use Quasar
console.log('Configuring Quasar...');
app.use(Quasar, {
  config: {
    dark: false, // or 'auto' or true
    notify: {
      position: 'top'
    }
  }
});

// Register additional components
console.log('Registering components...');
console.log('Available components:', {
  EditTripDialog: !!window.EditTripDialog,
  CreateTripDialog: !!window.CreateTripDialog,
  AddMemberDialog: !!window.AddMemberDialog
});
app.component('add-expense-dialog', AddExpenseDialog);
app.component('settings-dialog', SettingsDialog);

// Global error handler
app.config.errorHandler = (err, instance, info) => {
  console.error('Vue error:', err, info);
};

console.log('Mounting app...');
console.log('Target element:', document.getElementById('app'));
console.log('Target element innerHTML before mount:', document.getElementById('app')?.innerHTML?.substring(0, 100));

try {
  const mountedApp = app.mount('#app');
  console.log('App mounted successfully:', !!mountedApp);
  console.log('Target element innerHTML after mount:', document.getElementById('app')?.innerHTML?.substring(0, 100));
} catch (error) {
  console.error('MOUNT FAILED:', error);
}
