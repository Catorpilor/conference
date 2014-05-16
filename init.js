//On a new port
//to supprot basic configuration


var express = require('express')
    , fs = require('fs')
    , path = require('path')
    , os = require('os')
    , app = express()
    , ishell = require('./modules/shell');


app.use(express.bodyParser());
app.use(express.static(path.join(__dirname, 'public')));

var ipaddress;
var ifaces = os.networkInterfaces();
for(var i = 0; i<ifaces.eth0.length;++i)
{
    if(ifaces.eth0[i].family === 'IPv4')
    {
        ipaddress = ifaces.eth0[i].address;
        break;
    }
}

app.get('/',function(req,res){

    res.writeHead(200,{'Content-Type':'text/html;charset=utf-8'});
    res.write('<h1>配置成功 </h1>');
    res.end("<p>去访问<a href='http://"+ipaddress+":3050'>会议平台</a></p>");
});

app.get('/config',function(req,res){
    console.log(req.ip);
    res.sendfile(__dirname+'/public/basic_config.html');    
});

app.post('/config',function(req,res){
//    console.log(req.body.did,req.body.fs,req.body.icall,req.body.ocall,req.ip);
    var fstream = fs.createWriteStream(__dirname+'/callsettings.js', {flags: 'w'});
    fstream.on('drain',function(){
        console.log('drain start');
    });

    var obj={};
    obj.DID_prefix = req.body.did;
    if(req.body.icall !== '' && req.body.ocall !== '' && req.body.ocallnumber !== '' && req.body.fs!=='' && req.body.local_city !== ''){
        obj.inBoundCall = req.body.icall;
        obj.OutBoundCall = req.body.ocall;
        obj.inBoundCall_prefix = 'bgapi originate {origination_caller_id_name=Conference,origination_caller_id_number='+req.body.ocallnumber+',ignore_early_media=true}'+req.body.icall;
        obj.OutBoundCall_prefix = 'bgapi originate {origination_caller_id_name=Conference,origination_caller_id_number='+req.body.ocallnumber+',ignore_early_media=true}'+req.body.obound;
        obj.OutBoundCall_N_prefix = 'bgapi originate {origination_caller_id_name=Conference,origination_caller_id_number='+req.body.ocallnumber+',ignore_early_media=true}'+req.body.obound+req.body.obprefix+req.body.obNprefix;
        obj.dpath='/tmp/lconf/';
        obj.callinNum = req.body.confdid;
        obj.email = req.body.muser;
        obj.fsdomain = '@'+req.body.fs;
        obj.domain = req.body.fs;
        obj.scripts = '&javascript(fs_conf_ivr_withconfid.js ';
        obj.lcity = req.body.local_city;
        var contents = 'module.exports = ';
        contents += JSON.stringify(obj);
        console.log(contents);
        fstream.write(contents);
    }

    if(req.body.muser !== '' && req.body.mauth !== '' && req.body.mserer !== ''){
        var emailstream = fs.createWriteStream(__dirname+'/modules/emailsettings.js',{flags:'w'});
        var uinfo = {
            user:req.body.muser,
            pass:req.body.mauth
        };
        var mailconfig = {
            host: req.body.mserer,
            auth: uinfo
        };
        var mailcontents = 'var nodemailer=require(\'nodemailer\');\nmodule.exports = nodemailer.createTransport(\"SMTP\",';
        mailcontents += JSON.stringify(mailconfig);
        mailcontents += ");\n";
        console.log(mailcontents);
        emailstream.write(mailcontents);
    }


    //inbound DID settings
    if(req.body.confdid.length !== 0 ){
        var stents = "sh "+__dirname+"/../conf_config/callindid.sh "+req.body.confdid;
        console.log(stents);
        ishell.run(stents);
    }

    //sip trunk config

    if(req.body.trunk_ip !== '' && req.body.trunk_name !=='' && req.body.trunk_port !== ''){
        var trunkcontent = "sh "+__dirname+"/../conf_config/siptrunk.sh "+req.body.trunk_name+' '+req.body.trunk_ip+':'+req.body.trunk_port;
        console.log(trunkcontent);
        ishell.run(trunkcontent);
        //add acl
        var aclcontent = "sh "+__dirname+"/../conf_config/acl.sh "+req.body.trunk_ip+"/32";
        console.log(aclcontent);
        ishell.run(aclcontent);
    }
    ishell.run("mkdir -p /tmp/lconf");
    ishell.run("chkconfig --add liveneoconfd");
    ishell.run("service liveneoconfd start");


    res.redirect('/');
});

app.listen(3051);


