const Idea = require('../models/Idea');
const User = require('../models/User');
const Expert = require('../models/Expert');
const fetch = require('node-fetch');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const {getRedisClient}=require('../config/redis');
dotenv.config();

class IdeaValidate{
    static validate=async(user_id, name, problem_statement, solution, target_market, business_model,team,token)=>{
        try{
            token=token.split(' ')[1];
            const user=await User.findById(user_id);
            const api=user.api;
            if(!api || api.length==0) {
                return false;
            }
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
                    business_model,
                    api: api,
                }),
                // api_key: api_key
            });
            const validateResponse = await validateidea.json();
            // console.log('validateResponse:', validateResponse);
            return validateResponse.success;
        }catch(err){
            console.error('Error in validate:', err);
            return false;
        }
    }
}
class CalculateScore extends IdeaValidate{
    constructor(){
        super();
    }
    static calculatescore=async(user_id, savedIdea, token)=> {
        try {
            token=token.split(' ')[1];
            // print("token:",token);
            // print("user_id:",user_id);
            // print("savedIdea:",savedIdea._id);
            const user=await User.findById(user_id);
            const api=user.api;
            if(!api || api.length==0) {
                return false;
            }
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
                    api: api,
                }),
                // api_key: api_key
            })
            const getscoreResponse = await getscore.json();
            if(getscoreResponse.success == false) {
                const idea=await Idea.findById(savedIdea._id);
                if(idea.score=={} || idea.score==null || Object.keys(idea.score).length === 0) {
                    await Idea.deleteOne({ _id: savedIdea._id });
                }
                return getscoreResponse.success//, getscoreResponse.response;
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
}
class SubmitIdea extends CalculateScore{
    constructor(){
        super();
    }
    static submitIdea=async (req, res, next)=> {
        try {
            const redisClient=getRedisClient();
            const { user_id, name, problem_statement, solution, target_market, business_model,team } = req.body;
            const validea=await super.validate(user_id, name, problem_statement, solution, target_market, business_model,team,req.headers.authorization);
            if (!validea) {
                return res.status(400).json({ success: false, message: 'Not a Valid startup idea' });
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
                return res.status(500).json({success: false, message: 'Failed to save idea' });    
            }
            const getscore=await super.calculatescore(user_id, savedIdea, req.headers.authorization);
            if(!getscore) {
                await Idea.deleteOne({ _id: savedIdea._id });
                return res.status(500).json({ success: false, message: 'IDEA ALREADY EXISTS' });    
            }
            // console.log('getscore:', getscore);
            // console.log('updatedIdea:', updatedIdea);
            const getuser = await User.findOne({ _id: user_id});
            if (!getuser) {
                await Idea.deleteOne({ _id: savedIdea._id });
                return res.status(404).json({success: false, message: 'User not found' });
            }
            getuser.ideas.push(idea._id.toString());
            getuser.updatedAt = new Date();
            const savedUser=await getuser.save();
            await redisClient.set(`user:${user_id}`, JSON.stringify(savedUser),{ EX: parseInt(process.env.REDIS_CACHE_EXPIRY) || 3600 });           
            res.status(200).json({ success: true, message: 'Idea Submitted',idea_id: idea._id.toString() });
        } catch (err) {
            console.error('Error in submitIdea:', err);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    };
}

class Getsuggestions{
    static getsuggestions=async(req, res, next)=> {
        try {
            const idea = await Idea.findById(req.params.idea_id);
            if (!idea) {
                return res.status(404).json({ success: false, message: 'Idea not found' });
            }
            const user=await User.findById(idea.user_id);
            const api=user.api;
            // console.log('suggestions:', api_key);
            if(!api || api.length==0) {
                return res.status(400).json({ success: false, message: 'API key not set' });
            }
            const suggestions = await fetch(`${process.env.FASTAPI_URL}/api/suggestions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'authorization': `${req.headers.authorization}`,
                },
                body: JSON.stringify({
                    user_id: idea.user_id.toString(),
                    idea_id: idea._id.toString(),
                    data: idea.data,
                    scores: idea.score,
                    api: api,
                }),
            });
            
            const suggestionResponse = await suggestions.json();
            // console.log('suggestionResponse:', suggestionResponse);
            if (suggestionResponse.success == false) {
                return res.status(400).json({ success: false, errors: suggestionResponse.error });
            }
            await Idea.updateOne(
                { _id: idea._id },
                { $set: { suggestions: suggestionResponse.suggestions } },
                { new: true }
            );
            const redisClient = getRedisClient();
            await redisClient.del(`idea:${idea._id}`);            
            res.status(200).json({success: true, message: 'Suggestions fetched successfully', suggestions: suggestionResponse.suggestions });
        } catch (err) {
            console.error('Error in getsuggestions:', err);
            next(err);
        }
    };
}

class GetFeedback{
    static getfeedback=async(req, res, next)=> {
        try {
            const idea = await Idea.findById(req.params.idea_id);
            if (!idea) {
                return res.status(404).json({ message: 'Idea not found' });
            }
            const user=await User.findById(idea.user_id);
            const api=user.api;
            if(!api || api.length==0) {
                return res.status(400).json({ success: false, message: 'API key not set' });
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
                    api:api,
                }),
                // api_key: api_key
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
            const redisClient = getRedisClient();
            await redisClient.del(`idea:${idea._id}`);            
            res.status(200).json({ success: true, message: 'Feedback fetched successfully', feedback: feedbackResponse.feedback });
        } catch (err) {
            console.error('Error in getfeedback:', err);
            next(err);
        }
    }
}

class UpdateIdea extends CalculateScore{
    constructor(){
        super();
    }
    static updateidea=async(req, res, next)=> {
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
            const existingIdeas = await Idea.find({ user_id: idea.user_id });

            // Check if any idea has the same name
            const duplicate = existingIdeas.some((i) => i.data.name === newdata.name && i._id.toString() !== idea._id.toString());

            if (duplicate) {
            return res.status(400).json({ success: false, message: 'Idea name already exists' });
            }
            // console.log('newdata:', newdata);
            const validatenewdata=await super.validate(
                idea.user_id,
                newdata.name,
                newdata.problem_statement,
                newdata.solution,
                newdata.target_market,
                newdata.business_model,
                newdata.team,
                req.headers.authorization
            )
            if(validatenewdata==false) {
                return res.status(400).json({ errors: validatenewdata.error,message:'unable to update idea ,This is not a startup idea' });
            }
            // console.log('updateding idea');
            await Idea.updateOne(
                { _id: idea._id },
                { $set: { data: newdata, updatedAt: new Date() } }
            );
            const updatedIdea = await Idea.findById(idea._id);
            const saved = await updatedIdea.save();
            // const saved=await updatedIdea.save();
            const calculateScore= await super.calculatescore(idea.user_id, saved,req.headers.authorization);
            // console.log('calculateScore:', calculateScore);
            if(!calculateScore) {
                await Idea.updateOne(
                    { _id: idea._id },
                    { $set: { score: idea.score } },
                );
                return res.status(500).json({success: false, message: 'IDEA already exists!' });    
            }
            const redisClient = getRedisClient();
            await redisClient.set(`idea:${idea._id}`, JSON.stringify(saved),{ EX: parseInt(process.env.REDIS_CACHE_EXPIRY) || 3600 });            
            // console.log('saved');
            res.status(200).json({ message: 'Idea updated successfully',success: true});
        } catch (err) {
            console.error('Error in updateidea:', err);
            next(err);
        }
    }
}

class GetIdeaById{
    static getIdeaById = async (req, res, next) => {
    try {
        const redisClient=getRedisClient();
        const cachedIdea = await redisClient.get(`idea:${req.params.idea_id}`);
        if (cachedIdea!=null) {
            return res.json({ success: true, idea: JSON.parse(cachedIdea) });
        }
        const idea = await Idea.findById(req.params.idea_id);
        if (!idea) return res.status(404).json({ success:false,message: 'Idea not found' });
        await redisClient.set(`idea:${req.params.idea_id}`, JSON.stringify(idea),{ EX: parseInt(process.env.REDIS_CACHE_EXPIRY) || 3600 });
        res.json({ success: true, idea: idea });
    } catch (err) {
        console.error('Error in getIdeaById:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
    };
}

class Getexpertchats{
    static getexpertchats=async(req, res, next)=> {
        try {
            let idea;
            const redisClient = getRedisClient();
            const idea_id=req.params.ideaid;
            const cachedIdea = await redisClient.get(`idea:${idea_id}`);
            if (cachedIdea!=null) {
                idea = JSON.parse(cachedIdea);
            } else {
                idea = await Idea.findById(idea_id);
                // const idea = await Idea.findById(req.params.ideaid);
                if (!idea) {
                    return res.status(404).json({ message: 'Idea not found' });
                }
                await redisClient.set(`idea:${idea_id}`, JSON.stringify(idea),{ EX: parseInt(process.env.REDIS_CACHE_EXPIRY) || 3600 });            
            }
            let allexpertchats = [];
            for (let i = 0; i < idea.experts.length; i++) {
                const expertId = idea.experts[i]; // extract expert ID
                let expert;
                const cachedExpert = await redisClient.get(`expert:${expertId}`);
                if (cachedExpert!=null) {
                    expert = JSON.parse(cachedExpert);
                } else {
                    expert = await Expert.findById(expertId);
                    await redisClient.set(`expert:${expertId}`, JSON.stringify(expert),{ EX: parseInt(process.env.REDIS_CACHE_EXPIRY) || 3600 });
                }
                if (expert) {
                    const chatData = expert.ideas.find(
                        (e) => e.ideaid.toString() === idea._id.toString()
                    );

                    allexpertchats.push({
                        expert_id: expert._id,
                        email: expert.email,
                        expertise: expert.expertise,
                        bio: expert.bio,
                        name: expert.name,
                        chat: chatData || null
                    });
                }
            }
            
            res.status(200).json({success: true, expertchats: allexpertchats });
        } catch (err) {
            console.error('Error in getexpertchat:', err);
            next(err);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }   
    };
}

class GetAllUserIdeas{
    static getAllUserIdeas = async (req, res, next) => {
        try {
            // 1️⃣ Find the user
            let user;   
            const redisClient=getRedisClient();
            const cachedUser = await redisClient.get(`user:${req.params.user_id}`);
            // if (cachedUser!=null) {
            //     user = JSON.parse(cachedUser);
            // }else{
                user = await User.findById(req.params.user_id);
            // }
            if (!user || !user.ideas || user.ideas.length === 0) {
                return res.status(404).json({ message: 'No ideas found for this user' });
            }
            let ideas = [];
            for(let i=0;i<user.ideas.length;i++){
                const cachedIdea = await redisClient.get(`idea:${user.ideas[i]}`);
                if (cachedIdea!=null) {
                    ideas.push(JSON.parse(cachedIdea));
                }else{
                    const idea = await Idea.findById(user.ideas[i]);
                    await redisClient.set(`idea:${idea._id}`, JSON.stringify(idea),{ EX: parseInt(process.env.REDIS_CACHE_EXPIRY) || 3600 });
                }
            }
            // 2️⃣ Fetch all ideas matching those idea_ids
            // const ideas = await Idea.find({ _id: { $in: user.ideas } });
            res.json(ideas);
        } catch (err) {
            console.error('Error in getAllUserIdeas:', err);
            next(err);
        }
    };
}

class DeleteIdea{
    static deleteIdea = async (req, res, next) => {
        try {
            const uidea = await Idea.findById(req.params.idea_id);
            if (!uidea) {
                return res.status(404).json({ message: 'Idea not found' });
            }
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

            if (!deletedIdeaResponse.success) {
                return res.status(400).json({ errors: deletedIdeaResponse.message });
            }
            // ✅ Only access user_id if idea is not null
            const user = await User.findById(idea.user_id);
            user.ideas.pull(idea._id);
            const updatedUser = await user.save(); // ✅ Needed here
            if (!idea) return res.status(404).json({ message: 'Idea not found' });
            const redisClient = getRedisClient();
            await redisClient.set(`user:${idea.user_id}`, JSON.stringify(updatedUser),{ EX: parseInt(process.env.REDIS_CACHE_EXPIRY) || 3600 });
            await redisClient.del(`idea:${req.params.idea_id}`);  
            res.json({success: true, message: 'Idea deleted successfully' });
        } catch (err) {
            console.error('Error in deleteIdea:', err);
            next(err);
        }
    };
}

class DeleteAllUserIdeas{
    static deleteAllUserIdeas = async (req, res, next) => {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
            if(req.params.user_id != decodedToken.id){
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const user = await User.findById(req.params.user_id);
            if (!user || !user.ideas || user.ideas.length === 0) {
                return res.status(404).json({success: false, message: 'No ideas found for this user' });
            }
            const deletedIdeas =await fetch(`${process.env.FASTAPI_URL}/api/delete-all-ideas`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: user._id })
            });
            const deletedIdeasResponse = await deletedIdeas.json();
            if(deletedIdeasResponse.success == false) {
                return res.status(400).json({ success: false, message: deletedIdeasResponse.message });
            }
            await Idea.deleteMany({ _id: { $in: user.ideas } });
            user.ideas = [];
            const updatedUser = await user.save();
            const redisClient = getRedisClient();
            for(let i=0;i<user.ideas.length;i++){
                await redisClient.del(`idea:${user.ideas[i]}`);  
            }
            await redisClient.set(`user:${user._id}`, JSON.stringify(updatedUser),{ EX: parseInt(process.env.REDIS_CACHE_EXPIRY) || 3600 });
            res.json({ success: true, message: 'All ideas deleted successfully' });
        } catch (err) {
            console.error('Error in deleteAllUserIdeas:', err);
            next(err);
        }
    };
}
class GetAllIdeas{
    static getAllIdeas = async (req, res, next) => {
        try {
            const ideas = await Idea.find().sort({ createdAt: -1 });
            res.json({"ideas": ideas});
        } catch (err) {
            console.error('Error fetching all ideas:', err);
            next(err);
        }
    };
}

module.exports = {
    GetAllUserIdeas,
    DeleteIdea,
    DeleteAllUserIdeas,
    GetAllIdeas,
    GetIdeaById,
    SubmitIdea,
    Getsuggestions,
    GetFeedback,
    CalculateScore,
    Getexpertchats,
    UpdateIdea
}