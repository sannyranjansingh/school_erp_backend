const Admission = require("../models/Admission");
const Student = require("../models/Student");
const Class = require("../models/Class");
const Section = require("../models/Section");
const Fee = require("../models/Fee"); // Import Fee model
const FeeStructure = require("../models/FeeStructure"); // Import FeeStructure model

const generateAdmissionNo = require("../utils/generateAdmissionNo");
const generateStudentId = require("../utils/generateStudentId");

// ==================== ADMISSION FUNCTIONS ====================

exports.createAdmission = async (req, res) => {
  try {
    const admissionNo = generateAdmissionNo();

    const data = await Admission.create({
      ...req.body,
      admissionNo,
      createdBy: req.user?._id || null,
    });

    res.status(201).json({
      message: "Admission created successfully",
      data,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAdmissions = async (req, res) => {
  try {
    const data = await Admission.find()
      .populate("classId", "className classNumeric")
      .populate("sectionId", "sectionName")
      .populate("createdBy", "name")
      .populate("approvedBy", "name")
      .populate("student", "name studentId rollNo") // Populate student details
      .sort({ createdAt: -1 });

    res.json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ==================== APPROVE ADMISSION WITH FEE CREATION ====================

exports.approveAdmission = async (req, res) => {
  try {
    const admission = await Admission.findById(req.params.id);

    if (!admission) {
      return res.status(404).json({ 
        success: false,
        message: "Admission not found" 
      });
    }

    if (admission.status === "APPROVED") {
      return res.status(400).json({ 
        success: false,
        message: "Already approved" 
      });
    }

    if (admission.status === "REJECTED") {
      return res.status(400).json({ 
        success: false,
        message: "Cannot approve rejected admission" 
      });
    }

    // Check if class and section are active
    const classData = await Class.findById(admission.classId);
    const sectionData = await Section.findById(admission.sectionId);

    if (!classData || classData.status !== "ACTIVE") {
      return res.status(400).json({
        success: false,
        message: "Selected class is not active"
      });
    }

    if (!sectionData || sectionData.status !== "ACTIVE") {
      return res.status(400).json({
        success: false,
        message: "Selected section is not active"
      });
    }

    // Check section capacity
    const currentStudents = await Student.countDocuments({
      classId: admission.classId,
      sectionId: admission.sectionId,
    });

    if (currentStudents >= sectionData.capacity) {
      return res.status(400).json({
        success: false,
        message: `Section capacity (${sectionData.capacity}) exceeded`
      });
    }

    // Generate roll number
    const rollNo = currentStudents + 1;

    // CREATE STUDENT
    const student = await Student.create({
      studentId: generateStudentId(),
      admissionId: admission._id,
      name: admission.name,
      fatherName: admission.fatherName,
      motherName: admission.motherName,
      dob: admission.dob,
      gender: admission.gender,
      phone: admission.phone,
      address: admission.address,
      classId: admission.classId,
      sectionId: admission.sectionId,
      rollNo,
    });

    // UPDATE ADMISSION
    admission.status = "APPROVED";
    admission.approvedBy = req.user?._id || null;
    admission.approvedAt = new Date();
    admission.student = student._id;

    await admission.save();

    // ========== CREATE FEE RECORD FOR STUDENT ==========
    try {
      // Get fee structure for this class
      const feeStructure = await FeeStructure.findOne({ 
        classId: admission.classId, 
        status: "ACTIVE" 
      });

      if (feeStructure) {
        // Calculate due date (15th of current month)
        const dueDate = new Date();
        dueDate.setDate(15);
        if (dueDate < new Date()) {
          dueDate.setMonth(dueDate.getMonth() + 1);
        }

        // Create fee record
        const fee = await Fee.create({
          studentId: student._id,
          admissionId: admission._id,
          classId: admission.classId,
          sectionId: admission.sectionId,
          totalFees: feeStructure.totalFee,
          paidAmount: 0,
          dueAmount: feeStructure.totalFee,
          status: "PENDING",
          academicYear: feeStructure.academicYear,
          dueDate: dueDate,
          feeStructureId: feeStructure._id,
          createdBy: req.user?._id || null
        });

        console.log('✅ Fee record created for student:', student.studentId);
      } else {
        console.log('⚠️ No fee structure found for class:', admission.classId);
        
        // Create default fee if no structure exists
        const dueDate = new Date();
        dueDate.setDate(15);
        if (dueDate < new Date()) {
          dueDate.setMonth(dueDate.getMonth() + 1);
        }

        await Fee.create({
          studentId: student._id,
          admissionId: admission._id,
          classId: admission.classId,
          sectionId: admission.sectionId,
          totalFees: 25000, // Default fee
          paidAmount: 0,
          dueAmount: 25000,
          status: "PENDING",
          academicYear: "2024-2025",
          dueDate: dueDate,
          createdBy: req.user?._id || null
        });
        
        console.log('✅ Default fee record created for student:', student.studentId);
      }
    } catch (feeError) {
      console.error('❌ Fee creation error:', feeError.message);
      // Don't fail the approval if fee creation fails
      // You can log this for later processing
    }

    // Return success response
    res.status(200).json({
      success: true,
      message: "Admission approved & student created successfully",
      data: {
        admission,
        student
      }
    });

  } catch (err) {
    console.error('❌ Approve admission error:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
};

// ==================== STUDENT MANAGEMENT FUNCTIONS ====================

// Get all students with filters
exports.getStudents = async (req, res) => {
  try {
    const { classId, sectionId, gender, search } = req.query;
    
    let query = {};
    
    if (classId) query.classId = classId;
    if (sectionId) query.sectionId = sectionId;
    if (gender) query.gender = gender;
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { fatherName: { $regex: search, $options: 'i' } }
      ];
    }

    const data = await Student.find(query)
      .populate("classId", "className classNumeric")
      .populate("sectionId", "sectionName")
      .populate("admissionId", "admissionNo createdAt")
      .sort({ classId: 1, sectionId: 1, rollNo: 1 });

    res.json({
      success: true,
      data
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get students by class (with optional section filter)
exports.getStudentsByClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const { sectionId } = req.query;

    let query = { classId };
    if (sectionId) {
      query.sectionId = sectionId;
    }

    const data = await Student.find(query)
      .populate("classId", "className classNumeric")
      .populate("sectionId", "sectionName")
      .populate("admissionId", "admissionNo")
      .sort({ rollNo: 1 });

    res.json({
      success: true,
      data
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get single student by ID
exports.getStudentById = async (req, res) => {
  try {
    const data = await Student.findById(req.params.id)
      .populate("classId", "className classNumeric")
      .populate("sectionId", "sectionName")
      .populate("admissionId");

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    res.json({
      success: true,
      data
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update student
exports.updateStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    // Don't allow changing class/section through this route
    if (req.body.classId || req.body.sectionId) {
      return res.status(400).json({
        success: false,
        message: "Use transfer endpoint to change class/section"
      });
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    // Also update the related admission if needed
    if (student.admissionId) {
      await Admission.findByIdAndUpdate(student.admissionId, {
        name: updatedStudent.name,
        fatherName: updatedStudent.fatherName,
        motherName: updatedStudent.motherName,
        phone: updatedStudent.phone,
        address: updatedStudent.address
      });
    }

    res.json({
      success: true,
      message: "Student updated successfully",
      data: updatedStudent
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete student
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    // Also delete related fee records
    await Fee.deleteMany({ studentId: student._id });

    // Update the related admission
    if (student.admissionId) {
      await Admission.findByIdAndUpdate(student.admissionId, {
        student: null,
        status: "PENDING"
      });
    }

    await student.deleteOne();

    res.json({
      success: true,
      message: "Student deleted successfully"
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Transfer student to another class/section
exports.transferStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { newClassId, newSectionId } = req.body;

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    // Check if new section exists and has capacity
    const newSection = await Section.findById(newSectionId);
    if (!newSection || newSection.status !== "ACTIVE") {
      return res.status(400).json({
        success: false,
        message: "Selected section is not active"
      });
    }

    const currentStudents = await Student.countDocuments({
      classId: newClassId,
      sectionId: newSectionId
    });

    if (currentStudents >= newSection.capacity) {
      return res.status(400).json({
        success: false,
        message: `Section capacity (${newSection.capacity}) exceeded`
      });
    }

    // Generate new roll number
    const newRollNo = currentStudents + 1;

    // Update student
    student.classId = newClassId;
    student.sectionId = newSectionId;
    student.rollNo = newRollNo;
    await student.save();

    // Also update fee records for this student
    await Fee.updateMany(
      { studentId: student._id },
      { 
        classId: newClassId,
        sectionId: newSectionId
      }
    );

    res.json({
      success: true,
      message: "Student transferred successfully",
      data: student
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get student statistics
exports.getStudentStats = async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    
    const boysCount = await Student.countDocuments({ gender: "MALE" });
    const girlsCount = await Student.countDocuments({ gender: "FEMALE" });
    const otherCount = await Student.countDocuments({ gender: "OTHER" });
    
    const totalClasses = await Class.countDocuments({ status: "ACTIVE" });
    const totalSections = await Section.countDocuments({ status: "ACTIVE" });

    // Get class-wise distribution
    const classWiseDistribution = await Student.aggregate([
      {
        $group: {
          _id: "$classId",
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "classes",
          localField: "_id",
          foreignField: "_id",
          as: "classInfo"
        }
      },
      {
        $project: {
          className: { $arrayElemAt: ["$classInfo.className", 0] },
          classNumeric: { $arrayElemAt: ["$classInfo.classNumeric", 0] },
          count: 1
        }
      },
      {
        $sort: { classNumeric: 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalStudents,
        totalClasses,
        totalSections,
        boysCount,
        girlsCount,
        otherCount,
        classWiseDistribution
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};