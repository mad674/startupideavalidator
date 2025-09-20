const express = require('express');
const router = express.Router();
const nodemailer=require("nodemailer");
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

dotenv.config();
const { getuserapikey,checkApiKey,setApiKey,register, login, getUserDetails, updateUserDetails, deleteUser } = require('../controllers/userController');
// const User = require('../models/User');

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

router.post("/check_api_key/:user_id", checkApiKey);
router.post("/save_api_key/:user_id", setApiKey);
router.post('/register', register);
router.post('/login', login);
// router.get('/allusers', getAllUsers);
router.get('/getuserdetails/:user_id', getUserDetails);
router.get('/getuserapikey/:user_id', getuserapikey);
router.put('/updateuserdetails/:user_id', updateUserDetails);
router.delete('/deleteuser/:user_id', deleteUser);

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const otp = Math.floor(1000 + Math.random() * 9000); // 4-digit OTP
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    user.otp = otp;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP to reset password for the website startup idea validator!",
      html: `<p>Your OTP is <strong>${otp}</strong>. It expires in 5 minutes.</p>`,
    });

    res.json({ success: true, message: "OTP sent to your email", userId: user._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/reset-password-otp", async (req, res) => {
  const { userId, otp, newPassword } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (!user.otp || user.otpExpiresAt < new Date())
      return res.status(400).json({ success: false, message: "OTP expired" });

    if (user.otp != otp)
      return res.status(400).json({ success: false, message: "Invalid OTP" });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    user.otp = null;           // clear OTP
    user.otpExpiresAt = null;  // clear expiry
    await user.save();

    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
