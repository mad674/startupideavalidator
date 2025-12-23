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


router.post('/submitidea',SubmitIdea.submitIdea);
router.post('/getsuggestions/:idea_id',Getsuggestions.getsuggestions);
router.post('/getfeedback/:idea_id',GetFeedback.getfeedback);

router.get('/getexpertchats/:ideaid',Getexpertchats.getexpertchats);
router.get('/getidea/:idea_id', GetIdeaById.getIdeaById);
router.get('/allideas/:user_id', GetAllUserIdeas.getAllUserIdeas);
router.put('/updateidea/:idea_id', UpdateIdea.updateidea);

router.delete('/deleteidea/:idea_id', DeleteIdea.deleteIdea);
router.delete('/deletealluserideas/:user_id', DeleteAllUserIdeas.deleteAllUserIdeas);

module.exports = router;
