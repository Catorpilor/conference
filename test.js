
var getmac = require('getmac');
var crypto = require('crypto');

//var md5 = crypto.createHash('md5');
//console.log(md5);
//
//getmac.getMac(function(err,macAddress){
//    if(err) throw err;
//   // console.log(macAddress);
//    console.log('90:FB:A6:1C:49:A9');
//    var b64f = md5.update('90:FB:A6:1C:49:A9').digest('base64');
//    console.log(b64f);
//});

function md5(str){
    var md5sum = crypto.createHash('md5');
    md5sum.update(str);
    str = md5sum.digest('hex');
    return str;
};

var a = new Date('2014-04-30 00:00:00');
var b = new Date('2014-04-30 17:40:00');
console.log(a.getTime(), b.getTime());

console.log(md5('00:0C:29:B4:C5:72'+ a.getTime()+ b.getTime()));
/*
var fs = require('fs');
var contents = "module.exports =";
var obj = {
    DID_prefix: '5934',
    fsdomain: '@172.16.1.100',
};
contents += JSON.stringify(obj);
console.log(contents);
var stream = fs.createWriteStream(__dirname+"/test.txt");
stream.write(contents);
stream.on('drain',function(){
    console.log('start drain');
});

*/
/*
var test = require('./config.js');
console.log(test.maxmemcount);
var s = new Buffer(test.maxmemcount,'base64');
console.log(s.toString());
var t = new Date(1378897800000);
console.log(t);

var fs = require('fs'),
    csv = require('csv');

var contacts = require('./modules/contacts.js');
var ldir = '/tmp/lconf/';
contacts.findOne({'username':'Renxishan'},'contacts',function(err,result){
    if(err){
        console.log(err);
    }
    console.log(result.contacts.length);
    var fstrem = fs.createWriteStream(ldir+'Renxishan/renxishan.csv',{flag:'r+',encoding:'utf8',mode:0666});
    fstrem.on('drain',function(){
        console.log('drain');
    });
    var contacts = result.contacts;
    var contents = '姓名,手机,座机,邮箱,地点\n';
    for(var i =0; i<contacts.length;++i){
        contents += contacts[i].cname+','+contacts[i].cinfo.mobile+','+contacts[i].cinfo.office+','+contacts[i].cemail+','+(contacts[i].ctype===true ? '本地':'外地')+'\n';
    }
    console.log(contents);
    fstrem.write(contents);

});
*/
/*
var fs = require('fs');
var csv = require('csv');

csv()
.from.stream(fs.createReadStream(__dirname+'/contacts2.csv'))
.to.array(function(data, count) {
    console.log(count);
    console.log(data[0]);
    console.log(data[0][0]);
    var lastLine = data.slice(-1)[0];
    console.log(lastLine);
});


var app = require('express').createServer(),
    //io = require('socket.io').listen(app),
    spawn = require('child_process').spawn;

app.listen(8180);
app.get('/', function (req, res) {
    res.sendfile(__dirname + '/index.html');
});
var com = spawn('dstat', ['-cm', '--nocolor']);
com.stdout.on('data', function(data){
    //console.log(data);
    var txt = new Buffer(data).toString('utf8', 0, data.length);
    //console.log(txt);
    var a = txt.split('|');
    console.log(a[1]);
    //console.log(100-parseInt(a[0].split(' ')[2]));
    //console.log(a[1].split(' '));
    //console.log(txt.split('|')[0].split(' '));
    //console.log(txt.split('  ')[2]);
    //console.log(100 - parseInt(txt.split('  ')[2]));
});
*/
