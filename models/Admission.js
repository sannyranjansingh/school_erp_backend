const mongoose = require("mongoose");

const admissionSchema = new mongoose.Schema({
  admissionNo: {
    type: String,
    unique: true,
    required: true,
  },

  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
  },

  name: {
    type: String,
    required: true,
  },

  fatherName: String,
  motherName: String,
  dob: Date,
  gender: String,
  phone: String,
  address: String,

  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
    required: true,
  },

  sectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Section",
    required: true,
  },

  status: {
    type: String,
    enum: ["PENDING", "APPROVED", "REJECTED"],
    default: "PENDING",
  },

  createdBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
},

approvedBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
},

}, { timestamps: true });

module.exports = mongoose.model("Admission", admissionSchema);