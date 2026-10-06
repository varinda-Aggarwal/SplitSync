const Expense = require("../models/Expense");

const getSettlement = async (req, res) => {
  try {
    const expenses = await Expense.find();

    const balances = {};

    expenses.forEach((expense) => {
      const payerId = expense.paidBy.toString();

      if (!balances[payerId]) {
        balances[payerId] = 0;
      }

      balances[payerId] += expense.amount;

      expense.participants.forEach((participant) => {
        const userId = participant.user.toString();

        if (!balances[userId]) {
          balances[userId] = 0;
        }

        balances[userId] -= participant.share;
      });
    });

    const creditors = [];
    const debtors = [];

    Object.entries(balances).forEach(([userId, balance]) => {
      if (balance > 0.01) {
        creditors.push({
          userId,
          amount: balance
        });
      } else if (balance < -0.01) {
        debtors.push({
          userId,
          amount: Math.abs(balance)
        });
      }
    });

    const settlements = [];

    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
      const amount = Math.min(
        debtors[i].amount,
        creditors[j].amount
      );

      settlements.push({
        from: debtors[i].userId,
        to: creditors[j].userId,
        amount: Number(amount.toFixed(2))
      });

      debtors[i].amount -= amount;
      creditors[j].amount -= amount;

      if (debtors[i].amount < 0.01) {
        i++;
      }

      if (creditors[j].amount < 0.01) {
        j++;
      }
    }

    res.status(200).json({
      balances,
      settlements
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};

module.exports = {
  getSettlement
};