const { google } = require('googleapis');
const dotenv = require('dotenv');
dotenv.config();

class GoogleConfig {
    constructor() {
        this.clientId = process.env.GOOGLE_CLIENT_ID;
        this.clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    }

    initialize() {
        return new google.auth.OAuth2(
            this.clientId,
            this.clientSecret,
            'postmessage'
        );
    }
}


module.exports=GoogleConfig;