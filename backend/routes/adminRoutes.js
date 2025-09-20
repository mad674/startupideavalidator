const express = require('express');
const router = express.Router();
const { getallideas, 
    getalluserideas,
    deleteidea, 
    deletealluserideas,
    getAllUsers,
    deleteUserByAdmin,
    deleteAllUsers,
    adminlogin ,
    changeAdminPassword,
    deleteallideas } = require('../controllers/adminController');

router.get('/allusers/:admin_id', getAllUsers);
router.post('/deleteuser/:admin_id', deleteUserByAdmin);
router.delete('/deleteallusers/:admin_id', deleteAllUsers);
router.post('/adminlogin', adminlogin);
router.post('/adminchangepassword', changeAdminPassword );
router.get("/allideas/:admin_id", getallideas);
router.post("/alluserideas/:admin_id", getalluserideas);
router.post("/deleteidea/:admin_id", deleteidea);
router.post("/deletealluserideas/:admin_id", deletealluserideas);
router.delete('/deleteallideas/:admin_id',deleteallideas);

module.exports = router;
