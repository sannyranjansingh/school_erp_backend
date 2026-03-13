// models/Class.js
const mongoose = require("mongoose");

const classSchema = new mongoose.Schema(
  {
    className: {
      type: String,
      required: true,
    },

    classNumeric: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },

    remarks: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Class", classSchema);