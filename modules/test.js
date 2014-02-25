var smtpTranporter = require('./email1.js');

//var nodemailer = require('nodemailer');
//var smthTranporter = nodemailer.createTransport('sendmail');

var mailOptions = {
    from : "sysop <jiaojg@liveneo.com.cn>",
    to : "417006336@qq.com",
    subject : "取消预约会议 "+1234,
    html : "<h3> TEst 取消该会议。</h3>",

};
console.log(mailOptions);

smtpTranporter.sendMail(mailOptions,function(err,response){
    if(err) console.log(err);
    else    console.log("message sent : " + response.message);
});

