const express = require('express');
const router = express.Router();
const {
    GetAllUserIdeas,
    DeleteIdea,
    DeleteAllUserIdeas,
    GetIdeaById,
    SubmitIdea,
    Getsuggestions,
    GetFeedback,
    Getexpertchats,
    UpdateIdea
}= require('../controllers/ideaController');
const checkAIService = require('../middleware/checkAIService');

router.post('/submitidea',checkAIService,SubmitIdea.submitIdea);
router.post('/getsuggestions/:idea_id',checkAIService,Getsuggestions.getsuggestions);
router.post('/getfeedback/:idea_id',checkAIService,GetFeedback.getfeedback);

router.put('/updateidea/:idea_id',checkAIService, UpdateIdea.updateidea);

router.delete('/deleteidea/:idea_id',checkAIService, DeleteIdea.deleteIdea);
router.delete('/deletealluserideas/:user_id',checkAIService, DeleteAllUserIdeas.deleteAllUserIdeas);

router.get('/getexpertchats/:ideaid',Getexpertchats.getexpertchats);
router.get('/getidea/:idea_id', GetIdeaById.getIdeaById);
router.get('/allideas/:user_id', GetAllUserIdeas.getAllUserIdeas);

module.exports = router;
