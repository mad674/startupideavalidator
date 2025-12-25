const Idea = require('../models/Idea');
const User = require('../models/User');
const Expert = require('../models/Expert');
const fetch = require('node-fetch');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
dotenv.config();


class AdminValidation{
    static validateAdmin(token,secret,username){
        const decodedToken = jwt.verify(token, secret);
        if(username != decodedToken.id){
            return false;
        }
        return true;
    }
}

class AdminLogin{
    static adminlogin = async (req, res) => {
        const { username, password } = req.body;
        const adminEmail = process.env.ADMIN_NAME;
        const adminPassword = process.env.ADMIN_PASSWORD;
        if (adminEmail === username && password === adminPassword) {
            const token = jwt.sign({ id: username} , process.env.JWT_SECRET, { expiresIn: '1h' });
            res.json({ success: true, token: token , admin_id: username });
        } else {
            res.status(401).json({ success: false, message: 'Invalid admin credentials' });
        }
    };
};

class ChangeAdminPassword{
    static changeAdminPassword = async (req, res) => {
        const { username, oldPassword, newPassword } = req.body;
        const adminEmail = process.env.ADMIN_NAME;
        const adminPassword = process.env.ADMIN_PASSWORD;
        if (adminEmail === username && oldPassword === adminPassword) {
            process.env.ADMIN_PASSWORD = newPassword;
            res.json({ success: true, message: 'Admin password changed successfully' });
        } else {
            res.status(401).json({ success: false, message: 'Invalid admin credentials' });
        }
    };  
}

class GetAllIdeas{
// Get all ideas (Admin only)
    static getallideas = async (req, res) => {
        const username  = req.params.admin_id;        
        try {
            if(process.env.ADMIN_NAME!=username){
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const ideas = await Idea.find().sort({ createdAt: -1 });
            res.json({"ideas": ideas});
        } catch (err) {
            console.error('Error fetching all ideas:', err);
            next(err);
        }
    };
}

class GetAllExperts{
    static getallexpects = async (req, res) => {
        const username  = req.params.admin_id;        
        try {
            if(process.env.ADMIN_NAME!=username){
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const ideas = await Expert.find().sort({ createdAt: -1 });
            res.json({"experts": ideas});
        } catch (err) {
            console.error('Error fetching all ideas:', err);
            next(err);
        }
    };
}
class GetAllUserIdeas extends AdminValidation{
    constructor(){
        super();
    }
    // Get all ideas of a specific user (Admin only)
    static getalluserideas = async (req, res, next) => {
        const username  = req.params.admin_id;        
        const { user_id } = req.body;
        try {
            if(!super.validateAdmin(req.headers.authorization.split(' ')[1],process.env.JWT_SECRET,username)){
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const ideas = await Idea.find({ user_id: user_id }).sort({ createdAt: -1 });
            res.json({ ideas });
        } catch (err) {
            console.error('Error fetching user ideas:', err);
            next(err);
        }
    };
}

class GetAllUsers{
    static getAllUsers = async (req, res) => {
        const username  = req.params.admin_id;
        try {
            if(process.env.ADMIN_NAME!=username){
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const users = await User.find(); // Exclude sensitive fields
            res.json({ users });
        } catch (err) {
            console.error('Error fetching users:', err);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
}

class DeleteIdea extends AdminValidation{
    constructor(){
        super();
    }
    // Delete a specific idea (Admin only)
    static deleteidea = async (req, res, next) => {
        const username  = req.params.admin_id;        
        const { idea_id } = req.body;
        try {
            if(!super.validateAdmin(req.headers.authorization.split(' ')[1],process.env.JWT_SECRET,username)){
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const idea = await Idea.findByIdAndDelete(idea_id);
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
            await user.save(); // ✅ Needed here
            if (!idea) return res.status(404).json({ message: 'Idea not found' });
            res.json({success: true, message: 'Idea deleted successfully' });
        } catch (err) {
            console.error('Error deleting idea:', err);
            next(err);
        }
    };
}
class DeleteAllUserIdeas extends AdminValidation{
    constructor(){
        super();
    }
    // Delete all ideas of a specific user (Admin only)
    static deletealluserideas = async (req, res, next) => {
        const username  = req.params.admin_id;
        const { user_id } = req.body;
        try {
            if(!super.validateAdmin(req.headers.authorization.split(' ')[1],process.env.JWT_SECRET,username)){    
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const user = await User.findById(user_id);
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
            await user.save();
            res.json({ success: true, message: 'All ideas deleted successfully' });
        } catch (err) {
            console.error('Error deleting all user ideas:', err);
            next(err);
        }
    };
}
class DeleteExpert {
    static deleteExpert = async (req, res) => {
        try {
            const username= req.params.admin_id;
            const {expert_id}=req.body;
            const expertId = expert_id;
            if(username!=process.env.ADMIN_NAME){
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            // 1. Find expert
            const expert = await Expert.findById(expertId);
            if (!expert) {
            return res.status(404).json({ success: false, message: "Expert not found" });
            }

            // 2. Remove expert reference from all ideas
            await Idea.updateMany(
            { experts: expertId },
            { $pull: { experts: expertId } }  // remove expertId from experts array
            );

            // 3. Delete expert
            await Expert.findByIdAndDelete(expertId);

            res.status(200).json({ success: true, message: "Expert deleted and references removed" });
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, message: "Server error", error: err.message });
        }
    };
}

class DeleteAllIdeas {
    static deleteallideas= async (req, res, next) => {
        const username  = req.params.admin_id;
        try {
            if(process.env.ADMIN_NAME!=username){
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const users = await User.find();
            for (const user of users) {
                if(user.ideas.length > 0) {
                    const deletedIdeas = await fetch(`${process.env.FASTAPI_URL}/api/delete-all-ideas`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ user_id: user._id })
                    });
                    const deletedIdeasResponse = await deletedIdeas.json();
                    if (!deletedIdeasResponse.success) {
                        return res.status(400).json({ success: false, errors: deletedIdeasResponse.message });
                    }
                    await Idea.deleteMany({ _id: { $in: user.ideas } });
                    user.ideas = [];
                    await user.save();
                }
            }
            res.json({ success: true, message: 'All ideas deleted successfully' });
        } catch (err) {
            console.error('Error deleting all ideas:', err);
            next(err);
        }
    };
}

class DeleteUserByAdmin extends AdminValidation{
    constructor(){
        super();
    }
    static deleteUserByAdmin = async (req, res) => {
        const username  = req.params.admin_id;        
        const { user_id } = req.body;
        try {
            if(!super.validateAdmin(req.headers.authorization.split(' ')[1],process.env.JWT_SECRET,username)){
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        let user =  await User.findById(user_id);
        if (!user) {
            return res.status(404).json({success: false, message: 'No user found' });
        }
        if(user.ideas.length > 0) {
            const deletedIdeas = await fetch(`${process.env.FASTAPI_URL}/api/delete-all-ideas`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: user_id })
            });
            const deletedIdeasResponse = await deletedIdeas.json();
            if (!deletedIdeasResponse.success) {
                return res.status(400).json({ success: false, errors: deletedIdeasResponse.message });
            }
            await Idea.deleteMany({ _id: { $in: user.ideas } });
            user.ideas = [];
            await user.save();
        }
        user =await User.findByIdAndDelete(user_id);
        res.status(200).json({ success: true, message: 'User deleted successfully' });
    }
    catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }       
};
}

class DeleteAllUsers extends AdminValidation{
    constructor(){
        super();
    }
    static deleteAllUsers = async (req, res) => {
    const username  = req.params.admin_id;
    try {
        if(!super.validateAdmin(req.headers.authorization.split(' ')[1],process.env.JWT_SECRET,username)){
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const users = await User.find();
        for (const user of users) {
            if(user.ideas.length > 0) {
                const deletedIdeas = await fetch(`${process.env.FASTAPI_URL}/api/delete-all-ideas`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ user_id: user._id })
                });
                const deletedIdeasResponse = await deletedIdeas.json();
                if (!deletedIdeasResponse.success) {
                    return res.status(400).json({ success: false, errors: deletedIdeasResponse.message });
                }
                await Idea.deleteMany({ _id: { $in: user.ideas } });
                user.ideas = [];
                await user.save();
            }
            await User.findByIdAndDelete(user._id);
        }
        res.status(200).json({ success: true, message: 'All users deleted successfully' });
    } catch (err) {
        console.error('Error deleting all users:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
    };
}
class DeleteAllExpert extends AdminValidation{
    constructor(){
        super();
    }
    static deleteAllExpert = async (req, res) => {
        const username  = req.params.admin_id;
        try {
            if(!super.validateAdmin(req.headers.authorization.split(' ')[1],process.env.JWT_SECRET,username)){
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
        const experts = await Expert.find();
        for (const expert of experts) {
            await Idea.updateMany(
                  { experts: expert._id },
                  { $pull: { experts: expert._id } }  // remove expertId from experts array
                );
            await Expert.findByIdAndDelete(expert._id);
        }
        res.status(200).json({ success: true, message: 'All experts deleted successfully' });
    } catch (err) {
        console.error('Error deleting all experts:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
}

module.exports = { 
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
};