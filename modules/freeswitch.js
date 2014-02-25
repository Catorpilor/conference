/**
 * FreeSwitch event socket client
 *
 * BSD license
 *
 * @package freeswitch
 * @author  Demchenko Eugene ( mailto:it-bm@mail.ru, skype:demchenkoe )
 * @version 0.1.2b
 *
 Mini HOW-TO:
 
    var freeSwitch = require('./freeswitch');

    fsc = new freeSwitch.client('localhost', 8021, 'ClueCon');

    fsc.on('connect',function(){

        //subscribe on events from FreeSWITCH
        fsc.event('CHANNEL_CREATE CHANNEL_DESTROY');

        //...
    });

    fsc.on('disconnect',function(){
        //called on disconnect from FreeSWITCH
    });


    //set handlers for event

    fsc.on('CHANNEL_CREATE', function(event){

    }

    fsc.on('CHANNEL_DESTROY', function(event){

    }

    //connect to FreeSWITCH

    freeswitch.connect()

 */


var net = require('net');
var iconv = require('iconv-lite');

exports.client = function (host, port, password)
{
    var _socket = new net.Socket();
        
    _socket.setEncoding('utf8');

    var _connected = false;
    
    var _callbacksList = [];
    var _onHandlers = [];
    var _bgapiHandlers = [];

    this.on = function(event, callback){
        var old = _onHandlers[event];
        _onHandlers[event] = callback;
        return old;
    }

    this.connect = function(){
        _socket.connect(port,host);
    }

    this.connected = function(){
        return _connected;
    }

    this.sendCommand = function(command,callback){

        _callbacksList.push(callback);
        _socket.write(command+'\n\n');
    }

    this.exit = function(){
        this.sendCommand('exit', function(data){
            _connected = false;
        });        
    }    

    this.log = function(level, callback){
        this.sendCommand('log '+level, callback);
    }

    this.nolog = function(callback){
        this.sendCommand('nolog', callback);
    }

    this.event = function(types, callback){
        this.sendCommand('event json '+types, callback);
    }

    this.nixevent = function(types, callback){
        this.sendCommand('nixevent '+types, callback);
    }

    this.noevent = function(type,callback){
        this.sendCommand('noevent', callback);
    }

    //auth/request

    _onHandlers['auth/request'] = function(header, body)
    {

        _callbacksList.push(function(head, body, success, statusText){
            if(success){
                _connected = true;
                if(_onHandlers['connect'])
                    _onHandlers['connect']();
            }
            else{
                if(_onHandlers['error'])
                    _onHandlers['error'](head, body, success, statusText);
            }
        });
        
        _socket.write('auth '+password+'\n\n');
    }
     _onHandlers['api/response'] = function(header,body)
     {
         var callback = _callbacksList.shift();
         if(callback)
             callback(body);
    }


    //command/reply

    _onHandlers['command/reply'] = function(header, body)
    {
        
        var replyText = /^(\S+)\s?(.+)?/.exec( header['Reply-Text'] );

        var callback = _callbacksList.shift();

        //if field Job-UUID defined then bgapi function 

        if( typeof header['Job-UUID'] !== 'undefined'
            && replyText[1] == '+OK')
        {            

            _bgapiHandlers[ header['Job-UUID'] ] = callback;
        }
        else
        if(callback)
            callback(header, body, replyText[1] == '+OK', replyText[2]);
    }

    //text/event-json

    _onHandlers['text/event-json'] = function(header, body)
    {        
        
        // if(body !== ''){
            
        // }
 //       console.log('<TD>',body,'</TD>');
        var event = JSON.parse( body );        
        
        if(event['Event-Name'] == 'BACKGROUND_JOB')
        {                        

            if( typeof event['Job-UUID'] !== 'undefined' &&
                typeof _bgapiHandlers[ event['Job-UUID'] ] !== 'undefined' )
            {
                var replyText = /^(\S+)\s?(.+)?/.exec( event['_body'] );

                _bgapiHandlers[ event['Job-UUID'] ](header, body, replyText[1] == '+OK', replyText[2] );
                delete _bgapiHandlers[ event['Job-UUID'] ];
            }
        }
        else
        if( typeof _onHandlers[ event['Event-Name'] ] !=='undefined')
        {
   //         console.log('<EVENT',event,'</EVENT>');
            _onHandlers[ event['Event-Name'] ](event, header);
        }                

    }

    //socket events

    _socket.on('close', function(){
            _connected = false;
            if(_onHandlers['disconnect'])
                    _onHandlers['disconnect']();
    });

    var unparsedData = [];
    var size =0;
    var tbparsedData=[];

    _socket.on('data', function(data){
        
        var ud = unparsedData.shift();
        if(ud){
//            tbparsedData.push(ud);
//            tbparsedData.push(data);
//            size += ud.length;
//            size += data.length;
//            var buf = Buffer.concat(tbparsedData,size);
//            data = iconv.decode(buf,'utf8');
//            tbparsedData=[];
//            size = 0;
            data = ud + data;
        }
        
        //console.log('<RAW DATA>',data,'</RAW DATA>');
        /*
        var index = data.indexOf('}');
        if(index != -1){
            data = [data.slice(0,pos+1),'\n',data.slice(pos+1)].join("");
        }
        */

        while(data.length > 0)
        {
            var pos = 0;
            var end = data.indexOf('\n\n');
            
            if(end == -1){                
                unparsedData.push(data);
                break;
            }
            if(end == 0){
              data = data.substring(2, data.length);
              continue;
            }

            var hdrLines = data.substring( pos, end ).split('\n');
            var header = [];
            var body = '';

            for( var i in hdrLines)
            {
                if(!hdrLines.hasOwnProperty(i)) continue;

                //var arr = /^(\S+): (.+)/.exec(hdrLines[i]);
                var arr = hdrLines[i].split(': ', 2);
                
                header[ arr[0] ] = arr[1];
            }

            if(typeof header['Content-Length'] !== 'undefined'){
                
                end+=2;         //end + sizeof('\n\n')
                pos = end;                        
                end+= header['Content-Length']*1;

                if(end > data.length)
                {
                                       
                    unparsedData.push(data);                   
                    break;
                }

                body = data.substring( pos, end );
            }            

            //call handler
            
            if( typeof header['Content-Type'] !== 'undefined' &&
                typeof _onHandlers[ header['Content-Type'] ] != 'undefined' )
            {

                var nend = body.indexOf('}C');
       //j         console.log(nend);
                if(nend !== -1){
     //               console.log('<TDT>',body.substring(nend),'</TDT>');
                    end = nend+1;
                    body = body.substring(0,end);
                    end += pos;
                }
          //      console.log('<HDER>',header['Content-Type'],'</HDER>');
                //console.log('<PARSE>', body, '</PARSE>');
                _onHandlers[ header['Content-Type'] ](header, body);
            }

            //cut parsed data from buff
                        
            data = data.substring(end,data.length);           
        }          

    });
}
