var mongoose = require('./db');
var Schema = require('mongoose').Schema;





var puser = new Schema({
    username : String,
    rname:String,
    email: String,
    password: String ,
    img: {
        headerimg: {type:String,default:'/images/avatar.png'},
        disimg:    {type:String,default:'/images/crop.png'}
    },
    Contact_info: {
		mobile: {type:Number, default:13800138000},
        office: {type:Number, default:59349000}
    },
    pLocate: {type:String,default:'北京'},
    Rconf:[{
        conf_id: Number,
        confname: String,
        n_pwd: String,
        m_pwd: String,
        start_time: Date,
        end_time:  Date,
        paticpants: [],
        auto_call: Boolean,
        record_path: String,
        c_status: {type:Boolean, default:false}}],
    Rhistory: Array
});

var User = mongoose.model('users',puser);

module.exports = User;

