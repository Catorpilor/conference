var mongoose = require('./db');
var Schema = require('mongoose').Schema;



var psub = new Schema({
    cname: String,
    cinfo: {
        mobile: {type:Number,default:13800138000},
        office: {type:Number,default:1000}
        },
    cemail: String,
    ctype: Boolean,
    clocate: String
},{_id:false});

var pcontact = new Schema({
    username : String,
    contacts:[psub]
});

var Contacts = mongoose.model('contacts',pcontact);

module.exports = Contacts;

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
