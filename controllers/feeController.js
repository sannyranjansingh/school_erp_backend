const Fee = require("../models/Fee");
const FeeStructure = require("../models/FeeStructure");
const FeePayment = require("../models/FeePayment");
const Student = require("../models/Student");
const Class = require("../models/Class");
const Section = require("../models/Section");
const generateReceiptNo = require("../utils/generateReceiptNo");

// ==================== FEE STRUCTURE MANAGEMENT ====================

// Create fee structure for a class
exports.createFeeStructure = async (req, res) => {
  try {
    const { classId, academicYear } = req.body;

    // Check if fee structure already exists for this class and year
    const existing = await FeeStructure.findOne({ classId, academicYear });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Fee structure already exists for this class and academic year"
      });
    }

    const feeStructure = await FeeStructure.create({
      ...req.body,
      createdBy: req.user?._id || null
    });

    res.status(201).json({
      success: true,
      message: "Fee structure created successfully",
      data: feeStructure
    });

  } catch (err) {
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
};

// Get all fee structures
exports.getFeeStructures = async (req, res) => {
  try {
    const { classId, academicYear, status } = req.query;
    
    let query = {};
    if (classId) query.classId = classId;
    if (academicYear) query.academicYear = academicYear;
    if (status) query.status = status;

    const data = await FeeStructure.find(query)
      .populate("classId", "className classNumeric")
      .populate("createdBy", "name")
      .populate("updatedBy", "name")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data
    });

  } catch (err) {
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
};

// Update fee structure
exports.updateFeeStructure = async (req, res) => {
  try {
    const feeStructure = await FeeStructure.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedBy: req.user?._id || null
      },
      { new: true, runValidators: true }
    );

    if (!feeStructure) {
      return res.status(404).json({
        success: false,
        message: "Fee structure not found"
      });
    }

    res.json({
      success: true,
      message: "Fee structure updated successfully",
      data: feeStructure
    });

  } catch (err) {
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
};

// ==================== STUDENT FEE MANAGEMENT ====================

// Initialize fee for a student (when admission is approved)
exports.initializeStudentFee = async (studentId, classId, sectionId) => {
  try {
    // Get fee structure for this class
    const feeStructure = await FeeStructure.findOne({ 
      classId, 
      status: "ACTIVE" 
    });

    if (!feeStructure) {
      console.log("No fee structure found for class:", classId);
      return null;
    }

    // Calculate due date (e.g., 15th of current month)
    const dueDate = new Date();
    dueDate.setDate(15);
    if (dueDate < new Date()) {
      dueDate.setMonth(dueDate.getMonth() + 1);
    }

    // Create fee record for student
    const fee = await Fee.create({
      studentId,
      classId,
      sectionId,
      totalFees: feeStructure.totalFee,
      paidAmount: 0,
      dueAmount: feeStructure.totalFee,
      dueDate,
      feeStructureId: feeStructure._id,
      academicYear: feeStructure.academicYear
    });

    return fee;

  } catch (err) {
    console.error("Error initializing student fee:", err);
    throw err;
  }
};

// Get all fees with filters
exports.getFees = async (req, res) => {
  try {
    const { 
      classId, 
      sectionId, 
      status, 
      studentId,
      fromDate,
      toDate,
      search 
    } = req.query;
    
    let query = {};
    
    if (classId) query.classId = classId;
    if (sectionId) query.sectionId = sectionId;
    if (status) query.status = status;
    if (studentId) query.studentId = studentId;
    
    if (fromDate || toDate) {
      query.dueDate = {};
      if (fromDate) query.dueDate.$gte = new Date(fromDate);
      if (toDate) query.dueDate.$lte = new Date(toDate);
    }

    // Search by student name if provided
    let studentIds = [];
    if (search) {
      const students = await Student.find({
        name: { $regex: search, $options: 'i' }
      }).select('_id');
      studentIds = students.map(s => s._id);
      query.studentId = { $in: studentIds };
    }

    const data = await Fee.find(query)
      .populate("studentId", "name studentId rollNo")
      .populate("classId", "className classNumeric")
      .populate("sectionId", "sectionName")
      .populate("feeStructureId")
      .populate("payments")
      .sort({ dueDate: 1 });

    // Get statistics
    const stats = {
      totalFees: await Fee.aggregate([
        { $group: { _id: null, total: { $sum: "$totalFees" } } }
      ]).then(r => r[0]?.total || 0),
      
      totalPaid: await Fee.aggregate([
        { $group: { _id: null, total: { $sum: "$paidAmount" } } }
      ]).then(r => r[0]?.total || 0),
      
      totalDue: await Fee.aggregate([
        { $group: { _id: null, total: { $sum: "$dueAmount" } } }
      ]).then(r => r[0]?.total || 0),
      
      paidCount: await Fee.countDocuments({ status: "PAID" }),
      partialCount: await Fee.countDocuments({ status: "PARTIAL" }),
      pendingCount: await Fee.countDocuments({ status: "PENDING" }),
      overdueCount: await Fee.countDocuments({ status: "OVERDUE" })
    };

    res.json({
      success: true,
      data,
      stats
    });

  } catch (err) {
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
};

// Get student fee details
exports.getStudentFee = async (req, res) => {
  try {
    const { studentId } = req.params;

    const fee = await Fee.findOne({ studentId })
      .populate("studentId", "name studentId rollNo fatherName motherName phone")
      .populate("classId", "className classNumeric")
      .populate("sectionId", "sectionName")
      .populate("feeStructureId")
      .populate({
        path: "payments",
        options: { sort: { paymentDate: -1 } }
      });

    if (!fee) {
      return res.status(404).json({
        success: false,
        message: "Fee record not found for this student"
      });
    }

    res.json({
      success: true,
      data: fee
    });

  } catch (err) {
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
};

// ==================== FEE PAYMENT MANAGEMENT ====================

// Record a payment
// Record a payment
exports.recordPayment = async (req, res) => {
  try {
    const { feeId } = req.params;
    const paymentData = req.body;

    const fee = await Fee.findById(feeId);
    if (!fee) {
      return res.status(404).json({
        success: false,
        message: "Fee record not found"
      });
    }

    // Calculate current due amount properly
    const currentDueAmount = fee.totalFees - fee.paidAmount;
    
    console.log('Payment check:', {
      feeId,
      totalFees: fee.totalFees,
      paidAmount: fee.paidAmount,
      dueAmount: fee.dueAmount,
      calculatedDue: currentDueAmount,
      paymentAmount: paymentData.amount
    });

    // Check if payment amount is valid using calculated due
    if (paymentData.amount > currentDueAmount) {
      return res.status(400).json({
        success: false,
        message: `Payment amount (${paymentData.amount}) exceeds due amount (${currentDueAmount})`
      });
    }

    // Generate receipt number
    const receiptNo = generateReceiptNo();

    // Create payment record
    const payment = await FeePayment.create({
      ...paymentData,
      feeId,
      studentId: fee.studentId,
      receiptNo,
      recordedBy: req.user?._id || null
    });

    // Update fee record
    const newPaidAmount = fee.paidAmount + paymentData.amount;
    const newDueAmount = fee.totalFees - newPaidAmount;
    
    // Determine new status
    let newStatus = fee.status;
    if (newDueAmount <= 0) {
      newStatus = "PAID";
    } else if (newPaidAmount > 0) {
      newStatus = "PARTIAL";
    }
    
    // Check if overdue
    if (newDueAmount > 0 && new Date() > fee.dueDate) {
      newStatus = "OVERDUE";
    }

    // Update fee with all fields
    fee.paidAmount = newPaidAmount;
    fee.dueAmount = newDueAmount;
    fee.status = newStatus;
    fee.payments.push(payment._id);
    
    await fee.save();

    // Populate payment with student details for receipt
    await payment.populate("studentId", "name studentId rollNo");

    res.status(201).json({
      success: true,
      message: "Payment recorded successfully",
      data: {
        fee,
        payment
      }
    });

  } catch (err) {
    console.error('Record payment error:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
};


// Get all payments with filters
exports.getPayments = async (req, res) => {
  try {
    const { 
      studentId, 
      classId, 
      sectionId,
      fromDate, 
      toDate, 
      paymentMode,
      status 
    } = req.query;
    
    let query = {};
    
    if (studentId) query.studentId = studentId;
    if (paymentMode) query.paymentMode = paymentMode;
    if (status) query.status = status;
    
    if (fromDate || toDate) {
      query.paymentDate = {};
      if (fromDate) query.paymentDate.$gte = new Date(fromDate);
      if (toDate) query.paymentDate.$lte = new Date(toDate);
    }

    // If class/section filter applied, get students first
    if (classId || sectionId) {
      const studentQuery = {};
      if (classId) studentQuery.classId = classId;
      if (sectionId) studentQuery.sectionId = sectionId;
      
      const students = await Student.find(studentQuery).select('_id');
      query.studentId = { $in: students.map(s => s._id) };
    }

    const data = await FeePayment.find(query)
      .populate("studentId", "name studentId rollNo")
      .populate("feeId")
      .populate("recordedBy", "name")
      .sort({ paymentDate: -1 });

    // Get payment statistics
    const stats = {
      totalAmount: await FeePayment.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]).then(r => r[0]?.total || 0),
      
      todayCollection: await FeePayment.aggregate([
        { 
          $match: { 
            paymentDate: { 
              $gte: new Date().setHours(0,0,0,0),
              $lte: new Date().setHours(23,59,59,999)
            }
          }
        },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]).then(r => r[0]?.total || 0),
      
      cashCount: await FeePayment.countDocuments({ paymentMode: "CASH" }),
      onlineCount: await FeePayment.countDocuments({ paymentMode: "ONLINE" }),
      chequeCount: await FeePayment.countDocuments({ paymentMode: "CHEQUE" })
    };

    res.json({
      success: true,
      data,
      stats
    });

  } catch (err) {
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
};

// Get payment receipt
exports.getPaymentReceipt = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await FeePayment.findById(id)
      .populate("studentId", "name studentId rollNo fatherName motherName")
      .populate({
        path: "feeId",
        populate: {
          path: "classId sectionId",
          select: "className classNumeric sectionName"
        }
      })
      .populate("recordedBy", "name");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    res.json({
      success: true,
      data: payment
    });

  } catch (err) {
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
};

// ==================== REPORTS AND STATISTICS ====================

// Get fee collection report
exports.getFeeReport = async (req, res) => {
  try {
    const { fromDate, toDate, classId, sectionId } = req.query;

    let matchStage = {};
    
    if (fromDate || toDate) {
      matchStage.paymentDate = {};
      if (fromDate) matchStage.paymentDate.$gte = new Date(fromDate);
      if (toDate) matchStage.paymentDate.$lte = new Date(toDate);
    }

    // Get class-wise collection
    const classWiseCollection = await FeePayment.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: "students",
          localField: "studentId",
          foreignField: "_id",
          as: "student"
        }
      },
      { $unwind: "$student" },
      {
        $lookup: {
          from: "classes",
          localField: "student.classId",
          foreignField: "_id",
          as: "class"
        }
      },
      { $unwind: "$class" },
      {
        $group: {
          _id: "$class.className",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    // Get payment mode wise collection
    const modeWiseCollection = await FeePayment.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$paymentMode",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get daily collection for the period
    const dailyCollection = await FeePayment.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { 
            $dateToString: { format: "%Y-%m-%d", date: "$paymentDate" }
          },
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    res.json({
      success: true,
      data: {
        classWiseCollection,
        modeWiseCollection,
        dailyCollection,
        totalCollection: classWiseCollection.reduce((sum, item) => sum + item.totalAmount, 0),
        totalTransactions: classWiseCollection.reduce((sum, item) => sum + item.count, 0)
      }
    });

  } catch (err) {
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
};

// Get due fees report
exports.getDueFeesReport = async (req, res) => {
  try {
    const { classId, sectionId } = req.query;

    let query = { status: { $in: ["PENDING", "PARTIAL", "OVERDUE"] } };
    
    if (classId) query.classId = classId;
    if (sectionId) query.sectionId = sectionId;

    const dueFees = await Fee.find(query)
      .populate("studentId", "name studentId rollNo fatherName phone")
      .populate("classId", "className classNumeric")
      .populate("sectionId", "sectionName")
      .sort({ dueAmount: -1 });

    const totalDue = dueFees.reduce((sum, fee) => sum + fee.dueAmount, 0);
    const totalStudents = dueFees.length;

    res.json({
      success: true,
      data: {
        dueFees,
        summary: {
          totalDue,
          totalStudents,
          pendingCount: dueFees.filter(f => f.status === "PENDING").length,
          partialCount: dueFees.filter(f => f.status === "PARTIAL").length,
          overdueCount: dueFees.filter(f => f.status === "OVERDUE").length,
          pendingAmount: dueFees.filter(f => f.status === "PENDING").reduce((sum, f) => sum + f.dueAmount, 0),
          partialAmount: dueFees.filter(f => f.status === "PARTIAL").reduce((sum, f) => sum + f.dueAmount, 0),
          overdueAmount: dueFees.filter(f => f.status === "OVERDUE").reduce((sum, f) => sum + f.dueAmount, 0)
        }
      }
    });

  } catch (err) {
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
};