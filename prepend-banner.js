var pkg = require('./package.json');

var date = new Date();

var banner = '// Animitter ' +pkg.version+ '\n' +
             '// Build: ' + date.getFullYear() + '-' + (date.getMonth()+1) + '-' + date.getDate() + '\n' +
             '// by Kyle Phillips - http://haptic-data.com\n' +
             '// Available under MIT License\n';

process.stdin.setEncoding('utf8');

process.stdout.write(banner);
process.stdin.on('readable', function() {
  var chunk = process.stdin.read();
  if (chunk !== null) {
    process.stdout.write(chunk);
  }
});
