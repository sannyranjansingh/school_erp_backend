const mongoose = require("mongoose");

const feeSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
    index: true
  },

  admissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admission",
    required: true
  },

  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
    required: true
  },

  sectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Section",
    required: true
  },

  totalFees: {
    type: Number,
    required: true,
    min: 0
  },

  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },

  dueAmount: {
    type: Number,
    default: 0,
    min: 0
  },

  status: {
    type: String,
    enum: ["PAID", "PARTIAL", "PENDING", "OVERDUE"],
    default: "PENDING"
  },

  academicYear: {
    type: String,
    required: true
  },

  feeStructureId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "FeeStructure"
  },

  dueDate: {
    type: Date,
    required: true
  },

  lateFee: {
    type: Number,
    default: 0
  },

  concessions: [{
    type: {
      type: String,
      enum: ["SCHOLARSHIP", "SIBLING", "STAFF", "OTHER"]
    },
    amount: Number,
    reason: String,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  }],

  remarks: String,

  payments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "FeePayment"
  }],

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }

}, { timestamps: true });

// Indexes
feeSchema.index({ classId: 1, sectionId: 1, status: 1 });
feeSchema.index({ studentId: 1, academicYear: 1 }, { unique: true });

// ✅ FIXED PRE-SAVE MIDDLEWARE
// feeSchema.pre('save', function(next) {
//   try {
//     this.dueAmount = this.totalFees - this.paidAmount;
    
//     if (this.dueAmount <= 0) {
//       this.status = "PAID";
//     } else if (this.paidAmount > 0) {
//       this.status = "PARTIAL";
//     } else if (this.dueDate && this.dueDate < new Date()) {
//       this.status = "OVERDUE";
//     } else {
//       this.status = "PENDING";
//     }
    
//     next();
//   } catch (error) {
//     next(error);
//   }
// });

module.exports = mongoose.model("Fee", feeSchema);