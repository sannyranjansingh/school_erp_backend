const express = require("express");
const router = express.Router();
const authController = require("../controllers/authcontroller");
const { protect } = require("../middleware/authmiddleware");
const { authorizeRoles } = require("../middleware/rolemiddleware");

router.post("/register", authController.register);
router.post("/login", authController.login);

router.get("/profile", protect, authController.getProfile);

// Example Role Based Route
router.get(
  "/admin-only",
  protect,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  (req, res) => {
    res.json({ message: "Welcome Admin Panel" });
  }
);

module.exports = router;