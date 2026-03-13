require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const connectDB=require("./config/db")

const user = require("./routes/authroutes");
const classroutes = require("./routes/classroutes")
const admissionRoutes = require("./routes/admissionroutes")

const app = express();
app.use(cors());
app.use(express.json());
connectDB();


app.use("/api/auth", user);
app.use("/api/classsection", classroutes);
app.use("/api/admissions", admissionRoutes);
// Add this line with other routes
app.use('/api/fees', require('./routes/feeRoutes'));

app.listen(5000, () => {
  console.log("Server running on port 5000");
});