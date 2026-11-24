const FollowUp = require("../models/FollowUp");

const createFollowUp = async (req, res) => {
  try {
    const { contact, note, type, dueAt } = req.body;
    if (!contact || !note || !dueAt) {
      return res.status(400).json({ message: "Contact, note, and due date are required" });
    }

    const followUp = await FollowUp.create({
      owner: req.userId,
      contact,
      note,
      type: type || "call",
      dueAt
    });
    res.status(201).json({ followUp });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getFollowUps = async (req, res) => {
  try {
    const items = await FollowUp.find({ owner: req.userId }).sort({ dueAt: 1 });
    res.status(200).json({ items });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getDashboard = async (req, res) => {
  try {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const [upcoming, overdue, done] = await Promise.all([
      FollowUp.countDocuments({ owner: req.userId, status: "upcoming", dueAt: { $gte: now, $lte: nextWeek } }),
      FollowUp.countDocuments({ owner: req.userId, status: "upcoming", dueAt: { $lt: now } }),
      FollowUp.countDocuments({ owner: req.userId, status: "done" })
    ]);
    const items = await FollowUp.find({ owner: req.userId }).sort({ dueAt: 1 }).limit(10);
    res.status(200).json({ upcoming, overdue, done, items });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateFollowUp = async (req, res) => {
  try {
    const allowed = ["contact", "note", "type", "dueAt", "status"];
    const updates = {};
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });

    const followUp = await FollowUp.findOneAndUpdate(
      { _id: req.params.id, owner: req.userId },
      updates,
      { new: true, runValidators: true }
    );
    if (!followUp) return res.status(404).json({ message: "Follow-up not found" });
    res.status(200).json({ followUp });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteFollowUp = async (req, res) => {
  try {
    const followUp = await FollowUp.findOneAndDelete({ _id: req.params.id, owner: req.userId });
    if (!followUp) return res.status(404).json({ message: "Follow-up not found" });
    res.status(200).json({ message: "Follow-up deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { createFollowUp, getFollowUps, getDashboard, updateFollowUp, deleteFollowUp };
