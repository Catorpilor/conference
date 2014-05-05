
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , settings = require('./settings')
  , gsettings = require('./callsettings')
  , MongoStore = require('connect-mongo')(express)
  , path = require('path')
  , partials = require('express-partials')
  , flash = require('connect-flash')
  , parseString = require('xml2js').parseString;

var _freeswitch = require('./modules/freeswitch');
console.log(gsettings.fsdomain);
var freeswitch = new _freeswitch.client(gsettings.domain,8021,'ClueCon');

var app = express();

// all environments
app.configure(function(){
    app.set('port', process.env.PORT || 3050);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    app.use(express.favicon(__dirname+'/public/images/favicon.ico'));
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(partials());
    app.use(flash());
    app.use(express.cookieParser());

    app.use(express.session({
        secret: settings.cookieSecret,
        store: new MongoStore(settings.db)
    }));
    app.use(function(req,res,next){
        res.locals.user = req.session ? req.session.user : '';
        res.locals.error = req.session ? req.flash('error'): '';
        res.locals.success = req.session ? req.flash('success') : '';
        res.locals.info = req.sesion ? req.flash('info') : '';
        next();
    });
    app.use(routes(app));
    app.use(express.static(path.join(__dirname, 'public')));
    app.use(express.static(path.join(__dirname, 'static')));
 });

process.on('uncaughtException',function(err){
    console.log(err.statck);
});
/*
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(partials());
app.use(flash());
app.use(express.cookieParser());


app.use(function(req,res,next){
    res.local.user = res.session ? req.sessioin.user : '';
    res.local.error = res.session ? req.flash('error') : '';
    res.local.success = res.session ? req.flash('success') : '';
    res.local.info = res.session ? req.flash('info') : '';
    next();
});

app.use(routes(app));

app.use(express.static(path.join(__dirname, 'public')));

*/
// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

var server = http.createServer(app);
var io = require('socket.io').listen(server);
server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

io.set('log level', 3);
io.set('transport', ['websocket','xhr-polling']);


freeswitch.connect();
io.sockets.on('connection',function(socket){
    socket.on('connect',function(data){
        console.log('connected to socket io');
        console.log(data.conf_id);
        var confid = data.conf_id;
        var command = "api conference "+data.conf_id+" xml_list";
        freeswitch.sendCommand(command, function(data){
            if(data[0] == 'C'){
                console.log('no such conference');
            }else{
                parseString(data,function(err,result){
                    var t = result.conferences.conference[0].members;
                    t.forEach(function(i){
                        i.member.forEach(function(attrs){
                            if(attrs.$.type === 'caller'){
                                var ani = attrs.caller_id_number[0]*1;
                                var mid = attrs.id[0]*1;
                                console.log(attrs.flags[0].is_moderator[0]=='false');
                                var type = (attrs.flags[0].is_moderator[0]=='true') ? 'moderator' : 'member';
                                socket.emit(confid+'-add-member', {caller_ani:ani,mem_id:mid,mem_type:type});
                            }
                        });
                    });
                });
            }
        });
    });
    freeswitch.on('CUSTOM',function(event){
        var confname = event['Conference-Name'];
        var dtmf_key = event['Action'] === 'dtmf' ? event['DTMF-Key']*1 : 1111;
        socket.emit(confname+'-'+event['Action'], {caller_ani: event['Caller-Caller-ID-Number'],speak_status : event['Speak'], mem_id: event['Member-ID'], mem_type: event['Member-Type'], caller_profile_index: event['Caller-Profile-Index'] , dtmf_key : dtmf_key });
    });
    socket.on('mute', function(data){
        console.log('mute clicked');
	    var command;
	    if(data.flag){
    	    command = "api bgapi conference "+data.conf_id + " mute all";
            freeswitch.sendCommand(command);
    	    //command = "api bgapi conference "+data.conf_id + " unmute "+data.memid;
            //freeswitch.sendCommand(command);
        }
        else{
            command = "api bgapi conference "+data.conf_id + " mute "+data.memid;
            console.log(command);
	        freeswitch.sendCommand(command);
        }
    });
    socket.on('unmute', function(data){
        console.log('unmute clicked');
	    var command;
	    if(data.flag)
    		command = "api bgapi conference "+data.conf_id + " unmute all";
	    else
		    command = "api bgapi conference "+data.conf_id + " unmute "+data.memid;
        console.log(command);

	    freeswitch.sendCommand(command);
    });
    socket.on('add-member',function(data){
        console.log('add member');
        var command = "api bgapi conference "+data.conf_id + " dial ";
        if(data.flag){
            if(gsettings.inBoundCall.indexOf('internal') !== -1 ){
                command = command + "{ignore_early_media=true}"+gsettings.inBoundCall+data.d_num+gsettings.fsdomain;
            }else{
                command = command + "{ignore_early_media=true}"+gsettings.inBoundCall+data.d_num;
            }

        }else{
            command = command + "{ignore_early_media=true}"+gsettings.OutBoundCall+data.d_num;
        }
        console.log(command);
        freeswitch.sendCommand(command);
    });
    socket.on('precord',function(data){
        console.log('pause recording');
        var command = "api bgapi conference "+data.conf_id+" recording pause /tmp/record/"+data.ifile;
        console.log(command);
        freeswitch.sendCommand(command);
    });
    socket.on('rrecord',function(data){
        console.log('resume recording');
        var command = "api bgapi conference "+data.conf_id+" recording resume /tmp/record/"+data.ifile;
        console.log(command);
        freeswitch.sendCommand(command);
    });
    socket.on('start_record',function(data){
        console.log('start recording');
        var command = "api bgapi conference "+data.conf_id+" recording start "+data.ifile;
        console.log(command);
        freeswitch.sendCommand(command);
    });
    socket.on('end_record',function(data){
        console.log('end recording');
        var command = "api bgapi conference "+data.conf_id+" recording stop "+data.ifile;
        console.log(command);
        freeswitch.sendCommand(command);
    });
    socket.on('kick', function(data){
    	if(data.type == 'moderator')
		    console.log('hah');
	    else{
		    var command = "api bgapi conference "+data.conf_id + " kick "+data.mem_id;
		    freeswitch.sendCommand(command);
	    }
    });
    socket.on('disconnect',function(){
        console.log('socket disconnected\n');
    });
});

freeswitch.on('connect',function(){
    freeswitch.event('CUSTOM conference::maintenance');
    console.log('connected to freeswitch');
});
