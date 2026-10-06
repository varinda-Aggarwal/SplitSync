const express = require("express");

const {
  getBalance
} = require("../controllers/balanceController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getBalance);

module.exports = router;