const FollowUp = require("../models/FollowUp");
const followUpTypes = ["call", "meeting", "email", "other"];
const followUpStatuses = ["upcoming", "done", "cancelled"];

const createFollowUp = async (req, res) => {
  try {
    const { contact, note, type, dueAt } = req.body;
    if (
      typeof contact !== "string" ||
      !contact.trim() ||
      typeof note !== "string" ||
      !note.trim() ||
      !dueAt ||
      Number.isNaN(new Date(dueAt).getTime())
    ) {
      return res.status(400).json({ message: "Contact, note, and a valid due date are required" });
    }
    if (type !== undefined && !followUpTypes.includes(type)) {
      return res.status(400).json({ message: "Invalid follow-up type" });
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
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);
    const activeQuery = { owner: req.userId, status: "upcoming" };
    const [dueToday, upcoming, overdue, items] = await Promise.all([
      FollowUp.countDocuments({ ...activeQuery, dueAt: { $gte: now, $lte: endOfToday } }),
      FollowUp.countDocuments({ ...activeQuery, dueAt: { $gt: endOfToday } }),
      FollowUp.countDocuments({ owner: req.userId, status: "upcoming", dueAt: { $lt: now } }),
      FollowUp.find(activeQuery)
        .select("note dueAt contact")
        .sort({ dueAt: 1 })
        .limit(10)
    ]);
    res.status(200).json({
      dueToday,
      upcoming,
      overdue,
      items: items.map(({ _id, note, dueAt, contact }) => ({ _id, note, dueAt, contact }))
    });
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
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "At least one valid follow-up field is required" });
    }
    if (updates.contact !== undefined && (typeof updates.contact !== "string" || !updates.contact.trim())) {
      return res.status(400).json({ message: "Contact must be a non-empty string" });
    }
    if (updates.note !== undefined && (typeof updates.note !== "string" || !updates.note.trim())) {
      return res.status(400).json({ message: "Note must be a non-empty string" });
    }
    if (updates.type !== undefined && !followUpTypes.includes(updates.type)) {
      return res.status(400).json({ message: "Invalid follow-up type" });
    }
    if (updates.status !== undefined && !followUpStatuses.includes(updates.status)) {
      return res.status(400).json({ message: "Invalid follow-up status" });
    }
    if (updates.dueAt !== undefined && Number.isNaN(new Date(updates.dueAt).getTime())) {
      return res.status(400).json({ message: "A valid due date is required" });
    }

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
