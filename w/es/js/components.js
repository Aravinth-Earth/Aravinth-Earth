// Vue.js Components for Expense Splitter
console.log('Loading components.js');

// Expense Card Component
const ExpenseCard = {
  props: ['expense'],
  emits: ['edit', 'delete'],
  template: `
    <q-card class="expense-card" flat bordered>
      <q-card-section>
        <div class="row items-center">
          <div class="col">
            <div class="text-h6">{{ expense.description }}</div>
            <div class="text-caption text-grey-6">
              {{ formatDate(expense.date) }} • {{ expense.category || 'Uncategorized' }}
            </div>
          </div>
          <div class="col-auto">
            <div class="text-h6 text-currency">{{ formatCurrency(expense.amount) }}</div>
          </div>
        </div>
        
        <div class="q-mt-sm">
          <div class="text-caption">
            <strong>Paid by:</strong> {{ getPaidByText(expense.paidBy) }}
          </div>
          <div class="text-caption">
            <strong>Split among:</strong> {{ getSplitAmongText(expense.splitAmong) }}
          </div>
        </div>
      </q-card-section>
      
      <q-card-actions align="right">
        <q-btn flat color="primary" icon="edit" @click="$emit('edit', expense)" />
        <q-btn flat color="negative" icon="delete" @click="confirmDelete" />
      </q-card-actions>
    </q-card>
  `,
  methods: {
    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString();
    },
    formatCurrency(amount) {
      return ExpenseCalculations.formatCurrency(amount);
    },
    getPaidByText(paidBy) {
      if (paidBy.mode === 'single') {
        const member = this.$parent.getMemberById(paidBy.memberId);
        return member ? member.name : 'Unknown';
      } else {
        return `${paidBy.members.length} members`;
      }
    },
    getSplitAmongText(splitAmong) {
      if (splitAmong.splitType === 'equal') {
        return `${splitAmong.members.length} members (equal)`;
      } else {
        return `${splitAmong.shares?.length || 0} members (${splitAmong.splitType})`;
      }
    },
    confirmDelete() {
      this.$q.dialog({
        title: 'Delete Expense',
        message: 'Are you sure you want to delete this expense?',
        cancel: true,
        persistent: true
      }).onOk(() => {
        this.$emit('delete', this.expense);
      });
    }
  }
};

// Member Card Component
const MemberCard = {
  props: ['member'],
  emits: ['edit', 'delete'],
  template: `
    <q-card class="member-card" flat bordered>
      <q-card-section>
        <div class="row items-center">
          <div class="col-auto q-mr-md">
            <div class="member-avatar" :style="{ backgroundColor: member.color }">
              {{ getInitials(member.name) }}
            </div>
          </div>
          <div class="col">
            <div class="text-h6">{{ member.name }}</div>
            <div class="text-caption text-grey-6" v-if="member.email">{{ member.email }}</div>
          </div>
        </div>
      </q-card-section>
      
      <q-card-actions align="right">
        <q-btn flat color="primary" icon="edit" @click="$emit('edit', member)" />
        <q-btn flat color="negative" icon="delete" @click="confirmDelete" />
      </q-card-actions>
    </q-card>
  `,
  methods: {
    getInitials(name) {
      return name.split(' ').map(word => word[0]).join('').toUpperCase().substring(0, 2);
    },
    confirmDelete() {
      this.$q.dialog({
        title: 'Delete Member',
        message: 'Are you sure you want to delete this member? This action cannot be undone if they have expenses.',
        cancel: true,
        persistent: true
      }).onOk(() => {
        this.$emit('delete', this.member);
      });
    }
  }
};

// Balance Overview Component
const BalanceOverview = {
  props: ['balances'],
  template: `
    <div class="balance-overview">
      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-6 col-lg-4" v-for="balance in Object.values(balances)" :key="balance.id">
          <q-card flat bordered>
            <q-card-section>
              <div class="text-h6">{{ balance.name }}</div>
              <div class="row q-mt-sm">
                <div class="col-6">
                  <div class="text-caption text-grey-6">Paid</div>
                  <div class="text-body1 text-positive">{{ formatCurrency(balance.totalPaid) }}</div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-6">Owes</div>
                  <div class="text-body1 text-negative">{{ formatCurrency(balance.totalOwed) }}</div>
                </div>
              </div>
              <q-separator class="q-my-sm" />
              <div class="text-center">
                <div class="text-caption text-grey-6">Balance</div>
                <div class="text-h6" :class="getBalanceClass(balance.balance)">
                  {{ formatCurrency(Math.abs(balance.balance)) }}
                  <q-chip v-if="balance.balance > 0" color="positive" text-color="white" size="sm">
                    Gets back
                  </q-chip>
                  <q-chip v-else-if="balance.balance < 0" color="negative" text-color="white" size="sm">
                    Owes
                  </q-chip>
                  <q-chip v-else color="info" text-color="white" size="sm">
                    Even
                  </q-chip>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
      
      <!-- Balance Chart -->
      <div class="q-mt-lg" v-if="Object.keys(balances).length > 0">
        <h6>Balance Overview Chart</h6>
        <div class="chart-container">
          <canvas ref="balanceChart"></canvas>
        </div>
      </div>
    </div>
  `,
  mounted() {
    this.createBalanceChart();
  },
  watch: {
    balances: {
      handler() {
        this.createBalanceChart();
      },
      deep: true
    }
  },
  methods: {
    formatCurrency(amount) {
      return ExpenseCalculations.formatCurrency(amount);
    },
    getBalanceClass(balance) {
      if (balance > 0.01) return 'balance-positive';
      if (balance < -0.01) return 'balance-negative';
      return 'balance-zero';
    },
    createBalanceChart() {
      this.$nextTick(() => {
        if (!this.$refs.balanceChart) return;
        
        const ctx = this.$refs.balanceChart.getContext('2d');
        const balanceArray = Object.values(this.balances);
        
        if (this.chart) {
          this.chart.destroy();
        }
        
        this.chart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: balanceArray.map(b => b.name),
            datasets: [{
              label: 'Balance',
              data: balanceArray.map(b => b.balance),
              backgroundColor: balanceArray.map(b => 
                b.balance > 0 ? '#21ba45' : b.balance < 0 ? '#c10015' : '#31ccec'
              ),
              borderColor: balanceArray.map(b => 
                b.balance > 0 ? '#1ba835' : b.balance < 0 ? '#a10010' : '#21aac0'
              ),
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: function(value) {
                    return ExpenseCalculations.formatCurrency(value);
                  }
                }
              }
            }
          }
        });
      });
    }
  },
  beforeUnmount() {
    if (this.chart) {
      this.chart.destroy();
    }
  }
};

// Settlement Suggestions Component
const SettlementSuggestions = {
  props: ['settlements'],
  template: `
    <div class="settlement-suggestions">
      <div v-if="settlements.length === 0" class="text-center q-pa-xl">
        <q-icon name="check_circle" size="80px" color="positive" />
        <h6 class="text-positive q-mt-md">All settled up!</h6>
        <p class="text-grey-6">No money needs to be exchanged.</p>
      </div>
      
      <div v-else>
        <div class="text-h6 q-mb-md">Suggested Settlements</div>
        <p class="text-grey-6 q-mb-lg">
          Minimize transactions with these {{ settlements.length }} payment{{ settlements.length > 1 ? 's' : '' }}:
        </p>
        
        <div class="settlement-item" v-for="(settlement, index) in settlements" :key="index">
          <div class="row items-center">
            <div class="col">
              <div class="text-body1">
                <strong>{{ settlement.fromName }}</strong> owes <strong>{{ settlement.toName }}</strong>
              </div>
              <div class="text-caption text-grey-6">
                Settlement {{ index + 1 }} of {{ settlements.length }}
              </div>
            </div>
            <div class="col-auto">
              <div class="text-h6 text-currency">{{ formatCurrency(settlement.amount) }}</div>
            </div>
            <div class="col-auto q-ml-md">
              <q-btn flat round color="positive" icon="check" @click="markAsSettled(settlement)" />
            </div>
          </div>
        </div>
        
        <div class="q-mt-lg">
          <q-btn color="positive" icon="check_circle" label="Mark All as Settled" @click="markAllAsSettled" />
        </div>
      </div>
    </div>
  `,
  methods: {
    formatCurrency(amount) {
      return ExpenseCalculations.formatCurrency(amount);
    },
    markAsSettled(settlement) {
      this.$q.dialog({
        title: 'Mark as Settled',
        message: `Mark payment from ${settlement.fromName} to ${settlement.toName} as settled?`,
        cancel: true,
        persistent: true
      }).onOk(() => {
        // In a real app, you might want to record this settlement
        this.$q.notify({
          type: 'positive',
          message: 'Settlement marked as completed',
          position: 'top'
        });
      });
    },
    markAllAsSettled() {
      this.$q.dialog({
        title: 'Mark All as Settled',
        message: 'Mark all settlements as completed?',
        cancel: true,
        persistent: true
      }).onOk(() => {
        this.$q.notify({
          type: 'positive',
          message: 'All settlements marked as completed',
          position: 'top'
        });
      });
    }
  }
};

// Create Trip Dialog Component
const CreateTripDialog = {
  props: ['modelValue'],
  emits: ['update:modelValue', 'created'],
  data() {
    return {
      tripData: {
        name: '',
        startDate: '',
        endDate: '',
        currency: 'INR',
        description: ''
      },
      currencies: [
        { label: 'Indian Rupee (₹)', value: 'INR' },
        { label: 'US Dollar ($)', value: 'USD' },
        { label: 'Euro (€)', value: 'EUR' },
        { label: 'British Pound (£)', value: 'GBP' },
        { label: 'Japanese Yen (¥)', value: 'JPY' },
        { label: 'Australian Dollar (A$)', value: 'AUD' },
        { label: 'Canadian Dollar (C$)', value: 'CAD' },
        { label: 'Singapore Dollar (S$)', value: 'SGD' },
        { label: 'Swiss Franc (CHF)', value: 'CHF' },
        { label: 'Chinese Yuan (¥)', value: 'CNY' }
      ]
    };
  },
  template: `
    <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Create New Trip</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-form @submit="createTrip" class="q-gutter-md">
            <q-input
              v-model="tripData.name"
              label="Trip Name"
              filled
              required
              :rules="[val => !!val || 'Trip name is required']"
            />
            
            <div class="row q-col-gutter-md">
              <div class="col-6">
                <q-input
                  v-model="tripData.startDate"
                  label="Start Date"
                  type="date"
                  filled
                  required
                />
              </div>
              <div class="col-6">
                <q-input
                  v-model="tripData.endDate"
                  label="End Date"
                  type="date"
                  filled
                  required
                />
              </div>
            </div>
            
            <q-select
              v-model="tripData.currency"
              label="Currency"
              :options="currencies"
              filled
              emit-value
              map-options
            />
            
            <q-input
              v-model="tripData.description"
              label="Description (optional)"
              type="textarea"
              filled
              rows="3"
            />
          </q-form>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="grey" @click="$emit('update:modelValue', false)" />
          <q-btn label="Create Trip" color="primary" @click="createTrip" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  `,
  methods: {
    async createTrip() {
      if (!this.tripData.name || !this.tripData.startDate || !this.tripData.endDate) {
        this.$q.notify({
          type: 'negative',
          message: 'Please fill in all required fields'
        });
        return;
      }

      try {
        const trip = await DatabaseService.createTrip(this.tripData);
        this.$emit('created', trip);
        this.$emit('update:modelValue', false);
        
        // Reset form
        this.tripData = {
          name: '',
          startDate: '',
          endDate: '',
          currency: 'INR',
          description: ''
        };
        
        this.$q.notify({
          type: 'positive',
          message: 'Trip created successfully'
        });
      } catch (error) {
        this.$q.notify({
          type: 'negative',
          message: 'Failed to create trip'
        });
      }
    }
  }
};

// Add Member Dialog Component
const AddMemberDialog = {
  props: ['modelValue'],
  emits: ['update:modelValue', 'added'],
  data() {
    return {
      memberData: {
        name: '',
        email: '',
        color: this.getRandomColor()
      }
    };
  },
  template: `
    <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Add Member</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-form @submit="addMember" class="q-gutter-md">
            <q-input
              v-model="memberData.name"
              label="Name"
              filled
              required
              :rules="[val => !!val || 'Name is required']"
            />
            
            <q-input
              v-model="memberData.email"
              label="Email (optional)"
              type="email"
              filled
            />
            
            <div>
              <div class="text-body2 q-mb-sm">Avatar Color</div>
              <div class="row q-gutter-sm">
                <div
                  v-for="color in colorOptions"
                  :key="color"
                  class="color-option"
                  :class="{ selected: memberData.color === color }"
                  :style="{ backgroundColor: color }"
                  @click="memberData.color = color"
                ></div>
              </div>
            </div>
          </q-form>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="grey" @click="$emit('update:modelValue', false)" />
          <q-btn label="Add Member" color="secondary" @click="addMember" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  `,
  computed: {
    colorOptions() {
      return ['#1976d2', '#26a69a', '#9c27b0', '#ff9800', '#f44336', '#4caf50', '#ff5722', '#795548'];
    }
  },
  methods: {
    getRandomColor() {
      const colors = ['#1976d2', '#26a69a', '#9c27b0', '#ff9800', '#f44336', '#4caf50'];
      return colors[Math.floor(Math.random() * colors.length)];
    },
    async addMember() {
      if (!this.memberData.name) {
        this.$q.notify({
          type: 'negative',
          message: 'Name is required'
        });
        return;
      }

      try {
        const member = {
          ...this.memberData,
          tripId: this.$parent.currentTrip.id
        };
        
        const addedMember = await DatabaseService.addMember(member);
        this.$emit('added', addedMember);
        this.$emit('update:modelValue', false);
        
        // Reset form
        this.memberData = {
          name: '',
          email: '',
          color: this.getRandomColor()
        };
        
        this.$q.notify({
          type: 'positive',
          message: 'Member added successfully'
        });
      } catch (error) {
        this.$q.notify({
          type: 'negative',
          message: 'Failed to add member'
        });
      }
    }
  }
};

// Export components globally
console.log('Exporting components globally...');
window.ExpenseCard = ExpenseCard;
window.MemberCard = MemberCard;
window.BalanceOverview = BalanceOverview;
window.SettlementSuggestions = SettlementSuggestions;
window.CreateTripDialog = CreateTripDialog;
window.AddMemberDialog = AddMemberDialog;

console.log('Components exported:', {
  ExpenseCard: !!window.ExpenseCard,
  MemberCard: !!window.MemberCard,
  BalanceOverview: !!window.BalanceOverview,
  SettlementSuggestions: !!window.SettlementSuggestions,
  CreateTripDialog: !!window.CreateTripDialog,
  AddMemberDialog: !!window.AddMemberDialog
});
