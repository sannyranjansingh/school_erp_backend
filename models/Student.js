const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  studentId: {
    type: String,
    unique: true,
    required: true,
  },

  rollNo: {
    type: Number,
    required: true,
  },

  admissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admission",
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

}, { timestamps: true });

module.exports = mongoose.model("Student", studentSchema);