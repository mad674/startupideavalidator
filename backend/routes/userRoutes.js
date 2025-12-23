const express = require('express');
const router = express.Router();

const { 
    UserAuthentication,
    UserRegister,
    UserLogin,
    UserDetails,
    CheckApiKey,
    DeleteUser,
    PasswordReset,
    ResetPassword,
    SetApiKey,
    GetUserApiKey,
    updateUserDetails
}= require('../controllers/userController');

router.post("/check_api_key/:user_id", CheckApiKey.checkApiKey);
router.post("/save_api_key/:user_id", SetApiKey.setApiKey);
router.post('/register', UserRegister.register);
router.post('/login', UserLogin.login);
router.post('/google', UserAuthentication.GoogleLogin);
router.post("/forgot-password", PasswordReset.ForgotPassword);
router.post("/reset-password-otp", ResetPassword.ResetPasswordOtp);

router.get('/getuserdetails/:user_id', UserDetails.getUserDetails);
router.get('/getuserapikey/:user_id', GetUserApiKey.getuserapikey);
router.put('/updateuserdetails/:user_id', updateUserDetails.updateUserDetails);

router.delete('/deleteuser/:user_id', DeleteUser.deleteUser);

module.exports = router;
