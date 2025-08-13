const express = require('express');
const router = express.Router();
const { register, login, getAllUsers, getUserDetails, updateUserDetails, deleteUser } = require('../controllers/userController');
// const User = require('../models/User');

router.post('/register', register);
router.post('/login', login);
router.get('/allusers', getAllUsers);
router.get('/getuserdetails/:user_id', getUserDetails);
router.put('/updateuserdetails/:user_id', updateUserDetails);
router.delete('/deleteuser/:user_id', deleteUser);

module.exports = router;
