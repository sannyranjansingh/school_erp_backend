// controllers/class.controller.js
const Class = require("../models/Class");

exports.createClass = async (req, res) => {
  try {
    const exist = await Class.findOne({
      $or: [
        { className: req.body.className },
        { classNumeric: req.body.classNumeric },
      ],
    });

    if (exist)
      return res
        .status(400)
        .json({ success: false, message: "Class already exists" });

    const data = await Class.create(req.body);

    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getClasses = async (req, res) => {
  try {
    const data = await Class.find({ status: "ACTIVE" }).sort({
      classNumeric: 1,
    });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateClass = async (req, res) => {
  try {
    const data = await Class.findByIdAndUpdate(
      req.params.id,
      req.body,
      { returnDocument: "after" }
    );

    res.json({ success: true, data });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};