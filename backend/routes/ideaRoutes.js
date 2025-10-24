const express = require('express');
const router = express.Router();
const {  getexpertchats,updateidea,submitIdea, getIdeaById, getAllUserIdeas, getsuggestions, getfeedback, deleteIdea, deleteAllUserIdeas } = require('../controllers/ideaController');


router.post('/submitidea',submitIdea);
router.post('/getsuggestions/:idea_id',getsuggestions);
router.post('/getfeedback/:idea_id',getfeedback);

router.get('/getexpertchats/:ideaid',getexpertchats);
router.get('/getidea/:idea_id', getIdeaById);
router.get('/allideas/:user_id', getAllUserIdeas);

router.put('/updateidea/:idea_id', updateidea);

router.delete('/deleteidea/:idea_id',deleteIdea);
router.delete('/deletealluserideas/:user_id',deleteAllUserIdeas);

module.exports = router;
