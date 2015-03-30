var mongoose = require('./db');
var Schema = require('mongoose').Schema;
var fs = require('fs');
var settings = require('../callsettings.js');
var ishell = require('./shell');
var pconf = new Schema({
    confname : String,
    confid : Number,
    creater: {type:String,default:'test'},
    starttime: Date,
    endtime: Date ,
    mpwd : String,
    opwd : String,
    ipeople: [{
        username: {type:String},
        rnumber: { 
            mobile: {type:Number},
            office: {type:Number}
        },
        email: String,
        phonetype: {type: Boolean, default : true}
    }],
    autocall: {type:Boolean, default:false},
    bInfiniteConf: {type:Boolean, default:false}
});


pconf.methods.Sched = function Sched(){
    var envolved = this.ipeople;
    var confid = this.confid;
    var confname = this.confname;
    var path = settings.dpath + this.creater;
    var newStart = new Date(this.starttime.getTime()-60*1000);
    var newEnd = new Date(this.endtime.getTime()+60*1000);
    var s_month = newStart.getMonth()+1;
    var e_month = newEnd.getMonth()+1;
    var s_mins = newStart.getMinutes();
    var e_mins = newEnd.getMinutes();
    var s_hour = newStart.getHours();
    var e_hour = newEnd.getHours();
    /*if(s_mins < 0){
        s_mins = s_mins+60;
        s_hour = s_hour-1;
    }
    if(e_mins > 59){
        e_mins = e_mins - 60;
        e_hour = e_hour + 1;
    }*/
    var s_date = newStart.getDate();
    var e_date = newEnd.getDate();
    var autocall = this.autocall;
    console.log(path);
    console.log(s_month,e_month,s_mins,e_mins,s_hour,e_hour,s_date,e_date);
    if(!fs.existsSync(path)){
        fs.mkdirSync(path);
        fs.mkdirSync(path+'/autos');
        fs.mkdirSync(path+'/autos/'+this.starttime.getTime());
        fs.mkdirSync(path+'/autos/'+this.starttime.getTime()+'/peoples');
        fs.mkdirSync(path+'/nonautos');
    }else{
       if(!fs.existsSync(path+'/autos/'+this.starttime.getTime())){
            fs.mkdirSync(path+'/autos/'+this.starttime.getTime());
            fs.mkdirSync(path+'/autos/'+this.starttime.getTime()+'/peoples');
        }
       if(!fs.existsSync(path+'/nonautos')){
        fs.mkdirSync(path+'/nonautos');
       }
		
    }
    var fullpath;
    var content_add = "#!/bin/sh\r\n mysql -e \" INSERT INTO freeswitch_db.conferences (CONF_ROOM, MOD_PASSWORD, CONF_NAME, user_passwd,creater,s_time,e_time) VALUES( \'";
    var content_del = "#!/bin/sh\r\n mysql -e \" DELETE FROM freeswitch_db.conferences WHERE ";
    if(autocall){
        fullpath = path+'/autos/'+this.starttime.getTime();
        envolved.forEach(function(iuser){
            var a = fullpath+'/peoples/'+iuser.username+'.sh';
            fs.openSync(a,'w+',755);
            var prefix = "#!/bin/sh\r\n fs_cli -x \"";
            var content="";

            if(iuser.rnumber.office && iuser.rnumber.mobile && iuser.rnumber.office !=' null' && iuser.rnumber.mobile != 'null'){
                if(iuser.phonetype== true){
                    content = prefix + settings.inBoundCall_prefix + iuser.rnumber.office+ settings.fsdomain+" '"+settings.scripts+confid+ ")' \" \r\nfs_cli -x \""+settings.OutBoundCall_prefix+iuser.rnumber.mobile+" '"+settings.scripts+confid+ ")' \"";
                }else{
                    content = prefix + settings.inBoundCall_prefix+ settings.DID_prefix + iuser.rnumber.office+ settings.fsdomain+" '"+settings.scripts+confid+ ")' \" \r\nfs_cli -x \""+settings.OutBoundCall_N_prefix+iuser.rnumber.mobile+" '"+settings.scripts+confid+ ")' \"";
                }
                //content = prefix + settings.inBoundCall_prefix + iuser.rnumber.office+ settings.fsdomain+" '"+settings.scripts+confid+ ")' \" \r\nfs_cli -x \""+settings.OutBoundCall_prefix+iuser.rnumber.mobile+" '"+settings.scripts+confid+ ")' \"";
            }else if(iuser.rnumber.office && iuser.rnumber.office != 'null'){
                content = prefix + settings.inBoundCall_prefix +settings.DID_prefix+ iuser.rnumber.office+ settings.fsdomain+" '"+settings.scripts+confid+ ")' \" ";
            }else if(iuser.rnumber.mobile && iuser.rnumber.mobile != 'null'){
                if(iuser.phonetype == true){
                    content = prefix + settings.OutBoundCall_prefix + iuser.rnumber.mobile+" '"+settings.scripts+confid+ ")' \"";
                }else{
                    content = prefix + settings.OutBoundCall_N_prefix + iuser.rnumber.mobile+" '"+settings.scripts+confid+ ")' \"";
                }
                //content = prefix + settings.OutBoundCall_prefix + iuser.rnumber.mobile+" '"+settings.scripts+confid+ ")' \"";
            }
            //content = prefix + settings.inBoundCall_prefix + iuser.rnumber.office+ settings.fsdomain+" '"+settings.scripts+confid+ ")' \" \r\nfs_cli -x \""+settings.OutBoundCall_prefix+iuser.rnumber.mobile+" '"+settings.scripts+confid+ ")' \"";
            /*
            if(!iuser.phonetype) {
                content = prefix + settings.OutBoundCall_prefix + iuser.rnumber;
            }else{
                    //need to fix this to strip the DID_prefix
                content = prefix + settings.inBoundCall_prefix + iuser.rnumber.office+ settings.fsdomain+" '"+settings.scripts+confid+ ")' \" \r\nfs_cli -x \""+settings.OutBoundCall_prefix+iuser.rmumber.mobile++" '"+settings.scripts+confid+ ")' \"";
            
            }*/
            fs.writeFile(a,content,function(err){
                if(err) console.log(err);
            });
        });
    }else{
        //just add confid mpwd opwd to the mysql database
        fullpath = settings.dpath + this.creater+'/nonautos';
    }
	var addfile = fullpath+'/add_'+this.starttime.getTime()+'_'+confid+'.sh';
	var delfile = fullpath+'/del_'+this.starttime.getTime()+'_'+confid+'.sh';
    fs.openSync(addfile,'w+',755);
    fs.writeFileSync(addfile, content_add+this.confid+"\', \'"+this.mpwd+"\',\'"+this.confname+"\',\'"+this.opwd+"\',\'"+this.creater+"\',\'"+this.starttime.getTime()+"\',\'"+this.endtime.getTime()+"\');\"");   
    ishell.run("echo \""+s_mins+" "+s_hour+" "+s_date+" "+s_month+" * sh "+addfile+"\">>/var/spool/cron/root");
    if(!this.bInfiniteConf){
      fs.openSync(delfile,'w+',755);
      fs.writeFileSync(delfile,content_del+"conf_room=\'"+this.confid+"\' AND creater=\'"+this.creater+"\' AND s_time=\'"+this.starttime.getTime()+"\'\"");
      ishell.run("echo \""+e_mins+" "+e_hour+" "+e_date+" "+e_month+" * sh "+delfile+"\">>/var/spool/cron/root");
    }
    if(autocall){
        var content = "find "+fullpath + "/peoples/ -type f -exec sh {} \\;";
        var mins = s_mins + 2;
        var hour = s_hour;
        if(mins >= 60 ){
            mins -= 60;
            hour += 1;
        }
		ishell.run("echo \""+mins+" "+hour+" "+s_date+" "+month+" * "+content+"\">>/var/spool/cron/root");
    }
};

pconf.methods.Unsched = function Unsched() {
//    var confid = this.confid;
    var path = settings.dpath + this.creater;
//    var month = this.starttime.getMonth()+1;
//    var s_mins = this.starttime.getMinutes()-2;
//    var e_mins = this.endtime.getMinutes()+2;
//    var s_hour = this.starttime.getHours();
//    var e_hour = this.endtime.getHours();
//    if(s_mins < 0){
//        s_mins = s_mins+60;
//        s_hour = s_hour-1;
//    }
//    if(e_mins > 59){
//        e_mins = e_mins - 60;
//        e_hour = e_hour + 1;
//    }
//    var s_date = this.starttime.getDate();
//    var e_date = this.endtime.getDate();
    var autocall = this.autocall;
    var fullpath;
    if(autocall){
        fullpath = path+'/autos/'+this.starttime.getTime();
        var content = this.creater+'/autos/'+this.starttime.getTime();
        console.log(content);
        ishell.run("crontab -l | grep -v "+content+" | cut -d\":\" -f2 | crontab -");
	ishell.run("sh "+fullpath+"/add*.sh");
        console.log('delete files');
        ishell.run("rm -rf "+fullpath);
    }else{
        fullpath = path+'/nonautos/';
	    var addfile = this.starttime.getTime()+'_'+this.confid;
        ishell.run("crontab -l | grep -v "+addfile+" | cut -d\":\" -f2 | crontab -");
	ishell.run("sh "+fullpath+"/add_"+addfile+".sh");
        console.log('delete add+del files');
        var command = "rm -f "+fullpath+"*"+addfile+".sh";
        console.log(command);
        ishell.run(command);
    }
};
var Conf = mongoose.model('confs',pconf);
module.exports = Conf;

