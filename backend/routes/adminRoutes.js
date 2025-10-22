const express = require('express');
const router = express.Router();
const { getallideas,
    getallexpects,
    getalluserideas,
    deleteidea, 
    deletealluserideas,
    getAllUsers,
    deleteUserByAdmin,
    deleteAllUsers,
    deleteExpert,
    deleteAllExpert,
    adminlogin ,
    changeAdminPassword,
    deleteallideas } = require('../controllers/adminController');


router.post('/deleteuser/:admin_id', deleteUserByAdmin);
router.post('/adminlogin', adminlogin);
router.post('/adminchangepassword', changeAdminPassword );
router.post("/alluserideas/:admin_id", getalluserideas);
router.post("/deleteidea/:admin_id", deleteidea);
router.post("/deletealluserideas/:admin_id", deletealluserideas);
router.post('/deleteExpert/:admin_id', deleteExpert);

router.get('/allusers/:admin_id', getAllUsers);
router.get('/allexperts/:admin_id', getallexpects);
router.get("/allideas/:admin_id", getallideas);


router.delete('/deleteallideas/:admin_id',deleteallideas);
router.delete('/deleteallusers/:admin_id', deleteAllUsers);
router.delete('/deleteAllExpert/:admin_id', deleteAllExpert);

module.exports = router;
