var app = require('app');
var auth = require('./auth.js');
var request = require('superagent');
var path = require('path');

var options = {
  clientId: '41868',
  clientSecret: '6fdTAVwJgW3ji9pYryzIzieEVNpwxIkB4ihhlUPItqE0kJdDryLvWBYCqNb4sxef',
  redirectUri: 'http://127.0.0.1:18123/auth',
  configFile: path.join(app.getPath('userData'), 'config.json')
};

function mainBackupLoop(auth) {
  setTimeout(function(auth) {
    request
      .get('https://public-api.wordpress.com/rest/v1.1/sites/' + auth.blog_id +
        '/media/2803')
      .set('Authorization', 'BEARER ' + auth.access_token)
      .end(function(err, res) {
        console.log(res.body);
      });

    mainBackupLoop(auth);
  }, 1000, auth);
}

app.on('ready', function() {
  auth.getAuth(options, function(auth) {
    mainBackupLoop(auth);
  });
});
