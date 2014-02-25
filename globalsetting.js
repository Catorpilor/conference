var Local_city = '北京';
var headerimg = 'http://www.gravatar.com/avatar/3d392c2e333a7adb4e26ce18467a7cf5?size=25';
var disimg = '/images/crop.png';
var record_dir = '/tmp/record/';
exports.getRecordDir = function() {return record_dir;}
exports.getLocalCity = function() {return Local_city;}
exports.getLocal = function() { return '本地'; }
exports.getHeader = function() {return headerimg;}
exports.getDis = function() {return disimg;}
