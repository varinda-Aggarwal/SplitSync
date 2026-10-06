const Expense = require("../models/Expense");

const createExpense = async (req, res) => {
  try {
    const { description, amount, participants } = req.body;

    if (!description || !amount || !participants) {
      return res.status(400).json({
        message: "Description, amount and participants are required"
      });
    }

    if (!Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({
        message: "Participants are required"
      });
    }

    const totalShares = participants.reduce(
      (sum, participant) => sum + Number(participant.share),
      0
    );

    if (Math.abs(totalShares - Number(amount)) > 0.01) {
      return res.status(400).json({
        message: "Participant shares must equal total amount"
      });
    }

    const expense = await Expense.create({
      description,
      amount,
      paidBy: req.userId,
      participants
    });

    const populatedExpense = await Expense.findById(expense._id)
      .populate("paidBy", "name email")
      .populate("participants.user", "name email");

    res.status(201).json({
      message: "Expense created successfully",
      expense: populatedExpense
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};


const getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({
      $or: [
        { paidBy: req.userId },
        { "participants.user": req.userId }
      ]
    })
      .populate("paidBy", "name email")
      .populate("participants.user", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      expenses
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};


module.exports = {
  createExpense,
  getExpenses
};