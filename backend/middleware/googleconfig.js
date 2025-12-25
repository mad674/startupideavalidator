const { google } = require('googleapis');
const dotenv = require('dotenv');
dotenv.config();

class GoogleConfig {
    static initialize() {
        return new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            'postmessage'
        );
    }
}


module.exports=GoogleConfig;