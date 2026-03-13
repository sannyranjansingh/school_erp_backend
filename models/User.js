const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT", "TEACHER"],
    default: "ADMIN"
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
//   loginHistory: [
//     {
//       loginAt: Date,
//       ip: String
//     }
//   ]
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);