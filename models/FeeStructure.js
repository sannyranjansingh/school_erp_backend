const mongoose = require("mongoose");

const feeStructureSchema = new mongoose.Schema({
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
    required: true,
  },

  academicYear: {
    type: String,
    required: true
  },

  tuitionFee: {
    type: Number,
    default: 0,
    min: 0
  },

  admissionFee: {
    type: Number,
    default: 0,
    min: 0
  },

  examFee: {
    type: Number,
    default: 0,
    min: 0
  },

  libraryFee: {
    type: Number,
    default: 0,
    min: 0
  },

  sportsFee: {
    type: Number,
    default: 0,
    min: 0
  },

  labFee: {
    type: Number,
    default: 0,
    min: 0
  },

  transportFee: {
    type: Number,
    default: 0,
    min: 0
  },

  hostelFee: {
    type: Number,
    default: 0,
    min: 0
  },

  miscellaneousFee: {
    type: Number,
    default: 0,
    min: 0
  },

  totalFee: {
    type: Number,
    default: 0,
    min: 0
  },

  paymentSchedule: [{
    term: {
      type: String,
      enum: ["TERM1", "TERM2", "TERM3", "MONTHLY", "QUARTERLY", "HALFYEARLY", "YEARLY"]
    },
    dueDate: Date,
    amount: Number,
    lateFeePercentage: {
      type: Number,
      default: 2
    }
  }],

  concessions: {
    siblingDiscount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    staffDiscount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    meritScholarship: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },

  status: {
    type: String,
    enum: ["ACTIVE", "INACTIVE"],
    default: "ACTIVE"
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }

}, { timestamps: true });

// ✅ COMPOUND INDEX - class + academic year unique
feeStructureSchema.index({ classId: 1, academicYear: 1 }, { unique: true });

module.exports = mongoose.model("FeeStructure", feeStructureSchema);