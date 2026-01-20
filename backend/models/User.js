const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String
    },
    ideas:{
        type: [String],
        default: []
    },
    api:{type:Object,default: {}},
    otp:Number,
    otpExpiresAt:Date,
},{timestamps: true});

userSchema.index({ createdAt: -1, _id: -1 });

module.exports = mongoose.model('User', userSchema);
