const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    ideas:{
        type: [String],
        default: []
    },
    otp:Number,
    otpExpiresAt:Date,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,default: null
    }
});

module.exports = mongoose.model('User', userSchema);
