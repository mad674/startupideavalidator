const Expert = require('../models/Expert');
const Idea = require('../models/Idea');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dotenv=require('dotenv');
const nodemailer = require("nodemailer");
const  GoogleConfig = require('../middleware/googleconfig');
const {getRedisClient} = require('../config/redis');
dotenv.config();


class ExpertRegister{
  static register = async (req, res, next) => {
      try {
          const { name,email, password, expertise, bio } = req.body;

          if (!email || !password || !name) {
              return res.status(400).json({ success:false,message: 'All required fields must be filled' });
          }

          const expertExists = await Expert.findOne({ email });
          if (expertExists) {
              return res.status(400).json({success:false, message: 'Expert already exists' });
          }

          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(password, salt);

          const expert = new Expert({
              name,
              email,
              expertise,
              bio,
              password: hashedPassword,
              createdAt: new Date()
          });
          await expert.save();

          const token = jwt.sign({ id: expert._id }, process.env.JWT_SECRET, {
              expiresIn: process.env.JWT_EXPIRE || '1d'
          });

          res.status(201).json({
              success: true,
              message: 'Expert registered successfully',
              token,
              expert: { id: expert._id, name: expert.name, email: expert.email }
          });
      } catch (err) {
          console.error('Register Expert Error:', err.message);
          next(err);
      }
  };
}
class ExpertLogin{
// ===================== LOGIN =====================
  static login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const expert = await Expert.findOne({ email });
        if (!expert) {
            return res.status(400).json({ success:false,message: 'No expert found' });
        }

        const isMatch = await bcrypt.compare(password, expert.password);
        if (!isMatch) {
            return res.status(400).json({ success:false,message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: expert._id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRE || '1d'
        });

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            expert: { id: expert._id, name: expert.name, email: expert.email }
        });
    } catch (err) {
        console.error('Login Expert Error:', err.message);
        next(err);
    }
};
}

class ExpertGoogleLogin{
  static GoogleLogin = async (req, res, next) => {
    // const { token } = req.body;
    const oauth2Client = GoogleConfig.initialize();
    try {
      const { code } = req.body; 
      const googleres = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(googleres.tokens);

    const userdata = await fetch(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${googleres.tokens.access_token}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${googleres.tokens.access_token}`
        }
    });
    const userDataJson = await userdata.json();
    const { email} = userDataJson;
    let expert = await Expert.findOne({ email });
    if (!expert) {
      res.status(200).json({ success: false, message: "Expert not found" });
      return;
    }
    // generate your own app JWT
    const appToken = jwt.sign({ id: expert._id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRE || '1d'
        });
    res.status(200).json({
        success: true,
        message: 'Login successful',
        token: appToken,
        expert: { id: expert._id, name: expert.name, email: expert.email }
    });
  } catch (err) {
    console.error(err);
    res.status(401).json({ success: false, message: "Invalid Google token" });
  }
  };
}
class GetallExperts{
  static getallExperts = async (req, res, next) => {
      try {
          const decoded = jwt.verify(req.headers.authorization.split(" ")[1], process.env.JWT_SECRET);
          if (!decoded) {
              return res.status(401).json({ success: false, message: 'Unauthorized' });
          }
          const experts = await Expert.find().select('-password');
          res.status(200).json({ success: true, experts: experts});
      } catch (err) {
          console.error('Get All Experts Error:', err.message);
          next(err);
      }   
  };
}

class GetExpert{
  static getExpert=async (req, res, next) => {
      try {
          const redisClient=getRedisClient();
          let ideas;
          ideas=await Idea.findById(req.params.ideaId);
          // const ideas=await Idea.findById(req.params.ideaId);
          if(!ideas){
              return res.status(404).json({ success: false, message: 'No idea found' });
          }
          let experts=[];
          for(let i=0;i<ideas.experts.length;i++){
              const cachedExpert=await redisClient.get(`expert:${ideas.experts[i]}`);
              if(cachedExpert!=null){
                  experts.push(JSON.parse(cachedExpert));
              }else{
                  const expert=await Expert.findById(ideas.experts[i]);
                  if(expert) {await redisClient.set(`expert:${ideas.experts[i]}`, JSON.stringify(expert),{ EX: parseInt(process.env.REDIS_CACHE_EXPIRY) || 3600 });
                  experts.push(expert)};
              }
          }
          // const experts=await Expert.find({_id:{$in:ideas.experts}}).select('-password');
          // experts.ideas=experts.ideas.filter((i)=>i.ideaid.toString()===req.params.ideaId.toString());
          if (!experts) {
              return res.status(404).json({ success: false, message: 'No expert found' });
          }
          res.status(200).json({ success: true, experts: experts });
      } catch (err) {
          console.error('Get Expert Error:', err.message);
          next(err);
      }
  };
}
class GetoneExpert{
  static getoneExpert=async (req, res, next) => {
      try {
          const {expertId}=req.params;
          if(!expertId){
              return res.status(400).json({ success: false, message: 'Expert ID is required' });
          }
          const redisClient=getRedisClient();
          let expert;
          const cachedExpert=await redisClient.get(`expert:${expertId}`);
          if(cachedExpert!=null){
              expert=JSON.parse(cachedExpert);
          }else{
              expert=await Expert.findById(expertId).select('-password');
              if(expert)await redisClient.set(`expert:${expertId}`, JSON.stringify(expert),{ EX: parseInt(process.env.REDIS_CACHE_EXPIRY) || 3600 });
          }
          // const expert=await Expert.findById(expertId).select('-password');
          if (!expert) {
              return res.status(404).json({ success: false, message: 'No expert found' });
          }
          res.status(200).json({ success: true, expert: expert });
      } catch (err) {
          console.error('Get Expert Error:', err.message);
          next(err);
      }
  };
}
class UpdateProfile{
  static updateProfile = async (req, res, next) => {
      try {
          const { expertId } = req.params;
          const { name, email, expertise, bio } = req.body;
          const expert = await Expert.findById(expertId);
          if (!expert) {
              return res.status(404).json({ success: false, message: 'Expert not found' });
          }
          expert.name = name || expert.name;
          expert.email = email || expert.email;
          expert.expertise = expertise || expert.expertise;
          expert.bio = bio || expert.bio;
          const updatedExpert = await expert.save();
          const redisClient=getRedisClient();
          await redisClient.set(`expert:${expertId}`, JSON.stringify(updatedExpert),{ EX: parseInt(process.env.REDIS_CACHE_EXPIRY) || 3600 });
          res.status(200).json({ success: true, message: 'Profile updated successfully', expert: expert });
      } catch (err) {
          console.error('Update Profile Error:', err.message);
          next(err);
      }
  };
}
class Disconnectidea{
  static disconnectidea=async (req, res, next) => {
      try {
          const expert = await Expert.findById(req.params.expertId);
          const idea = await Idea.findById(req.params.ideaId);

          if (!expert || !idea) {
              return res.status(404).json({ success: false, message: 'Expert or Idea not found' });
          }

          // Disconnect the idea from expert
          expert.ideas = expert.ideas.filter(i => i.ideaid && i.ideaid.toString() !== req.params.ideaId.toString());
          idea.experts = idea.experts.filter(eId => eId && eId.toString() !== req.params.expertId.toString());

          await expert.save();
          await idea.save();
          const redisClient=getRedisClient();
          await redisClient.del(`expert:${req.params.expertId}`);
          await redisClient.del(`idea:${req.params.ideaId}`);
          res.status(200).json({ success: true, message: 'Idea disconnected from expert successfully' });
      } catch (err) {
          console.error('Disconnect Idea Error:', err);
          res.status(500).json({ success: false, message: 'Server error' });
      }

  };
}
class Getchat{
  static getchat = async (req, res, next) => {
    try {
      const { expertId, ideaId } = req.params;
      const redisClient=getRedisClient();
      let expert;
      const cachedExpert=await redisClient.get(`expert:${expertId}`);
      if(cachedExpert!=null){
          expert=JSON.parse(cachedExpert);
      }
      else{
          expert=await Expert.findById(expertId);
          if(expert) await redisClient.set(`expert:${expertId}`, JSON.stringify(expert),{ EX: parseInt(process.env.REDIS_CACHE_EXPIRY) || 3600 });
      }
      // const expert = await Expert.findById(expertId);
      if (!expert || !ideaId) {
        return res.status(404).json({ success: false, message: "No expert found" });
      }

      // Ensure ideas is an array
      const ideasArray = Array.isArray(expert.ideas) ? expert.ideas : [];

      // Find the idea entry safely
      const ideaEntry = ideasArray.find(
        (i) => i.ideaid && i.ideaid.toString() === ideaId.toString()
      );

      if (!ideaEntry) {
        return res.status(404).json({ success: false, message: "No idea found" });
      }

      res.status(200).json({ 
        success: true,
        expert: expert,
        chatHistory: ideaEntry.chathistory || [] // default to empty array if undefined
      });

    } catch (err) {
      console.error("Get Chat Error:", err);
      return res.status(500).json({ success: false, message: "Server Error" });
    }
  };
}
class ChatMessage{
  static ChatMessage = async (req, res, next) => {
      try {
          const { expertId } = req.params;
          const { ideaId, sender, message } = req.body;

          const expert = await Expert.findById(expertId);
          if (!expert) {
              return res.status(404).json({ success: false, message: 'No expert found' });
          }

          // Find the idea entry inside expert.ideas
          const ideaEntry = expert.ideas.find(i => i.ideaid.toString() === ideaId.toString());
          if (!ideaEntry) {
              return res.status(404).json({ success: false, message: 'No idea found' });
          }
          if (ideaEntry.chathistory.length > process.env.CHAT_LIMIT) {
              // Remove the first (oldest) messages to keep only the last CHAT_LIMIT
              ideaEntry.chathistory = ideaEntry.chathistory.slice(
                  ideaEntry.chathistory.length - process.env.CHAT_LIMIT
              );
          }

          // Push message into the correct field: chathistory
          const chatMessage = {
              sender,
              message,
              timestamp: new Date()
          };
          ideaEntry.chathistory.push(chatMessage); // <-- lowercase h

          const updatedExpert = await expert.save();
          const redisClient=getRedisClient();
          await redisClient.set(`expert:${expertId}`, JSON.stringify(updatedExpert),{ EX: parseInt(process.env.REDIS_CACHE_EXPIRY) || 3600 });
          res.status(200).json({ success: true, message: 'Message added successfully', chat: chatMessage });
      } catch (err) {
          console.error('Add Chat Message Error:', err.message);
          next(err);
      }
  };
}

class DeleteMessage{
  static deleteMessage = async (req, res, next) => {
      try {
          const { expertId } = req.params;
          const { ideaId, messageId } = req.body;
          const expert = await Expert.findById(expertId);
          if (!expert) {
              return res.status(404).json({ success: false, message: 'No expert found' });
          }
          const ideaEntry = expert.ideas.find(i => i.ideaid.toString() === ideaId.toString());
          if (!ideaEntry) {
              return res.status(404).json({ success: false, message: 'No idea found' });
          }
          ideaEntry.chathistory = ideaEntry.chathistory.filter(m => m._id.toString() !== messageId.toString());
          const updatedExpert = await expert.save();
          const redisClient=getRedisClient();
          await redisClient.set(`expert:${expertId}`, JSON.stringify(updatedExpert),{ EX: parseInt(process.env.REDIS_CACHE_EXPIRY) || 3600 });
          res.status(200).json({ success: true, message: 'Message deleted successfully' });
      } catch (err) {
          console.error('Delete Message Error:', err.message);
          next(err);
      }
  };
}

class GetAllIdeas{
  // ===================== GET ALL IDEAS CONNECTED TO EXPERT =====================
  static getAllIdeas = async (req, res, next) => {
      try {
          const expertId = req.params.expertId;
          const redisClient=getRedisClient();
          const cachedExpert=await redisClient.get(`expert:${expertId}`);
          let expert;
          if(cachedExpert!=null){
              expert=JSON.parse(cachedExpert);
          }
          else{
              expert=await Expert.findById(expertId);
              if(expert) await redisClient.set(`expert:${expertId}`, JSON.stringify(expert),{ EX: parseInt(process.env.REDIS_CACHE_EXPIRY) || 3600 });
          }
          // const expert = await Expert.findById(expertId);//.populate('ideas.idea_id');
          const ideas=await Idea.find({_id:{$in:expert.ideas.map(i=>i.ideaid)}});//.populate('createdBy','name email');
          if (!expert) {
              return res.status(404).json({ message: 'Expert not found' });
          }
          res.status(200).json({ success: true, ideas: ideas });
      } catch (err) {
          console.error('Get All Ideas Error:', err.message);
          next(err);
      }
  };
}

class Connectidea{
  static connectidea = async (req, res, next) => {
    try {
      const { expertId } = req.params;
      const { ideaId } = req.body;

      const expert = await Expert.findById(expertId);
      const idea = await Idea.findById(ideaId);

      if (!expert) {
        return res.status(404).json({ success: false, message: "Expert not found" });
      }
      if (!idea) {
        return res.status(404).json({ success: false, message: "Idea not found" });
      }

      // Ensure expert.ideas exists and is an array
      if (!Array.isArray(expert.ideas)) expert.ideas = [];

      // Check if idea is already connected
      const alreadyConnected = expert.ideas.some(
        (i) => i.ideaid && i.ideaid.toString() === ideaId.toString()
      );

      if (alreadyConnected) {
        return res.status(400).json({ success: true, message: "Idea already connected to expert" });
      }

      // Push with correct field names
      expert.ideas.push({ ideaid: ideaId, chathistory: [] }); // lowercase 'chathistory'
      if (!Array.isArray(idea.experts)) idea.experts = [];
      idea.experts.push(expertId);

      await expert.save();
      await idea.save();
      const redisClient=getRedisClient();
      await redisClient.del(`expert:${expertId}`);
      await redisClient.del(`idea:${ideaId}`);
      res.status(200).json({ success: true, message: "Idea connected to expert successfully" });
    } catch (err) {
      console.error("Connect Idea Error:", err.message);
      next(err);
    }
  };
}

class UpdatePassword{
  // ===================== UPDATE PASSWORD =====================
  static updatePassword = async (req, res, next) => {
      try {
          const { expertId } = req.params;
          const { password } = req.body;

          const hashedPassword = await bcrypt.hash(password, 10);

          const expert = await Expert.findByIdAndUpdate(
              expertId,
              { password: hashedPassword, updatedAt: new Date() },
              { new: true }
          );

          if (!expert) {
              return res.status(404).json({ message: 'Expert not found' });
          }
          const redisClient=getRedisClient();
          await redisClient.set(`expert:${expertId}`, JSON.stringify(expert),{ EX: parseInt(process.env.REDIS_CACHE_EXPIRY) || 3600 });
          res.status(200).json({ success: true, message: 'Password updated successfully' });
      } catch (err) {
          console.error('Update Password Error:', err.message);
          next(err);
      }
  };
}

class DeleteExpert{
  // ===================== DELETE EXPERT =====================
  static deleteExpert = async (req, res) => {
    try {
      const { expertId } = req.params;

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
      const redisClient=getRedisClient();
      for (const idea of expert.ideas) {
        // const redisClient=getRedisClient();
        await redisClient.del('idea:' + idea.ideaid);
      }
      // 3. Delete expert
      await Expert.findByIdAndDelete(expertId);
      // const redisClient=getRedisClient();
      await redisClient.del(`expert:${expertId}`);   
      res.status(200).json({ success: true, message: "Expert deleted and references removed" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
  };
}
class ForgotPassword{
 
  static ForgotPassword=async (req, res) => {
    const { email } = req.body;
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    try {
      const user = await Expert.findOne({ email });
      if (!user) return res.status(404).json({ success: false, message: "Expert not found" });

      const otp = Math.floor(1000 + Math.random() * 9000); // 4-digit OTP
      const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

      user.otp = otp;
      user.otpExpiresAt = otpExpiresAt;
      await user.save();

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Dear Expert,Your OTP to reset password for the website startup idea validator!",
        html: `<p>Dear Expert Your OTP is <strong>${otp}</strong>. It expires in 5 minutes.</p>`,
      });
      const redisClient=getRedisClient();
      await redisClient.del(`expert:${user._id}`);
      res.json({ success: true, message: "OTP sent to your email", expertId: user._id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  };
}
class ResetPasswordOtp{
  static ResetPasswordOtp= async (req, res) => {
  const { expertId, otp, newPassword } = req.body;

  try {
    const user = await Expert.findById(expertId);
    if (!user) return res.status(404).json({ success: false, message: "Expert not found" });

    if (!user.otp || user.otpExpiresAt < new Date())
      return res.status(400).json({ success: false, message: "OTP expired" });

    if (user.otp != otp)
      return res.status(400).json({ success: false, message: "Invalid OTP" });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    user.otp = null;           // clear OTP
    user.otpExpiresAt = null; 
    user.timestamp = Date.now(); // clear expiry
    await user.save();
    const redisClient=getRedisClient();
    await redisClient.del(`expert:${expertId}`);
    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
  };
}
module.exports = {
    ExpertRegister,
    ExpertLogin,
    ExpertGoogleLogin,
    GetExpert,
    Connectidea,
    UpdateProfile,
    GetoneExpert,
    Disconnectidea,
    DeleteMessage,
    ChatMessage,
    Getchat,
    GetAllIdeas,
    GetallExperts,
    UpdatePassword,
    DeleteExpert,
    ForgotPassword,
    ResetPasswordOtp
};
