var nodemailer = require('nodemailer');

module.exports = nodemailer.createTransport("SMTP", {
    service : "Gmail",
    auth : { 
        user: "langtailcphengshengv@gmail.com",
        pass: "liveneo123"
    }
});
