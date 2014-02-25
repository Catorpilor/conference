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
    console.log(req.body.did,req.body.fs,req.body.icall,req.body.ocall,req.ip);
    var fstream = fs.createWriteStream(__dirname+'/callsettings.js', {flags: 'w'});
    fstream.on('drain',function(){
        console.log('drain start');
    });
    var obj={};
    obj.DID_prefix = req.body.did;
    obj.inBoundCall = req.body.icall;
    obj.OutBoundCall = req.body.ocall;
    obj.inBoundCall_prefix = 'bgapi originate {origination_caller_id_name=Conference,ignore_early_media=true}'+req.body.icall;
    obj.OutBoundCall_prefix = 'bgapi originate {origination_caller_id_name=Conference,ignore_early_media=true}'+req.body.ocall;
    obj.OutBoundCall_N_prefix = 'bgapi originate {origination_caller_id_name=Conference,ignore_early_media=true}'+req.body.ocall+'0';
    obj.dpath='/tmp/lconf/';
    obj.fsdomain = '@'+req.body.fs;
    obj.domain = req.body.fs;
    obj.scripts = '&javascript(fs_conf_ivr_withconfid.js ';
    obj.lcity = req.body.local_city;
    var contents = 'module.exports = ';
    contents += JSON.stringify(obj);
    console.log(contents);
    fstream.write(contents);
    res.redirect('/');
});

app.listen(3051);


