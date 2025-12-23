// backend/routes/expertRoutes.js
const express = require("express");
const router = express.Router();

const {
    ExpertRegister,
    ExpertLogin,
    ExpertGoogleLogin,
    GetExpert,
    Connectidea,
    UpdateProfile,
    GetoneExpert,
    Disconnectidea,
    DeleteMessage,
    ChatMessage,
    Getchat,
    GetAllIdeas,
    GetallExperts,
    UpdatePassword,
    DeleteExpert,
    ForgotPassword,
    ResetPasswordOtp
}= require("../controllers/expertController");


router.post("/register", ExpertRegister.register);
router.post("/login", ExpertLogin.login);
router.post("/google", ExpertGoogleLogin.GoogleLogin);
router.post("/connect/:expertId", Connectidea.connectidea);
router.post("/sendmsg/:expertId", ChatMessage);
router.post("/deleteMessage/:expertId", DeleteMessage.deleteMessage);
router.post("/forgot-password", ForgotPassword);
router.post("/reset-password-otp", ResetPasswordOtp);

router.get("/all", GetallExperts.getallExperts);
router.get("/getexpert/:ideaId", GetExpert.getExpert);
router.get("/getoneexpert/:expertId", GetoneExpert.getoneExpert);
router.get("/getchat/:expertId/:ideaId", Getchat.getchat);
router.get("/getideas/:expertId", GetAllIdeas.getAllIdeas);

router.put("/updateprofile/:expertId", UpdateProfile.updateProfile);
router.put("/changepassword/:expertId", UpdatePassword.updatePassword);

router.delete("/disconnect/:ideaId/:expertId", Disconnectidea.disconnectidea);  
router.delete("/delete/:expertId", DeleteExpert.deleteExpert);

module.exports = router;
