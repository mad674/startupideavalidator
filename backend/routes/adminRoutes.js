const express = require('express');
const router = express.Router();
const { 
    AdminLogin,
    ChangeAdminPassword,
    GetAllIdeas,
    GetAllUsers,
    GetAllUserIdeas,
    DeleteIdea,
    DeleteAllUserIdeas,
    DeleteExpert,
    DeleteAllIdeas,
    DeleteUserByAdmin,
    DeleteAllUsers,
    GetAllExperts,
    DeleteAllExpert
}= require('../controllers/adminController');


router.post('/deleteuser/:admin_id', DeleteUserByAdmin.deleteUserByAdmin);
router.post('/adminlogin', AdminLogin.adminlogin);
router.post('/adminchangepassword', ChangeAdminPassword.changeAdminPassword );
router.post("/alluserideas/:admin_id", GetAllUserIdeas.getalluserideas);
router.post("/deleteidea/:admin_id", DeleteIdea.deleteidea);
router.post("/deletealluserideas/:admin_id", DeleteAllUserIdeas.deletealluserideas);
router.post('/deleteExpert/:admin_id', DeleteExpert.deleteExpert);

router.get('/allusers/:admin_id', GetAllUsers.getAllUsers);
router.get('/allexperts/:admin_id', GetAllExperts.getallexpects);
router.get("/allideas/:admin_id", GetAllIdeas.getallideas);


router.delete('/deleteallideas/:admin_id',DeleteAllIdeas.deleteallideas);
router.delete('/deleteallusers/:admin_id', DeleteAllUsers.deleteAllUsers);
router.delete('/deleteAllExpert/:admin_id', DeleteAllExpert.deleteAllExpert);

module.exports = router;
