const router = require("express").Router();
const controller = require("../controllers/admissioncontroller");

// ==================== ADMISSION ROUTES ====================
router.post("/", controller.createAdmission);
router.get("/", controller.getAdmissions);
router.put("/:id/approve", controller.approveAdmission);

// ==================== STUDENT MANAGEMENT ROUTES ====================
// Get all students with filters
router.get("/students/all", controller.getStudents);

// Get student statistics
router.get("/students/stats", controller.getStudentStats);

// Get students by class
router.get("/students/class/:classId", controller.getStudentsByClass);

// Get single student by ID
router.get("/students/:id", controller.getStudentById);

// Update student
router.put("/students/:id", controller.updateStudent);

// Delete student
router.delete("/students/:id", controller.deleteStudent);

// Transfer student
router.put("/students/:id/transfer", controller.transferStudent);

module.exports = router;