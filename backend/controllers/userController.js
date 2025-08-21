const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { updateOne } = require('../models/Idea');
const Idea = require('../models/Idea');

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

module.exports = { getAllUsers, register, login, getUserDetails, updateUserDetails, deleteUser };
