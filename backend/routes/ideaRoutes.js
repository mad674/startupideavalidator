const express = require('express');
const router = express.Router();
const {  updateidea,submitIdea, getIdeaById, getAllUserIdeas, getsuggestions, getfeedback, deleteIdea, deleteAllUserIdeas } = require('../controllers/ideaController');


router.post('/submitidea',submitIdea);
router.get('/getidea/:idea_id', getIdeaById);
router.get('/allideas/:user_id', getAllUserIdeas);
router.post('/getsuggestions/:idea_id',getsuggestions);
router.post('/getfeedback/:idea_id',getfeedback);
router.delete('/deleteidea/:idea_id',deleteIdea);
router.delete('/deletealluserideas/:user_id',deleteAllUserIdeas);
router.put('/updateidea/:idea_id', updateidea);
module.exports = router;
