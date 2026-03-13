const mongoose = require("mongoose");

const feePaymentSchema = new mongoose.Schema({
  feeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Fee",
    required: true,
    index: true
  },

  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true
  },

  receiptNo: {
    type: String,
    // unique: true,
    required: true
  },

  paymentDate: {
    type: Date,
    default: Date.now,
    required: true
  },

  amount: {
    type: Number,
    required: true,
    min: 1
  },

  paymentMode: {
    type: String,
    enum: ["CASH", "CHEQUE", "ONLINE", "DD", "CARD"],
    required: true
  },

  // Payment Details based on mode
  chequeDetails: {
    chequeNo: String,
    bankName: String,
    chequeDate: Date
  },

  onlineDetails: {
    transactionId: String,
    paymentGateway: String,
    bankReference: String
  },

  cardDetails: {
    cardType: String,
    lastFourDigits: String,
    transactionId: String
  },

  // For which term/period
  paymentFor: {
    term: {
      type: String,
      enum: ["TERM1", "TERM2", "TERM3", "MONTHLY", "QUARTERLY", "HALFYEARLY", "YEARLY", "OTHER"]
    },
    month: {
      type: String,
      enum: ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
    },
    description: String
  },

  // Late fee if any
  lateFee: {
    type: Number,
    default: 0
  },

  // Discount/Concession applied
  concession: {
    type: Number,
    default: 0
  },

  // Remarks
  remarks: String,

  // Status
  status: {
    type: String,
    enum: ["SUCCESS", "PENDING", "FAILED", "REFUNDED"],
    default: "SUCCESS"
  },

  // Recorded by
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  // Bank deposit details (if cash/cheque)
  bankDepositDate: Date,
  bankSlipNo: String

}, { timestamps: true });

// Index for searching
feePaymentSchema.index({ receiptNo: 1 });
feePaymentSchema.index({ paymentDate: -1 });

module.exports = mongoose.model("FeePayment", feePaymentSchema);