const Expense = require("../models/Expense");

const getBalance = async (req, res) => {
  try {
    const expenses = await Expense.find({
      $or: [
        { paidBy: req.userId },
        { "participants.user": req.userId }
      ]
    });

    let totalPaid = 0;
    let totalOwed = 0;

    expenses.forEach((expense) => {

      // Amount paid by current user
      if (expense.paidBy.toString() === req.userId) {
        totalPaid += expense.amount;
      }

      // Current user's share
      const participant = expense.participants.find(
        (p) => p.user.toString() === req.userId
      );

      if (participant) {
        totalOwed += participant.share;
      }
    });

    const balance = totalPaid - totalOwed;

    res.status(200).json({
      totalPaid,
      totalOwed,
      balance
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};

module.exports = {
  getBalance
};