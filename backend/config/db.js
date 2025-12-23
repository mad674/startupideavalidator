const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();


class Mongodb{
    constructor(){}
    static connectDB = async () => {
        try {
            const mongoURI = process.env.MONGO_URI;
            await mongoose.connect(mongoURI, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });

            console.log('MongoDB Connected Successfully');
        } catch (error) {
            console.error('MongoDB Connection Error:', error.message);
            process.exit(1); // Stop the app if DB fails
        }
    };
}

module.exports = Mongodb;