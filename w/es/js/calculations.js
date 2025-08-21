// Calculation utilities for expense splitting
console.log('Loading calculations.js');

class ExpenseCalculations {
  
  // Calculate member balances for a trip
  static calculateMemberBalances(members, expenses) {
    const balances = {};
    
    // Initialize balances
    members.forEach(member => {
      balances[member.id] = {
        id: member.id,
        name: member.name,
        totalPaid: 0,
        totalOwed: 0,
        balance: 0
      };
    });

    // Calculate amounts for each expense
    expenses.forEach(expense => {
      const paidByShares = this.calculatePaidByShares(expense);
      const oweShares = this.calculateOwedShares(expense);

      // Add to total paid
      Object.entries(paidByShares).forEach(([memberId, amount]) => {
        if (balances[memberId]) {
          balances[memberId].totalPaid += amount;
        }
      });

      // Add to total owed
      Object.entries(oweShares).forEach(([memberId, amount]) => {
        if (balances[memberId]) {
          balances[memberId].totalOwed += amount;
        }
      });
    });

    // Calculate final balance (paid - owed)
    Object.values(balances).forEach(balance => {
      balance.balance = this.roundToDecimalPlaces(balance.totalPaid - balance.totalOwed, 2);
    });

    return balances;
  }

  // Calculate who paid how much for an expense
  static calculatePaidByShares(expense) {
    const paidByShares = {};
    const totalAmount = expense.amount;

    if (expense.paidBy.mode === 'single') {
      // Single person paid the entire amount
      paidByShares[expense.paidBy.memberId] = totalAmount;
    } else if (expense.paidBy.mode === 'multiple') {
      // Multiple people paid
      if (expense.paidBy.splitType === 'equal') {
        // Equal split among payers
        const amountPerPayer = totalAmount / expense.paidBy.members.length;
        expense.paidBy.members.forEach(memberId => {
          paidByShares[memberId] = this.roundToDecimalPlaces(amountPerPayer, 2);
        });
      } else if (expense.paidBy.splitType === 'percentage') {
        // Percentage-based split
        expense.paidBy.shares.forEach(share => {
          paidByShares[share.memberId] = this.roundToDecimalPlaces(
            (totalAmount * share.percentage) / 100, 2
          );
        });
      } else if (expense.paidBy.splitType === 'amount') {
        // Custom amount split
        expense.paidBy.shares.forEach(share => {
          paidByShares[share.memberId] = share.amount;
        });
      } else if (expense.paidBy.splitType === 'shares') {
        // Share-based split
        const totalShares = expense.paidBy.shares.reduce((sum, share) => sum + share.shares, 0);
        expense.paidBy.shares.forEach(share => {
          paidByShares[share.memberId] = this.roundToDecimalPlaces(
            (totalAmount * share.shares) / totalShares, 2
          );
        });
      }
    }

    return paidByShares;
  }

  // Calculate who owes how much for an expense
  static calculateOwedShares(expense) {
    const owedShares = {};
    const totalAmount = expense.amount;

    if (expense.splitAmong.splitType === 'equal') {
      // Equal split among all specified members
      const amountPerMember = totalAmount / expense.splitAmong.members.length;
      expense.splitAmong.members.forEach(memberId => {
        owedShares[memberId] = this.roundToDecimalPlaces(amountPerMember, 2);
      });
    } else if (expense.splitAmong.splitType === 'percentage') {
      // Percentage-based split
      expense.splitAmong.shares.forEach(share => {
        owedShares[share.memberId] = this.roundToDecimalPlaces(
          (totalAmount * share.percentage) / 100, 2
        );
      });
    } else if (expense.splitAmong.splitType === 'amount') {
      // Custom amount split
      expense.splitAmong.shares.forEach(share => {
        owedShares[share.memberId] = share.amount;
      });
    } else if (expense.splitAmong.splitType === 'shares') {
      // Share-based split
      const totalShares = expense.splitAmong.shares.reduce((sum, share) => sum + share.shares, 0);
      expense.splitAmong.shares.forEach(share => {
        owedShares[share.memberId] = this.roundToDecimalPlaces(
          (totalAmount * share.shares) / totalShares, 2
        );
      });
    }

    return owedShares;
  }

  // Calculate settlement suggestions (who should pay whom)
  static calculateSettlements(balances) {
    const settlements = [];
    const creditors = []; // People who are owed money (positive balance)
    const debtors = [];   // People who owe money (negative balance)

    // Separate creditors and debtors
    Object.values(balances).forEach(balance => {
      if (balance.balance > 0.01) { // Small tolerance for floating point
        creditors.push({ ...balance });
      } else if (balance.balance < -0.01) {
        debtors.push({ ...balance, balance: Math.abs(balance.balance) });
      }
    });

    // Sort for optimal settlement
    creditors.sort((a, b) => b.balance - a.balance);
    debtors.sort((a, b) => b.balance - a.balance);

    // Calculate settlements using greedy algorithm
    let i = 0, j = 0;
    while (i < creditors.length && j < debtors.length) {
      const creditor = creditors[i];
      const debtor = debtors[j];

      const settlementAmount = Math.min(creditor.balance, debtor.balance);

      if (settlementAmount > 0.01) { // Ignore very small amounts
        settlements.push({
          from: debtor.id,
          fromName: debtor.name,
          to: creditor.id,
          toName: creditor.name,
          amount: this.roundToDecimalPlaces(settlementAmount, 2)
        });

        creditor.balance -= settlementAmount;
        debtor.balance -= settlementAmount;
      }

      // Move to next person if balance is settled
      if (creditor.balance <= 0.01) i++;
      if (debtor.balance <= 0.01) j++;
    }

    return settlements;
  }

  // Validate expense splits
  static validateExpense(expense) {
    const errors = [];

    // Validate basic fields
    if (!expense.description || expense.description.trim() === '') {
      errors.push('Description is required');
    }

    if (!expense.amount || expense.amount <= 0) {
      errors.push('Amount must be greater than 0');
    }

    // Validate paid by
    if (!expense.paidBy || !expense.paidBy.mode) {
      errors.push('Payment information is required');
    } else {
      const paidByShares = this.calculatePaidByShares(expense);
      const totalPaid = Object.values(paidByShares).reduce((sum, amount) => sum + amount, 0);
      
      if (Math.abs(totalPaid - expense.amount) > 0.01) {
        errors.push('Paid by amounts do not match total expense amount');
      }
    }

    // Validate split among
    if (!expense.splitAmong || !expense.splitAmong.splitType) {
      errors.push('Split information is required');
    } else {
      const owedShares = this.calculateOwedShares(expense);
      const totalOwed = Object.values(owedShares).reduce((sum, amount) => sum + amount, 0);
      
      if (Math.abs(totalOwed - expense.amount) > 0.01) {
        errors.push('Split among amounts do not match total expense amount');
      }
    }

    return errors;
  }

  // Utility functions
  static roundToDecimalPlaces(number, places) {
    const factor = Math.pow(10, places);
    return Math.round(number * factor) / factor;
  }

  static formatCurrency(amount, currency = 'INR') {
    const currencySettings = {
      'INR': { locale: 'en-IN', symbol: '₹' },
      'USD': { locale: 'en-US', symbol: '$' },
      'EUR': { locale: 'de-DE', symbol: '€' },
      'GBP': { locale: 'en-GB', symbol: '£' },
      'JPY': { locale: 'ja-JP', symbol: '¥' },
      'AUD': { locale: 'en-AU', symbol: 'A$' },
      'CAD': { locale: 'en-CA', symbol: 'C$' },
      'SGD': { locale: 'en-SG', symbol: 'S$' },
      'CHF': { locale: 'de-CH', symbol: 'CHF' },
      'CNY': { locale: 'zh-CN', symbol: '¥' }
    };

    const setting = currencySettings[currency] || currencySettings['INR'];
    
    try {
      return new Intl.NumberFormat(setting.locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: currency === 'JPY' ? 0 : 2,
        maximumFractionDigits: currency === 'JPY' ? 0 : 2
      }).format(amount);
    } catch (error) {
      console.warn('Currency formatting failed, using fallback:', error);
      return `${setting.symbol}${amount.toFixed(currency === 'JPY' ? 0 : 2)}`;
    }
  }

  static formatPercentage(percentage) {
    return `${this.roundToDecimalPlaces(percentage, 1)}%`;
  }

  // Generate expense summary
  static generateExpenseSummary(expenses, members) {
    const summary = {
      totalExpenses: 0,
      expenseCount: expenses.length,
      categorySummary: {},
      memberSummary: {},
      dailySummary: {}
    };

    const memberMap = {};
    members.forEach(member => {
      memberMap[member.id] = member.name;
      summary.memberSummary[member.id] = {
        name: member.name,
        totalPaid: 0,
        totalOwed: 0,
        expenseCount: 0
      };
    });

    expenses.forEach(expense => {
      summary.totalExpenses += expense.amount;

      // Category summary
      const category = expense.category || 'Uncategorized';
      if (!summary.categorySummary[category]) {
        summary.categorySummary[category] = {
          total: 0,
          count: 0
        };
      }
      summary.categorySummary[category].total += expense.amount;
      summary.categorySummary[category].count += 1;

      // Daily summary
      const date = expense.date.split('T')[0]; // Get date part only
      if (!summary.dailySummary[date]) {
        summary.dailySummary[date] = {
          total: 0,
          count: 0
        };
      }
      summary.dailySummary[date].total += expense.amount;
      summary.dailySummary[date].count += 1;

      // Member summary
      const paidByShares = this.calculatePaidByShares(expense);
      const owedShares = this.calculateOwedShares(expense);

      Object.entries(paidByShares).forEach(([memberId, amount]) => {
        if (summary.memberSummary[memberId]) {
          summary.memberSummary[memberId].totalPaid += amount;
          summary.memberSummary[memberId].expenseCount += 1;
        }
      });

      Object.entries(owedShares).forEach(([memberId, amount]) => {
        if (summary.memberSummary[memberId]) {
          summary.memberSummary[memberId].totalOwed += amount;
        }
      });
    });

    return summary;
  }

  // Optimize settlements (minimize number of transactions)
  static optimizeSettlements(settlements) {
    // This is a simplified optimization
    // In a real-world scenario, you might want to implement more sophisticated algorithms
    return settlements.filter(settlement => settlement.amount > 0.01);
  }
}

// Make ExpenseCalculations globally available
window.ExpenseCalculations = ExpenseCalculations;
