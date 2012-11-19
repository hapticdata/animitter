var fs = require('fs'),
	version = require('../package').version;

var src = './lib/';

var output = String(fs.readFileSync(__dirname+'/_pre.js'));
output += '\n(function(){';

[	'utils',
	'events',
	'animitter'
].forEach(function( module ){
	output += "\n\t//"+module+".js";
	output += "\n\tvar "+module+" = (function(){";
	output += "\n\t\tvar module = {}, exports = {};";
	output += "\n\t\tmodule.exports = exports;";
	output += '\n\t\t'+ String(fs.readFileSync(src+module+'.js')).replace(/\n/g,'\n\t\t');
	output += [
		'\n\t\treturn module.exports;',
		'\t}());'
	].join('\n');
});
output += [
	'\n\tanimitter.version = "'+version+'";',
	'\tif( typeof define === "function" && define["amd"]){',
	'\t\tdefine(function(){ return animitter; });',
	'\t} else if( typeof window === "object" ){',
	'\t\twindow["animitter"] = animitter;',
	'\t}',
	'}());'
].join('\n');

fs.writeFileSync('./animitter.js', output );