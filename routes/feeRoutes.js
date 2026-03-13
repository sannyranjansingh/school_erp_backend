const router = require("express").Router();
const feeController = require("../controllers/feeController");

// ==================== FEE STRUCTURE ROUTES ====================
router.post("/structures", feeController.createFeeStructure);
router.get("/structures", feeController.getFeeStructures);
router.put("/structures/:id", feeController.updateFeeStructure);

// ==================== STUDENT FEE ROUTES ====================
router.get("/", feeController.getFees);
router.get("/student/:studentId", feeController.getStudentFee);

// ==================== PAYMENT ROUTES ====================
router.post("/:feeId/payments", feeController.recordPayment);
router.get("/payments", feeController.getPayments);
router.get("/payments/:id/receipt", feeController.getPaymentReceipt);

// ==================== REPORT ROUTES ====================
router.get("/reports/collection", feeController.getFeeReport);
router.get("/reports/due", feeController.getDueFeesReport);

module.exports = router;