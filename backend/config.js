var Q = require('q');
var Jetpack = require('fs-jetpack');
var Auth = require('./auth.js');

module.exports = {
  getConfig: function(options) {
    return Jetpack
      .readAsync(options.configFile, 'jsonWithDates')
      .then(function(config) {
        if (config == null || config === '') {
          config = {
            sites: [],
            backupLocation: 'C:/Users/Frank Bille/Downloads/Temp'
          };
        }
        return config;
      });
  },

  newConfig: function(options) {
    var thisConfig = this;

    return Auth
      .newAuth(options)
      .then(function(auth) {
        return thisConfig
          .getConfig(options)
          .then(function(config) {
            config.sites.push(auth);
            return thisConfig.saveConfig(options, config);
          })
      });
  },

  saveConfig: function(options, config) {
    return Q.promise(function(resolve) {
      Jetpack
        .write(options.configFile, config);
      resolve(config);
    });
  }
};
