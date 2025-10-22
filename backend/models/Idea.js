const mongoose = require('mongoose');

const ideaSchema = new mongoose.Schema({
    user_id: {type:String, required: true, unique: false},
    // idea_id: { type: String, required: true, unique: true },
    data:{
        name: { type: String, required: true,default: 'Not Available' },
        problem_statement: { type: String, required: true,default: 'Not Available' },
        solution: { type: String, required: true,default: 'Not Available' },
        target_market: { type: String, required: true,default: 'Not Available' },
        team: { type: String, required: true,default: 'Not Available' },
        business_model: { type: String, required: true,default: 'Not Available' },
    },// uniqueness: { type: tring, required: true },
    score: {type:Object,default: {}},
    suggestions: {type:Object,default: {}},
    feedback: {type:Object,default: {}},
    experts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Expert' }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date,default: null }, 
}, { timestamps: true });

module.exports = mongoose.model('Idea', ideaSchema);
