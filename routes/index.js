
/*
 * GET home page.
 */
var crypto = require('crypto');
var fs = require('fs');
var csv = require('csv');
var url = require('url');
var gsettings = require('../globalsetting.js');
var callsettings = require('../callsettings.js');
var User = require('../modules/user.js');
var GlobalContacts = require('../modules/globalcontacts.js');
var Conf = require('../modules/rconf.js');
var ishell = require('../modules/shell.js');
var Contacts = require('../modules/contacts.js');
var smtpTranporter = require('../modules/emailsettings.js');
var parseString = require('xml2js').parseString;
var getmac = require('getmac');

module.exports = function(app) {
    app.get('/', function(req,res) {
        if(req.session.user && req.session.user.username != 'admin'){
            //check the user's Rconf status and remove the passed one
            User.findOne({'username':req.session.user.username}, 'Rconf Rhistory', function(err,users){
                if(err) {
                    req.flash('error',err);
                    return res.redirect('/');
                }
                var pindex=0;
                var pconf = users.Rconf;
                var plength = pconf.length;
                var curdate = new Date();
                var dtime = curdate.getTime();
                if(plength){

                    for(var i =0; i<plength; ++i){
                        var conf = users.Rconf[i];
                        console.log(i,conf);
                        if(conf.end_time.getTime() < curdate.getTime()){
                            users.Rhistory.push(conf);
                            users.Rconf.splice(i,1);
                            plength = users.Rconf.length;
                        }
                    }
                    users.save(function(err){
                        if(err) console.log(err);
                    });
                    //res.render('index',{ title:'朗泰会议系统',confs:users.Rconf, username:req.session.user.username, ctime:dtime});
                    //res.render('index',{title: '朗泰会议系统',confs:users.Rconf, username:req.session.user.username,ctime: dtime});
                }
                Contacts.findOne({'username':req.session.user.username},function(err,puser){
                    if(err) throw err;
                    var inum=0;
                    if(puser){
                        inum = puser.contacts.length;
                    }
                    fs.readFile(__dirname+'/../config.js','utf-8',function(err,data){
                        if(err) throw err;
                        data = JSON.parse(data);
                        var maxconf = new Buffer(data.maxconfcount,'base64');
                        maxconf = maxconf.toString();
                        res.render('index',{title: '中文会议系统',confs:users.Rconf, username:req.session.user.username,ctime: dtime,contacts:inum,maxconf: maxconf*1});
                    });
//                var config = require('../config.js');
//                var maxconf = new Buffer(config.maxconfcount,'base64');
//                maxconf = maxconf.toString();
//                res.render('index',{title: '朗泰会议系统',confs:users.Rconf, username:req.session.user.username,ctime: dtime,contacts:inum,maxconf: maxconf*1});
                });
                //res.render('index',{title: '朗泰会议系统',confs:users.Rconf, username:req.session.user.username,ctime: dtime});
            });
        }else if(req.session.user && req.session.user.username == 'admin') {
            fs.exists('/usr/src/Liveneo_conf.xml',function(exists){
                if(exists){
                    User.find({}, 'username Contact_info email', function(err,pdocs) {
                        fs.readFile(__dirname+'/../config.js','utf-8',function(err,data){
                            if(err) throw err;
                            data = JSON.parse(data);
                            var mems = new Buffer(data.maxmemcount,'base64');
                            mems = mems.toString();
                            var confs = new Buffer(data.maxconfcount,'base64');
                            confs = confs.toString();
                            res.render('padmin', {title: '管理员界面', curnum: pdocs.length-1, maxmem: mems*1, maxconfs: confs*1});
                        });
                        //var config = require('../config.js');
                        //console.log(config.maxmemcount,config.maxconfcount);
                        //var mems = new Buffer(config.maxmemcount,'base64');
                        // mems = mems.toString();
                        // var confs = new Buffer(config.maxconfcount,'base64');
                        // confs = confs.toString();
                        //res.render('padmin', {title: '管理员界面', curnum: pdocs.length-1, maxmem: mems*1, maxconfs: confs*1});
                    });
                }else{
                    res.render('upload',{title : '授权导入'});
                }
            });
        }else{
            //insert a admin user
            User.findOne({'username' : 'admin'},function(err,puser){
                if(!puser){
                    var user = new User();
                    user.username = 'admin';
                    var md5 = crypto.createHash('md5');
                    user.password = md5.update('admin').digest('base64');
                    user.email = 'langtailcphengshengv@gmail.com';
                    user.save(function(err){
                        if(err){
                            console.log(err);
                        }
                    });
                }
            });
            res.render('index', { title: '中文会议系统' });
        }

    });

    app.post('/getusers',function(req,res){
        User.find({}, 'username Contact_info email', function(err,pdocs) {
            res.send(pdocs);
        });
    });
    app.post('/getgcontacts',function(req,res){
        GlobalContacts.find({}, 'cname cinfo cemail ctype', function(err,pdocs) {
            res.send(pdocs);
        });
    });

    app.get('/u/:user/rhistory',checkLogin);
    app.get('/u/:user/rhistory',function(req,res){
        if(req.params.user === 'admin'){
            req.flash('error','不具有该功能');
            return res.redirect('/');
        }else{
            User.findOne({'username':req.params.user},'Rhistory',function(err,pdocs){
                if(err) throw err;
                res.render('conf_history',{title:'历史会议记录',hconfs: pdocs.Rhistory});
            });
        }
    });

    app.post('/deluser',function(req,res){
        console.log(req.body.username);

        User.findOne({'username': req.body.username}, function(err,pdoc) {
            console.log(pdoc);
            pdoc.remove();
            req.flash('success','删除成功');
            res.send({stat: true});
        });
    });
    app.get('/importcontacts',checkLogin);
    app.get('/importcontacts',function(req,res){
        if(req.session.user.username == 'admin'){
            res.render('importcontacts',{title: '用户导入',username: 'admin'});
        }else{
            res.render('importcontacts', {title: '联系人导入', username: req.session.user.username});
        }
    });
    app.get('/download',checkLogin);
    app.get('/download',function(req,res){
        console.log(__dirname);
        var file = '/usr/local/src/liveneo_conference/templates/contacts.csv';
        console.log(file);
        res.download(file);

    });

    app.get('/downloadrecording/:filename',checkLogin);
    app.get('/downloadrecording/:filename',function(req,res){
        // console.log(req.url);
        // var queryobject = url.parse(req.url,true).query.path;
        // console.log(queryobject);
        // res.setHeader('Content-Type','application/wav');
        // res.setHeader('Content-Disposition','attachment;filename=\"1386053220000_8991.wav\"');
        // res.sendfile(queryobject);
        console.log(req.params.filename);
        var command = "tar -zcvf "+gsettings.getRecordDir()+req.params.filename+".tar.gz "+gsettings.getRecordDir()+req.params.filename+'/';
        console.log(command);
        ishell.run(command,function() {
            res.download(gsettings.getRecordDir()+req.params.filename+".tar.gz");
        });

    });



    app.get('/importglobalcontacts',checkLogin);
    app.get('/importglobalcontacts',function(req,res){
        if(req.session.user.username !== 'admin') {
            req.flash('error','您不具备相应的权限!');
            return res.redirect('/');
        }
        res.render('importgcontacts',{title: '全局联系人导入',username: 'admin'});
    });

    app.post('/addcontact',function(req,res){
        console.log(req.body.name);
        var md5 = crypto.createHash('md5');
        User.update({'username':req.body.name},{$set:{'username':req.body.name,'email':req.body.email,'password':md5.update('123456').digest('base64'),'pLocate':req.body.locate, 'Contact_info':{'mobile':req.body.mobile,'office':req.body.office}}},{upsert:true},function(err,numeff,raw){
            if(err) throw err;
            console.log(raw);
            req.flash('success','添加成功');
            res.send(req.body);
        });
    });

    app.post('/importgolbalcontacts',checkLogin);
    app.post('/importglobalcontacts',function(req,res){
        if(req.files.icfile === undefined ){
            req.flash('error','文件为空请重新导入');
            return res.redirect('/importglobalcontacts');
        }
        var temp_path = req.files.icfile.path;
        csv()
            .from.stream(fs.createReadStream(temp_path,{encoding:'utf-8'}))
            .to.array(function(data,count){
                if(count <= 1) {
                    req.flash('error','文件为空请重新导入');
                    return res.redirect('/importglobalcontacts');
                }else{
                    var format = data.shift();
                    var basic = "姓名,手机,分机号码,邮箱,地点";
                    if(format.toString() != basic){
                        req.flash('error','文件格式不正确，请下载模版');
                        return res.redirect('/importglobalcontacts');
                    }
                    for(var i =0;i<data.length;++i){
                        var line = data[i];
                        console.log(line);
                        if(line[0] != 'null'){
                            if(line[1] == 'null') line[1] = 0;
                            if(line[2] == 'null') line[2] = 0;
                            var type = line[4] === gsettings.getLocal();
                            GlobalContacts.update({'cname':line[0]},{$set:{'cname':line[0],'cemail':line[3],'clocate':line[4],'ctype': type,'cinfo':{'mobile':line[1],'office':line[2]}}},{upsert:true},function(err,numeff,raw){
                                if(err) throw err;
                                console.log(raw);
                            });
                        }
                    }
                    req.flash('success','导入成功!');
                    res.redirect('/gcontacts');
                }
            });
    });

    app.post('/importuser',function(req,res){
        if(req.files.icfile === undefined ) {
            req.flash('error','文件为空请重新导入');
            return res.redirect('/importcontacts');
        }
        var temp_path = req.files.icfile.path;
        csv()
            .from.stream(fs.createReadStream(temp_path,{encoding: 'utf-8'}))
            .to.array(function(data,count){
                if(count <= 1){
                    //empty file
                    req.flash('error','文件为空请重新导入');
                    return res.redirect('/importcontacts');
                }else{
                    //checkformat
                    var format = data.shift();
                    var basic = "姓名,手机,分机号码,邮箱,地点";
                    //var basic = "Name,Mobile,Extension,Email,Locate";
                    if(format.toString() != basic){
                        req.flash('error','文件格式不正确，请下载模版');
                        return res.redirect('/importcontacts');
                    }
                    //formatmatched
                    if(req.session.user.username == 'admin'){
                        //getcurrent count
                        User.find({},'username',function(err,pdocs){
                            if(err) throw err;
                            var contents = fs.readFileSync(__dirname+'/../config.js','utf8');
                            var config = JSON.prase(contents);
                            var mem = new Buffer(config.maxmemcount,'base64');
                            mem = mem.toString();
                            if(pdocs.length + count - 2 > mem*1){
                                //mem count exceed
                                var cur = pdocs.length-1;
                                var maxmemcount = new Buffer(config.maxmemcount,'base64');
                                maxmemcount = maxmemcount.toString();
                                var allow = maxmemcount*1 - cur;
                                req.flash('error','用户数超出最大限制,还可导入< '+allow+'人 > 请重新导入');
                                return res.redirect('/importcontacts');
                            }else{
                                for(var i =0;i<data.length;++i){
                                    var line = data[i];
                                    console.log(line);
                                    var md5 = crypto.createHash('md5');
                                    if(line[0] != 'null'){
                                        if(line[1] == 'null') line[1] = 0;
                                        if(line[2] == 'null') line[2] = 0;
                                        User.update({'username':line[0]},{$set:{'username':line[0],'email':line[3],'password':md5.update('123456').digest('base64'),'pLocate':line[4],'img':{'headerimg':gsettings.getHeader(),'disimg': gsettings.getDis()}, 'Contact_info':{'mobile':line[1],'office':line[2]}}},{upsert:true},function(err,numeff,raw){
                                            if(err) throw err;
                                            console.log(raw);
                                        });
                                    }
                                    /*
                                     User.update({'username':req.body.name},{$set:{'username':line[0],'email':line[3],'password':md5.update('123456').digest('base64'),'pLocate':line[4], 'Contact_info':{'mobile':line[1],'office':line[2]}}},{upsert:true},function(err,numeff,raw){
                                     if(err) throw err;
                                     console.log(raw);
                                     });
                                     /*
                                     User.findOne({'email':line[3]},function(err,puser){
                                     if(err) throw err;
                                     if(puser) console.log(puser);
                                     else{
                                     var user = new User();
                                     user.username = line[0];
                                     user.email = line[3];
                                     var md5 = crypto.createHash('md5');
                                     user.password=md5.update('123456').digest('base64');
                                     user.Contact_info.mobile = line[1];
                                     user.Contact_info.office = line[2];
                                     user.pLocate = line[4];
                                     user.save(function(err){
                                     if(err) console.log(err);
                                     });
                                     }
                                     });
                                     */
                                }
                                req.flash('success','导入成功');
                                res.redirect('/');
                            }
                        });
                    }else{
                        console.log(req.session.user.username);
                        Contacts.findOne({'username':req.session.user.username},function(err,puser){
                            if(err) throw err;
                            if(!puser){
                                puser = new Contacts();
                                puser.username = req.session.user.username;
                            }

                            if(puser.contacts.length+data.length > 30){
                                //exceed
                                var cur = puser.contacts.length;
                                var allow = 30 - cur;
                                req.flash('error','用户数超出最大限制,还可导入< '+allow+'人 > 请重新导入');
                                return res.redirect('/u/'+req.session.user.username+'/importcontacts');
                            }else{
                                //import contacts;
                                var arrs=[];
                                for(var i =0; i<data.length;++i){
                                    //parse
                                    var line = data[i];
                                    var ipeople = {};
                                    ipeople.cname = line[0];
                                    var iinfo = {};
                                    if(line[1] == 'null')
                                        line[1] = 0;
                                    if(line[2] == 'null')
                                        line[2] = 0;
                                    iinfo.mobile = line[1];
                                    iinfo.office = line[2];
                                    ipeople.cinfo = iinfo;
                                    if(line[4] == 'null')
                                        line[4] = callsettings.lcity;
                                    if(line[4] == callsettings.lcity)
                                        ipeople.ctype = 1;
                                    else
                                        ipeople.ctype = 0;
                                    /*
                                     ipeople.cmobile = line[1];
                                     ipeople.coffice = line[2];
                                     */
                                    ipeople.cemail = line[3];
                                    arrs.push(ipeople);
                                }
                                console.log(arrs);
                                Contacts.update({'username':req.session.user.username},{$addToSet:{'contacts':{$each: arrs}}},{upsert:true},function(err,numeff,raw){
                                    if(err) throw err;
                                    console.log('The number of updated documents was %d', numeff);
                                    console.log('The raw response from Mongo was ', raw);
                                    req.flash('success','导入成功');
                                    res.redirect('/u/'+req.session.user.username);
                                });
                            }
                        });
                    }
                }
            });
    });

    app.post('/importmoh',function(req,res){
        console.log(req.files.icfile);
        if(req.files.icfile === undefined ){
            req.flash('error','文件不能为空');
            return res.redirect('/');
        }
        var temp_path = req.files.ifile.path;
        var target_path = '/tmp/sounds/hold_music/conf_hold.wav';
        fs.rename(temp_path,target_path,function(err){
            if(err) {
                console.log(err);
            }
            fs.unlink(temp_path,function(){
                if(err){
                    console.log(err);
                }
                req.flash('success','音乐文件上传成功');
                res.redirect('/');
            });
        });
    });

    app.post('/importlic',function(req,res){
        var temp_path = req.files.ifile.path;
        var type = req.files.ifile.type;
        var ext = type.substring(type.lastIndexOf('/')+1).toLowerCase();
        var target_path = '/usr/src/Liveneo_conf.'+ext;
        var shfile_path = '/usr/local/src/conf_config';
        fs.readFile(temp_path,function(err,data){
            if(err) throw err;
            parseString(data,function(err,result){
                var fts = result.Liveneo.License[0].Features[0].Feature;
                console.log(fts);
                var tempsig = result.Liveneo.Signature[0];
                var stime,etime;
                if( fts[2] !== undefined && fts[3] !== undefined){
                    stime = new Date(fts[2].Value[0]);
                    etime = new Date(fts[3].Value[0]);
                    if(isNaN(stime.getTime()) || isNaN(etime.getTime())){
                        //invalid Date
                        req.flash('error','授权文件时间不正确');
                        return req.redirect('/');
                    }
                    if(etime.getTime() < Date.now()){
                        req.flash('error','授权已过期请重新申请');
                        return res.redirect('/');
                    }else{
                        getmac.getMac(function(err,macaddress){
                            if(err) throw err;
                            if(md5(macaddress+stime.getTime()+etime.getTime()) == result.Liveneo.Signature[0]){
                                //var fstream = fs.createWriteStream('./config.js',{flag:'w+'});
                                var filepath = __dirname+'/../config.js';
                                console.log(filepath);
                                var obj = {};
                                var bvalue = fts[0].Value[0];
                                console.log(bvalue);
                                obj.maxmemcount = new Buffer(bvalue).toString('base64');
                                var confcountsetting = "sh "+shfile_path+'/confsetting.sh '+bvalue;
                                bvalue = fts[1].Value[0];
                                console.log(bvalue);
                                obj.maxconfcount = new Buffer(bvalue).toString('base64');
                                //var confcountsetting = "sh "+shfile_path+'/confsetting.sh '+bvalue;
                                console.log(confcountsetting);
                                ishell.run(confcountsetting);
                                var contents = JSON.stringify(obj);

                                var content = "nohup node "+shfile_path+"/Lic/licdaemon.js "+stime.getTime()+' '+etime.getTime()+' '+result.Liveneo.Signature[0]+' &';
                                ishell.run(content);
                                ishell.run("chkconfig --add licd");

                                fs.openSync(target_path,'wx+',755);
                                //remove file
                                fs.writeFile(filepath,contents,function(err){
                                    if(err) throw err;
                                    console.log('saved');
                                    fs.rename(temp_path,target_path,function(err){
                                        if(err) {
                                            console.log(err);
                                        }
                                        fs.unlink(temp_path,function(){
                                            if(err){
                                                console.log(err);
                                            }
                                            req.flash('success','导入成功');
                                            res.redirect('/');
                                        });
                                    });
                                });
                            }else{
                                req.flash('error','文件验证错误请重新导入');
                                return res.redirect('/');
                            }
                        });
                    }
                }else{
                    req.flash('error','文件验证错误请重新导入');
                    return req.redirect('/');
                }
            });
        });
    });

    app.post('/dellic',function(req,res){
        ishell.run("rm -f "+'/usr/src/Liveneo_conf.xml');

        ishell.run("rm -f /usr/local/src/liveneo_conference/config.js");
        /*
         for(var i=gsettings.getMem(); i>0;--i)
         gsettings.decrement_mem();
         for(var j = gsettings.getConf(); j>0; --j)
         gsettings.decrement_conf();
         */
        req.flash('success','授权已卸载');
        res.send({test : 123});

    });
    app.get('/reg',checkNotLogin);
    app.get('/reg', function(req,res){
        res.render('reg',{title: 'Reg'});
    });
    app.post('/reg',checkNotLogin);
    app.post('/reg',function(req,res){
        if(req.body['password'] != req.body['password-repeat']){
            req.flash('error','password mismatch');
            return res.redirect('/reg');
        }
        User.findOne({'username':req.body.username},'username',function(err,iuser){
            if(iuser){
                console.log(iuser);
                req.flash('error','User exists');
                return res.redirect('/login');
            }
            var user = new User();
            user.username = req.body.username;
            var md5 = crypto.createHash('md5');
            user.password = md5.update(req.body.password).digest('base64');
            user.email = req.body.email;
            console.log(user);
            user.save(function(err){
                if(err){
                    req.flash('error',err);
                    return res.redirect('/reg');
                }
                req.session.user = user;
                req.flash('success','Reg success');
                //reg success
                //redirect to the edit page to fullfill the user's contact info
                //for reserving the conference
                res.redirect('/u/'+req.body.username+'/edit');
            });
        });
    });

    app.post('/fetchuser',function(req,res){
        console.log(req.body.ani,req.body.type,req.session.user.username);
        var query={};
        if(req.body.type == 'mobile'){
            query = query.constructor({"Contact_info.mobile":req.body.ani});
            if(req.body.ani == req.session.user.Contact_info.mobile ) res.send(req.session.user);
        }else{
            query = query.constructor({"Contact_info.office":req.body.ani});
            if(req.body.ani == req.session.user.Contact_info.office ) res.send(req.session.user);
        }
        Contacts.findOne({'username':req.session.user.username},function(err,puser){
            if(err) throw err;
            if(puser && puser.contacts.length ){
                //for conf add member
                var bflag=false;
                var plocal = puser.contacts;
                for(var i=0;i<puser.contacts.length; ++i){
                    if(plocal[i].cinfo.mobile == req.body.ani || plocal[i].cinfo.office == req.body.ani){
                        var pdata = {};
                        pdata.username = plocal[i].cname;
                        pdata.img = {
                            headerimg: gsettings.getHeader(),
                            disimg: gsettings.getDis()
                        };
                        bflag = true;
                        console.log(pdata);
                        res.send(pdata);
                    }
                }
                console.log('test');
                if(!bflag){
                    res.send('No such user');
                }
                //res.send('No such user');

                /*
                 puser.contacts.forEach(function(iuser){
                 if(iuser.cinfo.mobile == req.body.ani || iuser.cinfo.office == req.body.ani){
                 var pdata = {};
                 pdata.username = iuser.cname;
                 pdata.img = {
                 headerimg: gsettings.getHeader(),
                 disimg: gsettings.getDis()
                 };
                 console.log(pdata);
                 res.send(pdata);
                 }
                 });
                 */
            }else{
                User.findOne(query,'username img',function(err,puser){
                    if(puser){
                        res.send(puser);
                    }else{
                        res.send('No such user');
                    }
                });
            }
        });
        /*
         User.findOne(query,'username img',function(err,puser){
         if(puser){
         res.send(puser);
         }else{
         res.send('No such user');
         }
         });
         */

    });

    app.post('/delconf',function(req,res){
        console.log(123);
        console.log(req.body.stime);
        var stime = new Date(req.body.stime*1);
        console.log(stime);
        Conf.findOne({"confid":req.body.confid,"starttime": stime, "creater" : req.body.owner},function(err,pconf){
            if(err){
                console.log(err);
            }
            var speople = pconf.ipeople;
            speople.forEach(function(puser){
                console.log(puser);
                if(puser.email){
                    var mailOptions = {
                        from : "sysop <"+callsettings.email+">",
                        to : puser.email,
                        subject : "取消预约会议 "+req.body.confid,
                        html : "<h3>"+req.body.owner+" 取消该会议。</h3>",
                    };
                    console.log(mailOptions);

                    smtpTranporter.sendMail(mailOptions,function(err,response){
                        if(err) console.log(err);
                        else    console.log("message sent : " + response.message);
                    });
                }
            });
            /*
             speople.forEach(function(involp){
             User.findOne({'username':involp.username}, "email", function(err,puser){
             var mailOptions = {
             from : "sysop <langtailcphengshengv@gmail.com>",
             to : puser.email,
             subject : "取消预约会议 "+req.body.confid,
             html : "<h3>"+req.body.owner+" 取消该会议。</h3>",
             };
             console.log(mailOptions);

             smtpTranporter.sendMail(mailOptions,function(err,response){
             if(err) console.log(err);
             else    console.log("message sent : " + response.message);
             });
             });
             });
             */
            pconf.Unsched();
            pconf.remove();

        });
        User.findOne({'username':req.body.owner},"Rconf", function(err,puser){
            if(err) {
                console.log(err);
            }
            for(var i=0; i<puser.Rconf.length;++i){
                if(puser.Rconf[i].conf_id == req.body.confid){
                    console.log('this is it');
                    puser.Rconf.splice(i,1);
                    break;
                }
            }
            puser.save(function(err){
                if(err) {
                    req.flash('error',err);
                }
                req.session.user = puser;
                console.log(req.session.user);
            });
        });
        res.send(req.body);
    });

    app.post('/u/:username/changepwd',function(req,res){
        var username = req.params.username;
        console.log(username);
        User.findOne({'username': username},'password', function(err,iuser){
            var opwd = crypto.createHash('md5').update(req.body.oripwd).digest('base64');
            var newpwd = crypto.createHash('md5').update(req.body.newpwd).digest('base64');
            if( opwd === iuser.password){
                console.log('old password matches');
                iuser.password = newpwd;
                iuser.save(function(err){
                    if(err){
                        req.flash('error',err);
                    }
                    req.flash('success','密码修改成功');
                    res.send({info: 'success'});
                });
            }else{
                //password mismatch
                req.flash('error','原始密码输入错误!');
                res.send({info: 'failed'});
            }
        });
    });

    app.post('/login',checkNotLogin);
    app.post('/login',function(req,res){
        var md5 = crypto.createHash('md5');
        var password = md5.update(req.body.password).digest('base64');
        console.log(req.body.password);
        User.findOne({'username':req.body.username},function(err,iuser){
            if(!iuser){
                req.flash('error','用户不存在请向管理员申请开通');
                return res.redirect('/');
            }
            if( iuser.password != password ){
                req.flash('error','密码错误!');
                return res.redirect('/');
            }
            fs.exists('/usr/src/Liveneo_conf.xml',function(exists){
                if(exists || req.body.username === 'admin'){
                    req.session.user = iuser;
                    req.flash('success','登录成功');
                    res.redirect("/");
                }else{
                    req.flash('error','没有授权文件，请管理员导入后再使用');
                    return res.redirect('/');
                }
            });
            /*
             req.session.user = iuser;
             req.flash('success','登录成功');
             res.redirect("/");
             */
        });
    });

    app.get('/logout',checkLogin);
    app.get('/logout',function(req,res){
        req.session.user = null;
        req.flash('success','logout');
        res.redirect('/');
    });

    app.get('/u/:user/edit',checkLogin);
    app.get('/u/:user/edit',function(req,res){
        User.findOne({'username':req.params.user},'username email Contact_info',function(err,users){
            if(err){
                return res.redirect('/');
            }
            console.log(users);
            res.render('edit',{title: '编辑用户',username:users.username, email: users.email, cinfo: users.Contact_info});
        });
    });

    app.post('/u/:user/edit',checkLogin);
    app.post('/u/:user/edit',function(req,res){

        if(!req.body.mobile || !req.body['office_num']){
            req.flash('error','联系方式不能为空');
            return res.redirect('/u/'+req.params.user+'/edit');
        }
        //update to dbs
        User.findOne({'username':req.params.user}, 'email Contact_info', function(err,puser){
            console.log(puser);

            puser.email = req.body.email;
            puser.Contact_info.mobile = req.body.mobile;
            puser.Contact_info.office = req.body.office_num;

            puser.save(function(err){
                if(err){
                    req.flash('error',err);
                    return res.redirect('/u/'+req.params.user+'/edit');
                }
                req.flash('success','修改成功');
                res.redirect('/');
            });
        });

    });

    app.get('/edit/:user/:confid/:stime',checkLogin);
    app.get('/edit/:user/:confid/:stime',function(req,res){
        User.findOne({'username':req.params.user},'Rconf', function(err,puser){
            if(err) {
                console.log(err);
                return res.redirect('/');
            }
            var pdate = new Date();
            if( pdate.getTime() + 5000 < req.params.stime) {
                console.log(req.params.confid);
                puser.Rconf.forEach(function(confs){
                    console.log(confs);
                    if(confs.conf_id == req.params.confid){
                        res.render('editconf',{title:'会议编辑',conf:confs});
                    }
                });
            }else{
                res.render('noeditconf',{title:'会议编辑'});
            }
        });
    });

    app.get('/rmeeting/:stime',checkLogin);
    app.get('/rmeeting/:stime',function(req,res){
        var contents = fs.readFileSync(__dirname+'/../config.js','utf8');
        var config = JSON.parse(contents);
        var maxconf = new Buffer(config.maxconfcount,'base64');
        maxconf = maxconf.toString();
        console.log(maxconf*1,req.session.user.Rconf);
        if(req.session.user.Rconf.length >= maxconf*1){
            req.flash('error','超出最大会议室限制请稍后预约!');
            return res.redirect('/');
        }
        Contacts.findOne({'username':req.session.user.username},function(err,puser){
            if(puser && puser.contacts.length) {
                var pcontacts=puser.contacts;
                var type=1;
                console.log(req.session.user.pLocate);
                if(req.session.user.pLocate !== callsettings.lcity )
                    type = 0;
                pcontacts.push({
                    cname: req.session.user.username,
                    cemail: req.session.user.email,
                    cinfo: {
                        mobile:req.session.user.Contact_info.mobile,
                        office:req.session.user.Contact_info.office
                    },
                    ctype:type
                });
                res.render('rmeeting',{title:'预约会议', contacts : pcontacts, bhascons : true});
            }else {
                User.find({}, 'username Contact_info email pLocate', function(err,pdocs) {
                    res.render('rmeeting', {title: '预约会议', contacts: pdocs,plocal:callsettings.lcity, bhascons: false});
                });
            }
        });
    });

    app.get('/wmeeting',checkLogin);
    app.get('/wmeeting',function(req,res){
        res.render('wmeeting',{title: '监控会议'});
    });

    app.get('/moh',function(req,res){
        res.render('importmoh',{title:'设置音乐'});
    });

    app.get('/u/:user/importcontacts',checkLogin);
    app.get('/u/:user/importcontacts',function(req,res){
        res.render('importcontacts', {title: '联系人导入', username: req.params.user});
    });

    app.get('/exportglobalcontacts',checkLogin);
    app.get('/exportglobalcontacts',function(req,res){
        if(req.session.user.username !== 'admin'){
            req.flash('error','不具备相应的权限!');
            return res.redirect('/');
        }
        GlobalContacts.find({},function(err,contacts){
            if(err) throw err;
            var fstream = fs.createWriteStream(callsettings.dpath+'gcontacts.csv',{flag:'w'});
            var contents = new Buffer('\xEF\xBB\xBF','binary')+'姓名,手机,分机号码,邮箱,地点\n';
            for(var i =0; i<contacts.length;++i){
                contents += contacts[i].cname+','+contacts[i].cinfo.mobile+','+contacts[i].cinfo.office+','+contacts[i].cemail+','+contacts[i].clocate+'\n';
            }
            fstream.write(contents,function(){
                res.download(callsettings.dpath+'gcontacts.csv');
            });
        });
    });

    app.get('/u/:user/exportcontacts',checkLogin);
    app.get('/u/:user/exportcontacts',function(req,res){

        Contacts.findOne({'username':req.params.user}, 'contacts', function(err,result){
            if(err) {
                console.log(err);
                req.flash('error',err);
                return res.redirect('/');
            }
            var fstream = fs.createWriteStream(callsettings.dpath+req.params.user+'/icontacts.csv', {flag:'w',mode:066});

            var contacts = result.contacts;
            var contents = new Buffer('\xEF\xBB\xBF','binary')+'姓名,手机,分机号码,邮箱,地点\n';
            for(var i =0; i<contacts.length;++i){
                contents += contacts[i].cname+','+contacts[i].cinfo.mobile+','+contacts[i].cinfo.office+','+contacts[i].cemail+','+(contacts[i].ctype===true ? '本地':'外地')+'\n';
            }
            fstream.write(contents,function(){
                res.download(callsettings.dpath+req.params.user+'/icontacts.csv');
            });
            console.log(callsettings.dpath+req.params.user+'/icontacts.csv');
            //res.download(callsettings.dpath+req.params.user+'/icontacts.csv');
        });
        //res.download(callsettings.dpath+req.params.user+'/icontacts.csv');
    });

    app.get('/u/:user',checkLogin);
    app.get('/u/:user',function(req,res){
        Contacts.findOne({'username':req.session.user.username},function(err,pcon){
            if(err) throw err;
            var cur=0;
            if(pcon){
                cur = pcon.contacts.length;
            }
            res.render('contactspage',{title:'编辑联系人',username:req.session.user.username, curnum: cur, maxnum: 30});
        });
    });

    app.get('/gcontacts',function(req,res){
        GlobalContacts.find({},function(err,parray){
            if(err) throw err;
            var cur = parray.length;
            res.render('gcontacts',{title:'全局联系人',username:req.session.user.username,curnum: cur});
        });
    });

    app.post('/u/:user/addcontact',function(req,res){
        if(req.body.mobile == 'null'){
            req.body.mobile = 0;
        }
        if(req.body.office == 'null'){
            req.body.office = 0;
        }
        if(req.params.user !== 'admin'){
            Contacts.update({'username':req.params.user},{$addToSet:{'contacts':{'cname':req.body.name,'cemail':req.body.email,'ctype':req.body.type,'cinfo':{'mobile':req.body.mobile,'office':req.body.office}}}},{upsert:true},function(err,numeff,raw){
                if(err) throw err;
                console.log('The number of updated documents was %d', numeff);
                console.log('The raw response from Mongo was ', raw);
                res.send(req.body);
                req.flash('success','添加成功');
            });
        }else{
            console.log(req.body.type===1);
            var ploc = '本地';
            if(req.body.type !== 1 ) ploc = '外地';
            GlobalContacts.update({'cname':req.body.name},{$set:{'cname':req.body.name,'cemail':req.body.email,'clocate':ploc,'ctype':req.body.type , 'cinfo':{'mobile':req.body.mobile,'office':req.body.office}}},{upsert:true},function(err,numeff,raw){
                if(err) throw err;
                console.log(raw);
                req.flash('success','添加成功');
                res.send(req.body);
            });
        }
        /*
         Contacts.findOne({'username':req.params.user},function(err,puser){
         if(err) throw err;
         var ipeople={};
         var iinfo = {};
         iinfo.mobile = req.body.mobile;
         iinfo.office = req.body.office;
         ipeople.cname = req.body.name;
         ipeople.cinfo = iinfo;
         /*
         ipeople.cmobile = req.body.mobile;
         ipeople.coffice = req.body.office;

         ipeople.cemail = req.body.email;
         if(!puser){
         var pcon = new Contacts();
         pcon.username = req.params.user;
         pcon.contacts.push(ipeople);
         pcon.save(function(err){
         if(err) throw err;
         });
         }else{
         puser.contacts.push(ipeople);
         puser.save(function(err){
         if(err) throw err;
         });
         }
         res.send(req.body);
         req.flash('success','添加成功');
         });
         */
    });
    app.post('/u/:user/getcontacts',function(req,res){
        if(req.params.user !== 'admin'){
            Contacts.findOne({'username':req.params.user},function(err,puser){
                if(err) throw err;
                res.send(puser.contacts);
            });
        }else{
            GlobalContacts.find({}, 'cname cemail cinfo ctype' ,function(err,pdocs){
                if(err) throw err;
                res.send(pdocs);
            });
        }
        /*
         Contacts.findOne({'username':req.params.user},function(err,puser){
         if(err) throw err;
         res.send(puser.contacts);
         });
         */
    });
    app.post('/u/:user/delcontact',function(req,res){
        if(req.params.user !== 'admin'){
            Contacts.update({'username':req.params.user},{$pull: {"contacts" : {'cname': req.body.username}}}, function(err,numeff,raw){
                if(err) throw err;
                console.log('The number of updated documents was %d', numeff);
                console.log('The raw response from Mongo was ', raw);
                res.send(req.body);
            });
        }else{
            GlobalContacts.findOne({'cname': req.body.username}, function(err,pdoc) {
                console.log(pdoc);
                pdoc.remove();
                req.flash('success','删除成功');
                res.send({stat: true});
            });
        }
        /*
         Contacts.update({'username':req.params.user},{$pull: {"contacts" : {'cname': req.body.username}}}, function(err,numeff,raw){
         if(err) throw err;
         console.log('The number of updated documents was %d', numeff);
         console.log('The raw response from Mongo was ', raw);
         res.send(req.body);
         });
         */
    });
    app.post('/recording',function(req,res){
        console.log(req.body.username,req.body.otime,req.body.confid);
        var filepath = gsettings.getRecordDir()+req.body.otime+'_'+req.body.confid+'/';
        //var filepath = gsettings.getRecordDir()+req.body.ctime+'_'+req.body.confid+'.wav';
        console.log(filepath);
        if(!fs.existsSync(filepath)){
            fs.mkdirSync(filepath);
        }
        User.findOne({'username':req.body.username},'Rconf', function(err,pdoc){
            if(err) throw err;
            console.log(pdoc);
            for(var i =0; i<pdoc.Rconf.length;++i){
                console.log(1);
                if(pdoc.Rconf[i].conf_id === req.body.confid*1 ) {
                    console.log(123);
                    pdoc.Rconf[i].record_path = filepath;
                    pdoc.Rconf[i].c_status = true;
                    break;
                }
            }
            pdoc.save(function(err){
                if(err) throw err;
                var newpath = filepath+req.body.ctime+'_'+req.body.confid+'.wav';
                res.send({rpath:newpath});
            });
        });
    });
    app.post('/u/:user/updatecontact',function(req,res){
        console.log(req.body.name);
        if(req.body.mobile == 'null' ){
            req.body.mobile = 0;
        }
        if(req.body.office == 'null' ){
            req.body.office = 0;
        }
        console.log(req.params.user);
        if(req.params.user !== 'admin'){
            Contacts.findOne({'username':req.params.user},function(err,doc){
                if(err) throw err;
                for(var i=0;i<doc.contacts.length;++i){
                    if(doc.contacts[i].cname === req.body.name){
                        doc.contacts[i].cinfo.mobile = req.body.mobile;
                        doc.contacts[i].cinfo.office = req.body.office;
                        doc.contacts[i].cemail = req.body.email;
                        doc.contacts[i].ctype = req.body.type;
                        break;
                    }
                }
                doc.save(function(err){
                    if(err) throw err;
                    res.send(req.body);
                });
            });
        }else{
            var ploc = '本地';
            if(req.body.type !== 1) ploc = '外地';
            GlobalContacts.update({'cname':req.body.name},{$set:{'cemail':req.body.email,'clocate':ploc,'ctype':req.body.type , 'cinfo':{'mobile':req.body.mobile,'office':req.body.office}}},function(err,numeff,raw){
                if(err) throw err;
                console.log(raw);
                req.flash('success','更新成功');
                res.send(req.body);
            });
        }
        /*
         Contacts.findOne({'username':req.params.user},function(err,doc){
         if(err) throw err;
         for(var i=0;i<doc.contacts.length;++i){
         if(doc.contacts[i].cname === req.body.name){
         doc.contacts[i].cinfo.mobile = req.body.mobile;
         doc.contacts[i].cinfo.office = req.body.office;
         doc.contacts[i].cemail = req.body.email;
         doc.contacts[i].ctype = req.body.type;
         break;
         }
         }
         doc.save(function(err){
         if(err) throw err;
         res.send(req.body);
         });
         });
         */
        /*
         Contacts.update({'username':req.params.user,'contacts.cname':req.body.name},{$set: {'contacts.$.cinfo.mobile':req.body.mobile,'contacts.$.cinfo.office':req.body.office,'contacts.$.ctype':req.body.type,'contacts.$.cemail':req.body.email}}, function(err,numeff,raw){
         if(err) throw err;
         console.log('The number of updated documents was %d', numeff);
         console.log('The raw response from Mongo was ', raw);
         res.send(req.body);
         });
         */
    });

    app.get('/sysmonitor',checkLogin);
    app.get('/sysmonitor',function(req,res){
        if(req.session.user.username !== 'admin'){
            req.flash('error','非管理员无权访问该页面!');
            return res.redirect('/');
        }
        res.render('sysmon',{title: '系统资源监控'});
    });

    app.get('/wmeeting/:conid/:stime',checkLogin);
    app.get('/wmeeting/:conid/:stime',function(req,res){
        var curtime = new Date();
        var status = 1;
        User.findOne({'username':req.session.user.username},'Rconf',function(err,pdoc){
            if(err) throw err;
            // for(var i = 0; i<pdoc.Rconf.length;++i){
            //   console.log(req.params.stime*1);
            //   console.log(pdoc.Rconf[i].start_time.getTime());
            //   console.log(pdoc.Rconf[i].conf_id,req.params.conid*1);
            //   if(pdoc.Rconf[i].conf_id === req.params.conid*1 && pdoc.Rconf[i].start_time.getTime() === req.params.stime*1) {
            //     console.log(pdoc.Rconf[i].c_status);
            //     if(pdoc.Rconf[i].c_status) {
            //       status = 0;
            //       console.log(1232132132,status);
            //     }
            //     break;
            //   }
            // }
            var rec_filepath_prefix = gsettings.getRecordDir()+req.params.stime+'_'+req.params.conid+'/';
            res.render('wmeeting',{title: '监控会议',confid:req.params.conid,stime:req.params.stime,rec_fileprefix:rec_filepath_prefix,ctime:curtime.getTime(),creater:req.session.user.username,status: status});
        });
        //res.render('wmeeting',{title: '监控会议',confid:req.params.conid,stime:req.params.stime,ctime:curtime.getTime(),creater:req.session.user.username});
    });

    app.post('/rmeeting/:stime',checkLogin);
    app.post('/rmeeting/:stime',function(req,res){
        if(!req.body.confid || !req.body.starttime || !req.body.duretime || !req.body.mpwd || !req.body.opwd){
            req.flash('error','不能为空');
            return res.redirect('/rmeeting/'+req.params.stime);
        }
        if(!req.body.memlists){
            req.flash('error','与会人不能为空');
            return res.redirect('/rmeeting/'+req.params.stime);
        }
        var autocall = (req.body.autocall == 'open') ? true : false;
        var s = req.body.starttime.replace('T',' ').replace('Z','');


        var duretime = req.body.duretime;
        console.log(duretime);

        var endtime = new Date(s);
        if( endtime.getTime() < req.params.stime ){
            req.flash('error','不能预定当前时间之前的会议');
            return res.redirect('/rmeeting/'+req.params.stime);
        }
        //reformat the end time
        var cs = [31,28,31,30,31,30,31,31,30,31,30,31];
        var tempminutes = endtime.getMinutes() + duretime*1;
        var iHour = Math.floor(tempminutes/60);
        var remMins = tempminutes%60;

        console.log(iHour,remMins);

        var temphours = endtime.getHours() + iHour;
        var idate = Math.floor(temphours/24);
        var remHours = temphours%24;

        console.log(idate,remHours);

        var tempdates = endtime.getDate() + idate;
        var iMonth,remDate;
        if( tempdates == cs[endtime.getMonth()]){
            iMonth = 0;
            remDate = tempdates;
        }else{
            if(endtime.getMonth() == 1 && (endtime.getYear()+1900)%4 == 0 ){
                iMonth = Math.floor(tempdates/(cs[endtime.getMonth()]+1));
                remDate = tempdates%(cs[endtime.getMonth()]+1);
                //cs[err.getMonth()] = cs[err.getMonth()]+1;
            }else{
                iMonth = Math.floor(tempdates/cs[endtime.getMonth()]);
                remDate = tempdates%cs[endtime.getMonth()];
            }
        }
        console.log(tempdates,iMonth,remDate);

        var tempmonth = endtime.getMonth() + iMonth;
        var iyear = Math.floor(tempmonth/12);
        var remmonth = tempmonth%12;

        console.log(tempmonth,iyear,remmonth);

        var tempyear = endtime.getYear()+iyear+1900;

//      err.setYear(tempyear);
//      err.setMonth(remmonth);
//      err.setDate(remDate);
//      err.setHours(remHours,remMins);
        remmonth = remmonth+1;
        if(remmonth<10) {
            remmonth = '0'+remmonth;
        }
        if(remDate<10) { remDate = '0'+remDate; }
        if(remMins<10) { remMins = '0'+remMins; }

        var e = tempyear+'-'+remmonth+'-'+remDate+' '+remHours+':'+remMins;
        console.log(e);






        var susers = [];
        if(req.body.memlists.forEach != undefined){
            susers = req.body.memlists;
        }else{
            susers.push(req.body.memlists);
        }
        console.log(susers);
        for(var i in susers){
            susers[i] = eval("("+susers[i]+")");
        }
        console.log(susers);

        Conf.findOne({'confid':req.body.confid}, 'confid starttime endtime',function(err,pconf){
            if(pconf){
                if(req.body.starttime < pconf.endtime){
                    req.flash('error',"该时间段该会议ID已被预约,请修改会议号码或更改时间");
                    return res.redirect('/rmeeting');
                }
            }

            var pconf = new Conf();
            pconf.confname = req.body.confname;
            pconf.confid = req.body.confid;
            pconf.creater = res.locals.user.username;
            pconf.starttime = s;
            pconf.endtime = e;
            pconf.mpwd = req.body.mpwd;
            pconf.opwd = req.body.opwd;
            pconf.autocall = autocall;
            pconf.ipeople = susers;
            pconf.save(function(err){
                console.log('this sava executes');
                pconf.Sched();
            });
        });
        susers.forEach(function(puser){
            console.log(puser);
            var password = req.body.opwd;
            if(puser.username === req.session.user.username) password = req.body.mpwd;
            if(puser.email){
                var mailOptions = {
                    from : "sysop <"+callsettings.email+">",
                    to : puser.email,
                    subject : "预约会议",
                    html : "<h3>"+res.locals.user.username+" 邀请您参加会议。</h3><p>会议号码: <em>"+req.body.confid+"</em></p><p>开始时间: <b>"+s+"</b></p><p>会议密码："+password+"</p>",
                    text : "" + res.locals.user.username + " 邀请您参加会议： " + req.body.confid + " at " + req.body.starttime + " with the identify of " + req.body.opwd
                };
                console.log(mailOptions);

                smtpTranporter.sendMail(mailOptions,function(err,response){
                    if(err) console.log(err);
                    else    console.log("message sent : " + response.message);
                });
            }
        });
        User.findOne({'username':res.locals.user.username},function(err,iuser){
            console.log(iuser);
            iuser.Rconf.push({
                conf_id : req.body.confid,
                confname: req.body.confname,
                n_pwd : req.body.opwd,
                m_pwd : req.body.mpwd,
                start_time : s,
                end_time : e,
                record_path : '',
                paticpants: susers,
                auto_call : autocall
            });
            iuser.save(function(err){
                req.session.user = iuser;
                req.flash('success','预约成功');
                res.redirect('/');
            });
        });
    });

    function md5(str){
        var md5sum = crypto.createHash('md5');
        md5sum.update(str);
        str = md5sum.digest('hex');
        return str;
    }

    function checkNotLogin(req,res,next){
        if(req.session.user){
            req.flash('error','Already loged in');
            return res.redirect('/');
        }
        next();
    }
    function checkLogin(req,res,next){
        if(!req.session.user){
            req.flash('error','Not log in.');
            return res.redirect('/');
        }
        next();
    }
    return app.router;
};
