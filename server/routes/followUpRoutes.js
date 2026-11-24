const express = require("express");
const protect = require("../middleware/authMiddleware");
const {
  createFollowUp,
  getFollowUps,
  getDashboard,
  updateFollowUp,
  deleteFollowUp
} = require("../controllers/followUpController");

const router = express.Router();

router.use(protect);
router.get("/dashboard", getDashboard);
router.route("/")
  .get(getFollowUps)
  .post(createFollowUp);
router.route("/:id")
  .put(updateFollowUp)
  .patch(updateFollowUp)
  .delete(deleteFollowUp);

module.exports = router;
