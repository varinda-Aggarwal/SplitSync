const express = require("express");

const {
  createExpense,
  getExpenses
} = require("../controllers/expenseController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createExpense);
router.get("/", protect, getExpenses);

module.exports = router;