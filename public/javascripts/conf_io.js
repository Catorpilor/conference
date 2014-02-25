(function($){

	//create global app parameters...
	// var serverAddress = 'http://172.16.3.98:3050' ,
	// 	socket = null,

		tmplt = {
			user: [
        '<div user-id="${caller_ani}" class="col-md-3">',
          '<div class="thumbnail">',
            '<img src="${i_pic}" style="width:100px; height:100px;">',
            '<div mem-id="${mem_id}" class="caption">',
              '<div class="page-header">',
                '<h4>',
                    '${caller_name}',
                    '<small> ${caller_ani}</small>',
                '</h4>',
              '</div>',
              '<p class="text-info">${mem_type}</p>',
              '<p><span class="label label-success">空闲</span></p>',
              '<p class="actions"><button id="bmute" type="${mem_type}" mem-id="${mem_id}" act="mute" class="btn btn-info">静音</button><button id="bkick" mem-id="${mem_id}" type="${mem_type}" class="btn btn-danger">踢出</button></p>',
            '</div>',
          '</div>',
        '</div>'
			].join(""),
			channel_info: [
				'<li channle-id="${uuid}" class="cf">',
					'<div class="fl message">${message}  </div><div class="fl callee_id">${callee_id}</div><div class="fr state">${state}</div>',
				'</li>'
			].join("")
		};
    var initnum = 0;


	//init call
	//insert the divs into the document
	function insertUsers(user_id,user_name,mem_id,mem_type,ipic)
	{
		var $html = $.tmpl(tmplt.user, {
			caller_ani: user_id,
      caller_name: user_name,
			mem_id: mem_id,
			mem_type: mem_type,
      i_pic : ipic
		});
		if($('#userlist div[user-id="' + user_id + '"]').length == 0 ){
			$html.appendTo('#userlist');
      if(mem_type === 'moderator'){
        var $mbutton = $('<button id="muteall" mact="mute" mem-id="'+mem_id+'"class="btn btn-info">全部静音</button>');
        $mbutton.appendTo('div[mem-id="'+mem_id+'"] .actions');
      }
		}
    console.log($('.status').text());
    if(!initnum ){
      // $('.span6 .add').removeClass('hide');
      // $('.span6 #record').removeClass('hide');
      if($('.status').text()==1){
          $('.col-md-6 .add').removeClass('hide');
          $('.col-md-6 #record').removeClass('hide');
      }
    }
    ++initnum;
    //$('.span6 .badge').html(initnum);
    $('.col-md-6 #curnum').html(initnum);
	};

	function deleteUsers(user_id){
    if( $('#userlist div[user-id="' +user_id+ '"]').length ){
      $('#userlist div[user-id="' +user_id+ '"]').remove();
        initnum--;
        $('.col-md-6 #curnum').html(initnum);
        if(!initnum){
            $('.col-md-6 .add').addClass('hide');
            $('.col-md-6 #record').addClass('hide');
        }
    }
	}


	function updateUserstate(mem_id,type,state){

		// if($('.showlist .user_list div[user-id="' +callid+ '"] .channels ul li[channel_id="' +uuid+ '"]').length !== 0){
		// 		alert(1);
		// }
		//alert(1);
        if(state == 1){
            $('div[mem-id="'+mem_id+'"] p span').removeClass().addClass('label label-success');
            $('div[mem-id="'+mem_id+'"] p span').html('空闲');
            $('div[mem-id="'+mem_id+'"] p #bmute').html('静音');
            if(type != 'moderator'){
                $('div[mem-id="'+mem_id+'"] p #bmute').attr('act','mute');
                $('div[mem-id="'+mem_id+'"] p #bmute').html('静音');
            }
            //$('div[mem-id="'+mem_id+'"] p #bmute').attr('act','mute');
            //$('div[mem-id="'+mem_id+'"] p #bmute').html('静音');
        }else if(state == 0){
            $('div[mem-id="'+mem_id+'"] p span').removeClass().addClass('label label-danger');
            $('div[mem-id="'+mem_id+'"] p span').html('讲话');
        }else{
            $('div[mem-id="'+mem_id+'"] p span').removeClass().addClass('label label-default');
            $('div[mem-id="'+mem_id+'"] p span').html('静音');
            $('div[mem-id="'+mem_id+'"] p #bmute').attr('act','unmute');
            $('div[mem-id="'+mem_id+'"] p #bmute').html('取消静音');
        }
		//$('.showlist .user_list div[user-id="' +callid+ '"] .channels ul li[channel_id="' +uuid+ '"] .state').html(state);
	}

    function requestSpeaking(username,memid) {
        $('#framedisplay').prepend('<div class="alert alert-info in" mid="'+memid+'"> <h4>' + username + 
            '  <small>申请发言！</small> <button type="button" class="close" data-dismiss="alert">&times;</button></h4>'+'</div>');
        setTimeout(function(){
            $('div[mid="'+memid+'"]').alert('close');
        },3500);
    }

	function bindSocketEvent(confid){
        var requestlist=[];
		//on connect
		socket.on('connect',function(){
			//console.log('Connected\n');
			//alert('client connected');
			socket.emit('connect',{my:'connected', conf_id:confid});
		});

		//on add-member
		socket.on(confid+'-add-member', function(data){
			var user_id = data.caller_ani;
			var mem_type = data.mem_type;
			var mem_id = data.mem_id;
            var ipic = '/images/crop.png'
            var obj={};
            obj.ani = user_id;
            if(user_id.toString().length == 4 || user_id.toString().length == 8){
                obj.type = 'office';
            }else{
                obj.type = 'mobile';
            }
            console.log(obj);
            $.ajax({
                type: 'POST',
                data: JSON.stringify(obj),
                contentType: 'application/json',
                url: '/fetchuser/',
                success : function(data){
                    console.log(data);
                    if(data == 'No such user'){
                        insertUsers(user_id,user_id,mem_id,mem_type,ipic);    
                    }else{
                        insertUsers(user_id,data.username,mem_id,mem_type,data.img.disimg);    
                    }
                }
            });
			//insertUsers(user_id,mem_id,mem_type);	
		});

		//on del-member
		socket.on(confid+'-del-member', function(data){
			//when user unregister we just make it fadeout
			deleteUsers(data.caller_ani);
		});

		socket.on(confid+'-dtmf', function(data){
			//custom conference event
            //here request for speaking
            if(data.speak_status === 'false'){
                var flag = false;
                for(var i = 0; i<requestlist.length; ++i){
                    if(requestlist[i].mem_id === data.mem_id){
                        flag = true;
                        var curTime = new Date().getTime();
                        if(requestlist[i].stime + 3500 < curTime){
                            requestlist[i].stime = curTime;
                            requestSpeaking(requestlist[i].username,requestlist[i].mem_id);
                        }
                    }
                }
                if(!flag){
                    var headername = $('div[mem-id="'+data.mem_id+'"] .page-header h4').html();
                    var parts = headername.split('<')[0];
                    var obj={};
                    obj.mem_id = data.mem_id;
                    obj.stime = new Date().getTime();
                    obj.username = parts;
                    requestlist.push(obj);
                    requestSpeaking(obj.username,obj.mem_id);
                }
            }
		});


        
        //on mute-member
		socket.on(confid+'-mute-member', function(data){
			//alert('create');
            updateUserstate(data.mem_id,data.mem_type,-1);
		});

        socket.on(confid+'-start-talking',function(data){
            updateUserstate(data.mem_id,data.mem_type,false);
        });
        
        socket.on(confid+'-stop-talking',function(data){
            updateUserstate(data.mem_id,data.mem_type,true);
        });
        
        //on unmute-member
		socket.on(confid+'-unmute-member', function(data){
			//alert('answer');
            for(var i = 0; i<requestlist.length;++i){
                if(requestlist[i].mem_id === data.mem_id){
                    requestlist.splice(i,1);
                }
            }
            updateUserstate(data.mem_id,data.mem_type,true);
		});
        
        //on kick-member
		socket.on(confid+'-kick-member',function(data){
			//alert('destory');
			deleteUsers(data.caller_ani);
		});

	}
    var socket = io.connect();
	//fired when the document ready
	$(function(){
		//socket = io.connect(serverAddress);
		//bind socket event
		//those events are fired by server
		//bindSocketEvent();
        	var confid = $("#conf_id").text();
        	//socket = io.connect(serverAddress);
        	bindSocketEvent(confid);
            var ctime = $(".stimer").text();
            var creater = $('.owner').text();

        $("#userlist").delegate('button#muteall','click',function(){
            if($(this).attr('mact') === 'mute'){
                $(this).attr('mact','unmute');
                $(this).html('取消全部');
                //map to all the members
                $('#userlist .thumbnail button#bmute').map(function(){
                    $(this).attr('act','unmute');
                    $(this).html('取消静音');
                });
				socket.emit('mute',{conf_id:confid,memid:$(this).attr('mem-id'),flag:true});
            }else{
                $(this).attr('mact','mute');
                $(this).html('全部静音');
                $('#userlist .thumbnail button#bmute').map(function(){
                    $(this).attr('act','mute');
                    $(this).html('静音');
                });
				socket.emit('unmute',{conf_id:confid,memid:$(this).attr('mem-id'),flag:true});
            }   
        });
		
		$("#userlist").delegate('button#bmute','click',function(){
			//var ball = ($(this).attr('type') == 'moderator');
			if($(this).attr('act') == 'mute'){
				$(this).attr('act','unmute');
				$(this).html('取消静音');	
				//mute somebody
                /*
                if(!ball){
				    $(this).attr('act','unmute');
				    $(this).html('取消静音');	
                }else{
                    $('#userlist .thumbnails button#bmute').map(function(){
                        $(this).attr('act','unmute');
                        $(this).html('取消静音');
                    });
                }
                */
				socket.emit('mute',{conf_id:confid,memid:$(this).attr('mem-id'),flag:false});
			} else {
				$(this).attr('act','mute');
				$(this).html('静音');	
                /*
                if(!ball){
				    $(this).attr('act','mute');
				    $(this).html('静音');	
                }else{
                    $('#userlist .thumbnails button#bmute').map(function(){
                        $(this).attr('act','mute');
                        $(this).html('静音');
                    });
                }
                */
				socket.emit('unmute',{conf_id:confid,memid:$(this).attr('mem-id'),flag:false});
			}	
		});
		$("#userlist").delegate('button#bkick','click',function(){
			var memid = $(this).attr('mem-id');
			var type = $(this).attr('type');
			socket.emit('kick',{conf_id:confid,mem_id:memid,i_type:type});
		});
        
        $('#mymodal').on('show', function () {
            $('.modal-body #fordestnum').val('');
        });

        $('.col-md-6 #arecord').on('click',function(){
            var filepath = ctime+'_'+confid+'.wav';
            if($(this).attr('act') === 'precord') {
                $(this).attr('act','rrecord');
                $(this).attr('value','恢复录音');
                socket.emit('precord',{conf_id:confid,ifile:filepath});
            }else{
                $(this).attr('act','rrecord');
                $(this).attr('value','暂停录音');
                socket.emit('rrecord',{conf_id:confid,ifile:filepath});
            }
            $(this).blur();
        });

        $('.col-md-6 #record').on('click',function(){
            if($(this).attr('act')=='srecord'){
                //start recording
                var data={};
                data.username = creater;
                data.ctime = ctime;
                data.confid = confid;
                $(this).blur();
                $.ajax({
                    type: 'POST',
                    data: JSON.stringify(data),
                    contentType: 'application/json',
                    url: '/recording/',
                    success: function(data){
                        $('.col-md-6 #record').attr('act','erecord');
                        $('.col-md-6 #record').attr('value','停止录音');
                        console.log(data.rpath);
                        $('.col-md-6 #arecord').removeClass('hide');
                        socket.emit('start_record',{conf_id:confid,ifile:data.rpath});
                    }
                });
            }else{
                if(confirm('确认停止对当前会议室录音?')){
                    var datafile = '/tmp/record/'+ctime+'_'+confid+'.wav';
                    $(this).attr('act','srecord');
                    $(this).attr('value','开始录音');
                    $(this).addClass('hide');
                    $('.span6 #arecord').addClass('hide');
                    socket.emit('end_record',{conf_id:confid,ifile:datafile});
                }
            }    
        });
        var $modal = $('#mymodal');
        $modal.on('click', '.confirm', function(){
            var destnumber = $('#fordestnum').val();
            var bflag = (destnumber.length == 4);
            socket.emit('add-member', {conf_id:confid,d_num:destnumber,flag:bflag});
            $modal.modal('hide');
            $('#framedisplay').prepend('<div class="alert alert-info fade in">' +
                '邀请已发送！<button type="button" class="close" data-dismiss="alert">x</button>' +'</div>');
        });
	});
})(jQuery);
