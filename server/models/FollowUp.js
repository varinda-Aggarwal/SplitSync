const mongoose = require("mongoose");

const followUpSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    contact: {
      type: String,
      required: true,
      trim: true
    },
    note: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ["call", "meeting", "email", "other"],
      default: "call"
    },
    otherType: {
      type: String,
      trim: true,
      default: ""
    },
    dueAt: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ["upcoming", "done", "cancelled"],
      default: "upcoming"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("FollowUp", followUpSchema);
