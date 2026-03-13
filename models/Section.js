// models/Section.js
const mongoose = require("mongoose");

const sectionSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true,
    },

    sectionName: {
      type: String,
      required: true,
      trim: true,
    },

    capacity: {
      type: Number,
      default: 40,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
  },
  { timestamps: true }
);

// 🚀 Prevent duplicate sections per class
sectionSchema.index({ classId: 1, sectionName: 1 }, { unique: true });

module.exports = mongoose.model("Section", sectionSchema);