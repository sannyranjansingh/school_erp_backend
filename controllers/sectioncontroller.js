// controllers/section.controller.js
const Section = require("../models/Section");

exports.createSection = async (req, res) => {
  try {
    const exist = await Section.findOne({
      classId: req.body.classId,
      sectionName: req.body.sectionName,
    });

    if (exist)
      return res
        .status(400)
        .json({ success: false, message: "Section already exists" });

    const data = await Section.create(req.body);

    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getSectionsByClass = async (req, res) => {
  try {
    const data = await Section.find({
      classId: req.params.classId,
      status: "ACTIVE",
    }).sort({ sectionName: 1 });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateSection = async (req, res) => {
  try {
    const data = await Section.findByIdAndUpdate(
      req.params.id,
      req.body,
      { returnDocument: "after" }
    );

    res.json({ success: true, data });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};