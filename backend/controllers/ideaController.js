const Idea = require('../models/Idea');
// const { calculateScore } = require('../utils/scoring');
const User = require('../models/User');
const fetch = require('node-fetch');
const dotenv = require('dotenv');
// const { get } = require('mongoose');
const jwt = require('jsonwebtoken');
dotenv.config();

const validate=async(user_id, name, problem_statement, solution, target_market, business_model,team,token)=>{
    try{
        token=token.split(' ')[1];
        const validateidea=await fetch(`${process.env.FASTAPI_URL}/api/validate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                user_id,
                name, 
                problem_statement, 
                solution,
                target_market,
                team,
                business_model}),
        });
        const validateResponse = await validateidea.json();
        console.log('validateResponse:', validateResponse);
        return validateResponse.success;
    }catch(err){
        console.error('Error in validate:', err);
        return false;
    }
}
const calculatescore=async(user_id, savedIdea, token)=> {
    try {
        token=token.split(' ')[1];
        // print("token:",token);
        // print("user_id:",user_id);
        // print("savedIdea:",savedIdea._id);
        const getscore=await fetch(`${process.env.FASTAPI_URL}/api/getscore`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                user_id: user_id,
                idea_id: savedIdea._id,
                data: savedIdea.data,
            }),
        })
        const getscoreResponse = await getscore.json();
        if(getscoreResponse.success == false) {
            await Idea.deleteOne({ _id: savedIdea._id });
            return getscoreResponse.success;
            // return res.status(400).json({ message: getscoreResponse.response});
        }
        // console.log('getscore.scores:', getscoreResponse);
        // const updatedIdea=await Idea.updateOne({ _id: savedIdea._id }, { $set: { score: getscore.scores} });
        // await updatedIdea.save();
        const updatedIdea = await Idea.findByIdAndUpdate(
            savedIdea._id,
            { $set: { score: getscoreResponse.scores } },
            { new: true }
        );
        await updatedIdea.save();
        return getscoreResponse.success;
    }catch (err) {
        console.error('Error in submitIdea:', err);
        return false;
    }
}

const submitIdea=async (req, res, next)=> {
    try {
        const { user_id, name, problem_statement, solution, target_market, business_model,team } = req.body;
        const validea=await validate(user_id, name, problem_statement, solution, target_market, business_model,team,req.headers.authorization);
        if (!validea) {
            return res.status(400).json({ message: 'Not a Valid startup idea' });
        }  
        const data={
                name: name,
                problem_statement:  problem_statement,
                solution: solution,
                target_market: target_market,
                team: team,
                business_model: business_model,
        }
        const existingIdeas = await Idea.find({ user_id: user_id }); 
        for (let i = 0; i < existingIdeas.length; i++) {
            const ideas = existingIdeas[i].data;
            if (
                ideas.name.trim().toLowerCase() === data.name.trim().toLowerCase() &&
                ideas.problem_statement.trim().toLowerCase() === data.problem_statement.trim().toLowerCase() &&
                ideas.solution.trim().toLowerCase() === data.solution.trim().toLowerCase() &&
                ideas.target_market.trim().toLowerCase() === data.target_market.trim().toLowerCase() &&
                ideas.business_model.trim().toLowerCase() === data.business_model.trim().toLowerCase()
            ) {
                return res.status(400).json({ message: 'Similar idea already exists' });
            }
        }
        const idea = new Idea({
            user_id: user_id,
            // idea_id: validateResponse.idea_id,
            data:data,
            // score: validateResponse.scores,
            // suggestions: validateResponse.suggestions,
            createdAt: new Date(),
        });
        const savedIdea = await idea.save();
        if (!savedIdea) {
            return res.status(500).json({ message: 'Failed to save idea' });    
        }
        const getscore=await calculatescore(user_id, savedIdea, req.headers.authorization);
        if(!getscore) {
            return res.status(500).json({ message: 'Failed to calculate score' });    
        }
        // console.log('getscore:', getscore);
        // console.log('updatedIdea:', updatedIdea);
        const getuser = await User.findOne({ _id: user_id});
        if (!getuser) {
            return res.status(404).json({ message: 'User not found' });
        }
        getuser.ideas.push(idea._id.toString());
        getuser.updatedAt = new Date();
        await getuser.save();
        res.status(200).json({ success: true, message: 'Idea Submitted',idea_id: idea._id.toString() });
    } catch (err) {
        console.error('Error in submitIdea:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const getsuggestions=async(req, res, next)=> {
    try {
        const idea = await Idea.findById(req.params.idea_id);
        if (!idea) {
            return res.status(404).json({ success: false, message: 'Idea not found' });
        }
        const suggestions = await fetch(`${process.env.FASTAPI_URL}/api/suggestions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'authorization': `${req.headers.authorization}`,
            },
            body: JSON.stringify({
                user_id: idea.user_id,
                idea_id: idea._id,
                data: idea.data,
                scores: idea.score,
            }),
        });
        // console.log('suggestions:', suggestions);
        const suggestionResponse = await suggestions.json();
        console.log('suggestionResponse:', suggestionResponse);
        if (suggestionResponse.success == false) {
            return res.status(400).json({ success: false, errors: suggestionResponse.error });
        }
        await Idea.updateOne(
            { _id: idea._id },
            { $set: { suggestions: suggestionResponse.suggestions } },
            { new: true }
        );

        res.status(200).json({success: true, message: 'Suggestions fetched successfully', suggestions: suggestionResponse.suggestions });
    } catch (err) {
        console.error('Error in getsuggestions:', err);
        next(err);
    }
};

const getfeedback=async(req, res, next)=> {
    try {
        const idea = await Idea.findById(req.params.idea_id);
        if (!idea) {
            return res.status(404).json({ message: 'Idea not found' });
        }
        const feedback =await fetch(`${process.env.FASTAPI_URL}/api/feedback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'authorization': `${req.headers.authorization}`
            },
            body: JSON.stringify({
                user_id: idea.user_id,
                idea_id: idea._id,
                data: idea.data,
                scores: idea.score,
            }),
        });
        const feedbackResponse = await feedback.json();
        if (feedbackResponse.success==false) {
            return res.status(400).json({ errors: feedbackResponse.error });
        }
        await Idea.updateOne(
            { _id: idea._id },
            { $set: { feedback: feedbackResponse.feedback } },
            { new: true }
        );
        res.status(200).json({ success: true, message: 'Feedback fetched successfully', feedback: feedbackResponse.feedback });
    } catch (err) {
        console.error('Error in getfeedback:', err);
        next(err);
    }
}

const updateidea=async(req, res, next)=> {
    try {
        const idea = await Idea.findById(req.params.idea_id);
        if (!idea) {
            return res.status(404).json({ message: 'Idea not found' });
        }
        const newdata = {
            name: req.body.data.name || idea.data.name,
            problem_statement: req.body.data.problem_statement || idea.data.problem_statement,
            solution: req.body.data.solution || idea.data.solution,
            target_market: req.body.data.target_market || idea.data.target_market,
            team: req.body.data.team || idea.data.team,
            business_model: req.body.data.business_model || idea.data.business_model,
        };
        const validatenewdata=await validate(
            idea.user_id,
            newdata.name,
            newdata.problem_statement,
            newdata.solution,
            newdata.target_market,
            newdata.business_model,
            newdata.team,
            req.headers.authorization
        )
        if(validatenewdata.success==false) {
            return res.status(400).json({ errors: validatenewdata.error,message:'unable to update idea ,This is not a startup idea' });
        }
        await Idea.updateOne(
            { _id: idea._id },
            { $set: { data: newdata, updatedAt: new Date() } }
        );
        const updatedIdea = await Idea.findById(idea._id);
        const saved = await updatedIdea.save();
        // const saved=await updatedIdea.save();
        const calculateScore= await calculatescore(idea.user_id, saved,req.headers.authorization);
        // console.log('calculateScore:', calculateScore);
        if(!calculateScore) {
            await Idea.updateOne(
                { _id: idea._id },
                { $set: { score: idea.score } },
            );
            return res.status(500).json({ message: 'Failed to calculate score',success:calculateScore });    
        }
        res.status(200).json({ message: 'Idea updated successfully',success: true});
    } catch (err) {
        console.error('Error in updateidea:', err);
        next(err);
    }
}

const getIdeaById = async (req, res, next) => {
  try {
    
    const idea = await Idea.findById(req.params.idea_id);
    if (!idea) return res.status(404).json({ message: 'Idea not found' });
    res.json({ success: true, idea: idea });
  } catch (err) {
    console.error('Error in getIdeaById:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};


const getAllUserIdeas = async (req, res, next) => {
    try {
        // 1️⃣ Find the user
        const user = await User.findById(req.params.user_id);
        if (!user || !user.ideas || user.ideas.length === 0) {
            return res.status(404).json({ message: 'No ideas found for this user' });
        }

        // 2️⃣ Fetch all ideas matching those idea_ids
        const ideas = await Idea.find({ _id: { $in: user.ideas } });
        res.json(ideas);
    } catch (err) {
        console.error('Error in getAllUserIdeas:', err);
        next(err);
    }
};

const deleteIdea = async (req, res, next) => {
    try {
        const idea = await Idea.findByIdAndDelete(req.params.idea_id);
        // User.updateOne({ _id: idea.user_id }, { $pull: { ideas: idea._id } });
        if (!idea) {
            return res.status(404).json({ message: 'Idea not found' });
        }

        const deletedIdea = await fetch(`${process.env.FASTAPI_URL}/api/delete-idea`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: idea.user_id, idea_id: idea._id })
        });
        const deletedIdeaResponse = await deletedIdea.json();
        if(deletedIdeaResponse.success == false) {
            return res.status(400).json({ errors: deletedIdeaResponse.error });
        }
        // ✅ Only access user_id if idea is not null
        const user = await User.findById(idea.user_id);
        user.ideas.pull(idea._id);
        await user.save(); // ✅ Needed here
        if (!idea) return res.status(404).json({ message: 'Idea not found' });
        res.json({success: true, message: 'Idea deleted successfully' });
    } catch (err) {
        console.error('Error in deleteIdea:', err);
        next(err);
    }
};

const deleteAllUserIdeas = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.user_id);
        if (!user || !user.ideas || user.ideas.length === 0) {
            return res.status(404).json({ message: 'No ideas found for this user' });
        }
        const deletedIdeas =await fetch(`${process.env.FASTAPI_URL}/api/delete-all-ideas`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: user._id })
        });
        const deletedIdeasResponse = await deletedIdeas.json();
        if(deletedIdeasResponse.success == false) {
            return res.status(400).json({ errors: deletedIdeasResponse.error });
        }
        await Idea.deleteMany({ _id: { $in: user.ideas } });
        user.ideas = [];
        await user.save();
        res.json({ message: 'All ideas deleted successfully' });
    } catch (err) {
        console.error('Error in deleteAllUserIdeas:', err);
        next(err);
    }
};

const getAllIdeas = async (req, res, next) => {
    try {
        const ideas = await Idea.find().sort({ createdAt: -1 });
        res.json({"ideas": ideas});
    } catch (err) {
        console.error('Error fetching all ideas:', err);
        next(err);
    }
};

module.exports = {updateidea, getAllIdeas,submitIdea, getIdeaById, getAllUserIdeas, getsuggestions,getfeedback, deleteIdea, deleteAllUserIdeas };
