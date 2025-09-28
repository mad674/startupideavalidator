// backend/routes/expertRoutes.js
const express = require("express");
const router = express.Router();

const {
  register,
  login,
  getExpert,
  getchat,
  deleteMessage,
  updateProfile,
  getoneExpert,
  disconnectidea,
  ChatMessage,
  connectidea,
  getAllIdeas,
  getallExperts,
  updatePassword,
  deleteExpert,
  ForgotPassword,
  ResetPasswordOtp
} = require("../controllers/expertController");


router.post("/register", register);
router.post("/login", login);
router.post("/connect/:expertId", connectidea);
router.post("/sendmsg/:expertId", ChatMessage);
router.post("/deleteMessage/:expertId", deleteMessage);
router.post("/forgot-password", ForgotPassword);
router.post("/reset-password-otp", ResetPasswordOtp);

router.get("/all", getallExperts);
router.get("/getexpert/:ideaId", getExpert);
router.get("/getoneexpert/:expertId", getoneExpert);
router.get("/getchat/:expertId/:ideaId", getchat);
router.get("/getideas/:expertId", getAllIdeas);

router.put("/updateprofile/:expertId", updateProfile);
router.put("/changepassword/:expertId", updatePassword);


router.delete("/disconnect/:ideaId/:expertId", disconnectidea);
router.delete("/delete/:expertId", deleteExpert);

module.exports = router;
