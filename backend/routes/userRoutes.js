const express = require('express');
const router = express.Router();

const { GoogleLogin,ForgotPassword,ResetPasswordOtp,getuserapikey,checkApiKey,setApiKey,register, login, getUserDetails, updateUserDetails, deleteUser } = require('../controllers/userController');

router.post("/check_api_key/:user_id", checkApiKey);
router.post("/save_api_key/:user_id", setApiKey);
router.post('/register', register);
router.post('/login', login);
router.post('/google', GoogleLogin);
router.post("/forgot-password", ForgotPassword);
router.post("/reset-password-otp", ResetPasswordOtp);

router.get('/getuserdetails/:user_id', getUserDetails);
router.get('/getuserapikey/:user_id', getuserapikey);

router.put('/updateuserdetails/:user_id', updateUserDetails);

router.delete('/deleteuser/:user_id', deleteUser);

module.exports = router;
