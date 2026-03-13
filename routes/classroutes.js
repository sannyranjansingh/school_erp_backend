const express = require("express");
const router = express.Router();

const classController = require("../controllers/classcontroller");
const sectionController = require("../controllers/sectioncontroller");


// ================= CLASS ROUTES =================

// Create Class
router.post("/class/create", classController.createClass);

// Get All Classes
router.get("/class", classController.getClasses);

// Update Class
router.put("/class/:id", classController.updateClass);


// ================= SECTION ROUTES =================

// Create Section
router.post("/section/create", sectionController.createSection);

// Get Sections By Class
router.get("/section/class/:classId", sectionController.getSectionsByClass);

// Update Section
router.put("/section/:id", sectionController.updateSection);


module.exports = router;