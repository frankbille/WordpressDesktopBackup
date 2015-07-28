var app = require('app');
var path = require('path');
var Q = require('q');
var Config = require('./config.js');
var Backup = require('./backup.js');

var options = {
  clientId: '41868',
  clientSecret: '6fdTAVwJgW3ji9pYryzIzieEVNpwxIkB4ihhlUPItqE0kJdDryLvWBYCqNb4sxef',
  redirectUri: 'http://127.0.0.1:18123/auth',
  configFile: path.join(app.getPath('userData'), 'config.json'),
  baseApiUri: 'https://public-api.wordpress.com/rest/v1.1/',
  createApiUrl: function(endpoint) {
    return this.baseApiUri + endpoint;
  }
};

function mainBackupLoop(config) {
  if (config.sites.length > 0) {
    var backupPromises = [];
    config.sites.forEach(function(siteConfig) {
      backupPromises.push(Backup.backup(options, config, siteConfig));
    })
    Q.allSettled(backupPromises)
      .then(function(results) {
        console.log(results);
        setTimeout(mainBackupLoop, 5000, config);
      });
  } else {
    Config
      .newConfig(options)
      .then(mainBackupLoop);
  }
}

app.on('ready', function() {
  Config
    .getConfig(options)
    .then(mainBackupLoop)
    .catch(console.dir);
});
