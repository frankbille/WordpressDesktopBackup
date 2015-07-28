var BrowserWindow = require('browser-window');
var Request = require('superagent');
var Q = require('q');

module.exports = {
  newAuth: function(options) {
    return Q.promise(function(resolve, reject) {
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

      authWindow.loadUrl(
        'https://public-api.wordpress.com/oauth2/authorize?client_id=' +
        options.clientId + '&redirect_uri=' + options.redirectUri +
        '&response_type=code'
      );

      authWindow.webContents.on('did-get-redirect-request', function(
        event,
        oldUrl, newUrl) {

        var raw_code = /code=([^&]*)/.exec(newUrl) || null,
          code = (raw_code && raw_code.length > 1) ? raw_code[1] :
          null,
          error = /\?error=(.+)$/.exec(newUrl);

        // If there is a code in the callback, proceed to get token from github
        if (code) {
          Request
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
                reject(new Error(err));
              } else {
                authWindow.close();
                resolve(res.body);
              }
            });
        } else if (error) {
          authWindow.close();
          reject(new Error(error));
        }
      });
    });
  }
};
