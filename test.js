
var getmac = require('getmac');
var crypto = require('crypto');
var fs = require('fs');

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

var a = new Date('2014-12-31 00:00:00');
var b = new Date('2015-02-13 20:40:00');
console.log(a.getTime(), b.getTime());

//console.log(md5('00:0C:29:F7:45:DB'+ a.getTime()+ b.getTime()));
console.log(md5('00:E0:4C:FC:29:6B'+ a.getTime()+ b.getTime()));

var obj = {
    username:'jimmy',
    pass:'fdsafdf'
};

//fs.writeFile('./config1.js',JSON.stringify(obj),{flag:'w+'},function(err){
//    if(err) throw err;
////    var newd = JSON.parse(data);
////    console.log(newd.username);
//    console.log('saved');
//});
var cons = fs.readFileSync('./config1.js','utf8');

console.log(JSON.parse(cons));

var err = new Date('2012-12-31 22:22:22');

var e = 133;
console.log(err);
//reformat the end time
var cs = [31,28,31,30,31,30,31,31,30,31,30,31];
var tempminutes = err.getMinutes() + e;
var iHour = Math.floor(tempminutes/60);
var remMins = tempminutes%60;

console.log(iHour,remMins);

var temphours = err.getHours() + iHour;
var idate = Math.floor(temphours/24);
var remHours = temphours%24;

console.log(idate,remHours);

var tempdates = err.getDate() + idate;
var iMonth,remDate;
if(err.getMonth() == 1 && (err.getYear()+1900)%4 == 0 ){
    iMonth = Math.floor(tempdates/(cs[err.getMonth()]+1));
    remDate = tempdates%(cs[err.getMonth()]+1);
    //cs[err.getMonth()] = cs[err.getMonth()]+1;
}else{
    iMonth = Math.floor(tempdates/cs[err.getMonth()]);
    remDate = tempdates%cs[err.getMonth()];
}

console.log(tempdates,iMonth,remDate);

var tempmonth = err.getMonth() + iMonth;
var iyear = Math.floor(tempmonth/12);
var remmonth = tempmonth%12;

console.log(tempmonth,iyear,remmonth);

var tempyear = err.getYear()+iyear+1900;

err.setYear(tempyear);
err.setMonth(remmonth);
err.setDate(remDate);
err.setHours(remHours,remMins);

console.log(err);
/*
 00:0C:29:B4:C5:72
 client:00:0C:29:F1:00:DC

 00:0C:29:BB:97:6E
 00:0C:29:9D:D6:53
 00:0C:29:21:70:CF
 00:0C:29:4D:E6:9B
 00:0C:29:D1:09:2D
 00:0C:29:78:F0:D7
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
