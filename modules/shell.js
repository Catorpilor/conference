exports.run = function(command,callback) {
	var sys = require('sys');
	var exec = require('child_process').exec;
	//function puts(error,stdout,stderr){ sys.puts(stdout);}
	exec(command,callback);
}
