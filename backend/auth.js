var app = require('app');
var BrowserWindow = require('browser-window');
var request = require('superagent');
var jetpack = require('fs-jetpack');
var Q = require('q');

module.exports = {
  getAuth: function(options) {
    return Q.promise(function(resolve, reject) {
      jetpack
        .readAsync(options.configFile, 'json')
        .then(function(config) {
          if (config) {
            requireAccessToken = false;
            resolve(config);
          }
        });
      var requireAccessToken = true;



      if (requireAccessToken) {
        var authWindow = null;
        authWindow = new BrowserWindow({
          width: 1024,
          height: 768,
          frame: false,
          resizable: false,
          "skip-taskbar": true,
          'node-integration': false
        });

        // Reset the authWindow on close
        authWindow.on('close', function() {
          authWindow = null;
        }, false);

        authWindow.webContents.on('did-get-redirect-request', function(
          event,
          oldUrl, newUrl) {

          var raw_code = /code=([^&]*)/.exec(newUrl) || null,
            code = (raw_code && raw_code.length > 1) ? raw_code[1] :
            null,
            error = /\?error=(.+)$/.exec(newUrl);

          // If there is a code in the callback, proceed to get token from github
          if (code) {
            request
              .post('https://public-api.wordpress.com/oauth2/token')
              .type('form')
              .send({
                'client_id': options.clientId,
                'redirect_uri': options.redirectUri,
                'client_secret': options.clientSecret,
                code: code,
                'grant_type': 'authorization_code'
              })
              .end(function(err, res) {
                if (err) {
                  console.error(
                    "Oops! Something went wrong and we couldn't log you in:" +
                    err
                  );
                } else {
                  jetpack.write(options.configFile, res.body);
                  authWindow.close();
                  callback(res.body);
                }
              });
          } else if (error) {
            console.error(
              "Oops! Something went wrong and we couldn't log you in:" +
              error
            );

            authWindow.close();
          }
        });

        authWindow.loadUrl(
          'https://public-api.wordpress.com/oauth2/authorize?client_id=' +
          options.clientId + '&redirect_uri=' + options.redirectUri +
          '&response_type=code'
        );
      }
    });
    var deferred = Q.defer();


  }
};
