var mongoose = require('./db');
var Schema = require('mongoose').Schema;



var gcontacts = new Schema({
    cname: String,
    cinfo: {
        mobile: {type:Number,default:13800138000},
        office: {type:Number,default:1000}
        },
    cemail: String,
    ctype: Boolean,
    clocate: String
});


var GlobalContacts = mongoose.model('gcontacts',gcontacts);

module.exports = GlobalContacts;

/*
puser.methods.Get = function(name,callback){
    User.findOne({'username':name}, 'username email password Contact_info', function(err, user){
        if(err) callback(err,null);
        var iuser = {
            pname: user.username,
            pemail: user.email,
            pwd: user.password,
            cinfo: user.Contact_info
        };
        callback(iuser);
    });
};
*/
