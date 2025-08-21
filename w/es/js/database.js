// Database layer using Dexie.js for IndexedDB
class ExpenseSplitterDB extends Dexie {
  constructor() {
    super('ExpenseSplitterDB');
    
    this.version(1).stores({
      trips: '++id, name, startDate, endDate, currency, createdAt, updatedAt',
      members: '++id, tripId, name, email, avatar, color, createdAt',
      expenses: '++id, tripId, description, amount, category, date, paidBy, splitAmong, createdAt, updatedAt',
      settings: 'key, value'
    });
  }
}

// Initialize database
const db = new ExpenseSplitterDB();

// Database operations
class DatabaseService {
  // Trip operations
  static async createTrip(tripData) {
    const trip = {
      ...tripData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const id = await db.trips.add(trip);
    return { ...trip, id };
  }

  static async getTrip(id) {
    return await db.trips.get(id);
  }

  static async getAllTrips() {
    return await db.trips.orderBy('updatedAt').reverse().toArray();
  }

  static async updateTrip(id, updates) {
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await db.trips.update(id, updateData);
    return await this.getTrip(id);
  }

  static async deleteTrip(id) {
    // Delete related data
    await db.members.where('tripId').equals(id).delete();
    await db.expenses.where('tripId').equals(id).delete();
    await db.trips.delete(id);
  }

  // Member operations
  static async addMember(memberData) {
    const member = {
      ...memberData,
      createdAt: new Date().toISOString()
    };
    const id = await db.members.add(member);
    return { ...member, id };
  }

  static async getTripMembers(tripId) {
    return await db.members.where('tripId').equals(tripId).toArray();
  }

  static async updateMember(id, updates) {
    await db.members.update(id, updates);
    return await db.members.get(id);
  }

  static async deleteMember(id) {
    // Check if member has expenses
    const expenses = await db.expenses.where('paidBy').equals(id).or('splitAmong').anyOf([id]).toArray();
    if (expenses.length > 0) {
      throw new Error('Cannot delete member with existing expenses');
    }
    await db.members.delete(id);
  }

  // Expense operations
  static async addExpense(expenseData) {
    const expense = {
      ...expenseData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const id = await db.expenses.add(expense);
    return { ...expense, id };
  }

  static async getTripExpenses(tripId) {
    return await db.expenses.where('tripId').equals(tripId).orderBy('date').reverse().toArray();
  }

  static async updateExpense(id, updates) {
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await db.expenses.update(id, updateData);
    return await db.expenses.get(id);
  }

  static async deleteExpense(id) {
    await db.expenses.delete(id);
  }

  // Settings operations
  static async getSetting(key, defaultValue = null) {
    const setting = await db.settings.get(key);
    return setting ? setting.value : defaultValue;
  }

  static async setSetting(key, value) {
    await db.settings.put({ key, value });
  }

  // Data export/import
  static async exportData() {
    const trips = await db.trips.toArray();
    const members = await db.members.toArray();
    const expenses = await db.expenses.toArray();
    const settings = await db.settings.toArray();

    return {
      version: '1.0',
      exportDate: new Date().toISOString(),
      data: {
        trips,
        members,
        expenses,
        settings
      }
    };
  }

  static async importData(data) {
    try {
      // Validate data structure
      if (!data.data || !data.version) {
        throw new Error('Invalid data format');
      }

      // Clear existing data (optional - could be made configurable)
      const clearExisting = confirm('This will replace all existing data. Continue?');
      if (clearExisting) {
        await db.trips.clear();
        await db.members.clear();
        await db.expenses.clear();
        await db.settings.clear();
      }

      // Import data
      if (data.data.trips) {
        await db.trips.bulkAdd(data.data.trips);
      }
      if (data.data.members) {
        await db.members.bulkAdd(data.data.members);
      }
      if (data.data.expenses) {
        await db.expenses.bulkAdd(data.data.expenses);
      }
      if (data.data.settings) {
        await db.settings.bulkAdd(data.data.settings);
      }

      return true;
    } catch (error) {
      console.error('Import failed:', error);
      throw error;
    }
  }

  // Backup operations
  static async createBackup() {
    const exportData = await this.exportData();
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `expense-splitter-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  static async restoreBackup(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = JSON.parse(e.target.result);
          await this.importData(data);
          resolve(true);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }
}

// Initialize database with default settings
db.ready(async () => {
  console.log('Database initialized');
  
  // Set default settings if they don't exist
  const currency = await DatabaseService.getSetting('currency');
  if (!currency) {
    await DatabaseService.setSetting('currency', 'USD');
    await DatabaseService.setSetting('theme', 'light');
    await DatabaseService.setSetting('dateFormat', 'MM/DD/YYYY');
    await DatabaseService.setSetting('precision', 2);
  }
});

// Error handling
db.open().catch(err => {
  console.error('Failed to open database:', err);
});

// Make DatabaseService globally available
window.DatabaseService = DatabaseService;
