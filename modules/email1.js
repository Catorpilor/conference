var nodemailer = require('nodemailer');

module.exports = nodemailer.createTransport("SMTP", {
    host : "mail.liveneo.com.cn",
    auth : { 
        user: "jiaojg@liveneo.com.cn",
        pass: "amtjimmyjiao1986"
    }
});
