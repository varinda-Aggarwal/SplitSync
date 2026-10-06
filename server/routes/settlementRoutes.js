const express = require("express");

const {
  getSettlement
} = require("../controllers/settlementController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getSettlement);

module.exports = router;