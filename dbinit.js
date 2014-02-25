var User = require('./modules/user.js');

var csv = require('csv');
var crypto = require('crypto');


 csv()
 .from.path(__dirname+'/contacts.csv', { delimiter: ',', escape: '"' })
 .transform( function(row){
         row.unshift(row.pop());
          return row;
 })
 .on('record', function(row,index){
        console.log('#'+index+' '+JSON.stringify(row));
	if(index){
		User.findOne({'email':row[0]},function(err,iuser){
			if(iuser) {
				console.log(iuser);
			}else {
				var user = new User();
				user.username = row[1];
				user.email = row[0];
                var md5 = crypto.createHash('md5');
				user.password=md5.update('123456').digest('base64');
				user.Contact_info.mobile = row[2];
				user.Contact_info.office = row[3];
				user.save(function(err){
					if(err) console.log(err);
				});
			}
		});
	}
 })
 .on('end', function(count){
        // when writing to a file, use the 'close' event
          // the 'end' event may fire before the file has been written
      console.log('Number of lines: '+count);
 })
 .on('error', function(error){
        console.log(error.message);
 });

