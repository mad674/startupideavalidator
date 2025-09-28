const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Idea = require('../models/Idea');
const { encryptApiKey, decryptApiKey } = require('../utils/encrypt');
const dotenv = require('dotenv');
const nodemailer=require("nodemailer");

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

//set api key for user
const providerUrls = {
  groq: "https://api.groq.com/openai/v1",
  openai: "https://api.openai.com/v1",
  together: "https://api.together.xyz/v1",
  fireworks: "https://api.fireworks.ai/inference/v1",
  mistral: "https://api.mistral.ai/v1",
};

// REGISTER CONTROLLER
const register = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        // console.log("Register Request Body:", req.body);

        if ( !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = new User({ email, password: hashedPassword,createdAt: new Date() });
        await user.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '1d' });

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token: token,
            user: { name: user.name, email: user.email }
        });
    } catch (err) {
        console.error('Register Error:', err.message);
        next(err);
    }
};

// LOGIN CONTROLLER
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        // console.log("Login Email:", email);
        // console.log("Login Password (raw):", password);

        const user = await User.findOne({ email });
        // console.log("User found in DB:", user);

        if (!user) {
        return res.status(400).json({ message: 'NO USER FOUND' });
        }

        // console.log("Stored Hashed Password:", user.password);

        const isMatch = await bcrypt.compare(password, user.password);
        // console.log("Password Match:", isMatch);

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials - Wrong password' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '1d' });

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token : token,
            user: { name: user.name, email: user.email }
        });
    } catch (err) {
        console.error('Login Error:', err.message);
        next(err);
    }
};


const validateApiKey = async (apikey, provider, model_name) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const baseUrl = providerUrls[provider];
    if (!baseUrl) throw new Error(`Unknown provider: ${provider}`);

    const url = `${baseUrl}/chat/completions`;
    // console.log("Validating API key against:", url);

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${decryptApiKey(apikey)}`,
      },
      body: JSON.stringify({
        model: model_name,
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 5,
      }),
      signal: controller.signal,
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Key validation failed: ${resp.status} - ${text}`);
    }

    const data = await resp.json();
    return !!data.choices;
  } catch (err) {
    if (err.name === "AbortError") console.warn("Validation timeout");
    else console.warn("Validation error:", err.message);
    return false;
  } finally {
    clearTimeout(timeout);
  }
};

const checkApiKey = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (req.params.user_id !== decodedToken.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const userId = req.params.user_id;
    const user = await User.findById(userId);

    if (!user || !user.api.apikey) {
      return res.status(404).json({ success: false, message: "API key not found" });
    }

    // validate against provider
    const isValid = await validateApiKey(user.api.apikey, user.api.provider_name, user.api.model_name);
    if (!isValid) {
      return res.status(401).json({ success: false, message: "API key expired or invalid" });
    }

    // API key is active
    return res.status(200).json({
      success: true,
      status: "valid",
      provider: user.api.provider_name,
    });
  } catch (err) {
    console.error("Check API Key Error:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
const setApiKey = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (req.params.user_id !== decodedToken.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const userId = req.params.user_id;
    const { apikey, provider_name, model_name, provider_url,temperature } = req.body;

    if (!apikey) {
      return res.status(400).json({ success: false, message: "API key required" });
    }
    const api={ 
      apikey:encryptApiKey(apikey),
      provider_name:provider_name,
      model_name:model_name,
      provider_url:provider_url,
      temperature:temperature,
    }
    console.log("Storing API details:", api);
    // validate new key
    const isValid = await validateApiKey(encryptApiKey(apikey),provider_name,model_name);
    if (!isValid) {
      return res.status(400).json({ success: false, message: `Invalid or expired API key || No access to ${model_name}` });
    }
    // save to DB
    const user = await User.findByIdAndUpdate(
      userId,
      { api: api },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "API key saved successfully",
      provider_name: provider_name,
    });
  } catch (err) {
    console.error("Set API Key Error:", err.message);
    next(err);
  }
};

const getUserDetails = async (req, res, next) => {
    try {
        const userId = req.params.user_id; // Assuming user ID is stored in req.user after authentication
        const user = await User.findById(userId).select('-password'); // Exclude password from response

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ user });
    } catch (err) {
        console.error('Get User Details Error:', err.message);
        next(err);
    }
};

const getuserapikey = async (req, res, next) => {
    try {
        const userId = req.params.user_id; 
        const token = req.headers.authorization.split(' ')[1];
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        if(req.params.user_id != decodedToken.id)
            return res.status(401).json({ success: false, message: 'Unauthorized' });// Assuming user ID is stored in req.user after authentication
        const user = await User.findById(userId).select('-password'); // Exclude password from response

        if (!user.api) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ api: user.api });
    } catch (err) {
        console.error('Get User Details Error:', err.message);
        next(err);
        }
};
const updateUserDetails = async (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        if(req.params.user_id != decodedToken.id){
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const userId = req.params.user_id; // Assuming user ID is stored in req.user after authentication
        let {password } = req.body;
        password= await bcrypt.hash(password, 10);
        const user = await User.findByIdAndUpdate(userId, {password }, { new: true },{updatedAt: new Date()});

        if (!user) {
            return res.status(404).json({success: false, message: 'User not found' });
        }
        res.status(200).json({success: true, message: 'User details updated successfully' });
    } catch (err) {
        console.error('Update User Details Error:', err.message);
        next(err);
    }
};

const deleteUser = async (req, res, next) => {
    try { // Assuming user ID is stored in req.user after authentication
        const token = req.headers.authorization.split(' ')[1];
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        if(req.params.user_id != decodedToken.id){
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        let user =  await User.findById(req.params.user_id);
        if (!user) {
            return res.status(404).json({success: false, message: 'No user found' });
        }
        if(user.ideas.length > 0) {
            const deletedIdeas = await fetch(`${process.env.FASTAPI_URL}/api/delete-all-ideas`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: req.params.user_id })
            });
            const deletedIdeasResponse = await deletedIdeas.json();
            if (!deletedIdeasResponse.success) {
                return res.status(400).json({ success: false, errors: deletedIdeasResponse.message });
            }
            await Idea.deleteMany({ _id: { $in: user.ideas } });
            user.ideas = [];
            await user.save();
        }
        user =await User.findByIdAndDelete(req.params.user_id);
        res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (err) {
        console.error('Delete User Error:', err.message);
        next(err);
    }
};

const getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        console.error('Error fetching users:', err);
        next(err);
    }
};

const ForgotPassword=async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const otp = Math.floor(1000 + Math.random() * 9000); // 4-digit OTP
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    user.otp = otp;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP to reset password for the website startup idea validator!",
      html: `<p>Your OTP is <strong>${otp}</strong>. It expires in 5 minutes.</p>`,
    });

    res.json({ success: true, message: "OTP sent to your email", userId: user._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const ResetPasswordOtp=async (req, res) => {
  const { userId, otp, newPassword } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (!user.otp || user.otpExpiresAt < new Date())
      return res.status(400).json({ success: false, message: "OTP expired" });

    if (user.otp != otp)
      return res.status(400).json({ success: false, message: "Invalid OTP" });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    user.otp = null;           // clear OTP
    user.otpExpiresAt = null;  // clear expiry
    await user.save();

    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { ResetPasswordOtp,ForgotPassword,getuserapikey,checkApiKey,setApiKey,getAllUsers, register, login, getUserDetails, updateUserDetails, deleteUser };
