var Q = require('q');
var Request = require('superagent');
var Path = require('path');
var Jetpack = require('fs-jetpack');
var Crypto = require('crypto');
var Moment = require('moment');

module.exports = {
  backup: function(options, config, siteConfig) {
    var backupDateString = Moment().format('YYYY-MM-DDTHH-mm-ss');
    var blogFolder = Path.join(config.backupLocation, siteConfig.blog_id);
    var backupFolder = Path.join(blogFolder, backupDateString);
    var thisBackup = this;
    return thisBackup
      ._getBackupMeta(blogFolder)
      .then(function(backupMeta) {
        return Q.allSettled([
          thisBackup._backupPosts(options, siteConfig, backupFolder,
            backupMeta),
          thisBackup._backupComments(options, siteConfig,
            backupFolder,
            backupMeta),
          thisBackup._backupMedia(options, siteConfig, backupFolder,
            backupMeta)
        ]).then(function(results) {
          console.log(results);
          return thisBackup._saveBackupMeta(blogFolder, backupMeta);
        });
      });
  },

  _backupPosts: function(options, siteConfig, blogFolder, backupMeta) {
    return this._doBackup(siteConfig, blogFolder, backupMeta,
      1, 'posts', options.createApiUrl('sites/' + siteConfig.blog_id +
        '/posts'), {
        order: 'DESC',
        'order_by': 'ID'
      });
  },

  _backupComments: function(options, siteConfig, blogFolder, backupMeta) {
    return this._doBackup(siteConfig, blogFolder, backupMeta,
      1, 'comments', options.createApiUrl('sites/' + siteConfig.blog_id +
        '/comments'), {});
  },

  _backupMedia: function(options, siteConfig, blogFolder, backupMeta) {
    return this._doBackup(siteConfig, blogFolder, backupMeta,
      1, 'media', options.createApiUrl('sites/' + siteConfig.blog_id +
        '/media'), {
        order: 'DESC',
        'order_by': 'ID'
      });
  },

  _doBackup: function(siteConfig, blogFolder, backupMeta, page, type, url,
    queryOptions) {
    if (typeof(backupMeta[type]) !== 'object') {
      backupMeta[type] = {};
    }

    var thisBackup = this;
    return Q.promise(function(resolve, reject) {
      queryOptions.page = page;
      queryOptions.number = 20;

      Request
        .get(url)
        .set('Authorization', 'BEARER ' + siteConfig.access_token)
        .query(queryOptions)
        .end(function(err, res) {
          thisBackup
            ._saveData(err, res.body[type], type, blogFolder,
              backupMeta)
            .then(function() {
              console.log(type, res.body[type].length);
              if (res.body[type].length >= queryOptions.number) {
                return thisBackup._doBackup(siteConfig, blogFolder,
                  backupMeta, page + 1, type, url, queryOptions);
              }
            })
            .then(resolve)
            .catch(reject);
        });
    });
  },

  _getBackupMeta: function(blogFolder) {
    var backupMetaFile = Path.join(blogFolder, 'backup.json');
    return Jetpack
      .readAsync(backupMetaFile, 'jsonWithDates')
      .then(function(backupMeta) {
        if (backupMeta == null || backupMeta === '') {
          backupMeta = {};
        }
        return backupMeta;
      })
  },

  _saveBackupMeta: function(blogFolder, backupMeta) {
    var backupMetaFile = Path.join(blogFolder, 'backup.json');
    return Q.promise(function(resolve) {
      Jetpack.write(backupMetaFile, backupMeta);
      resolve(backupMeta);
    });
  },

  _saveData: function(err, dataArray, type, blogFolder, backupMeta) {
    var thisBackup = this;
    return Q.promise(function(resolve, reject) {
      if (err) {
        reject(new Error(err));
      } else {
        dataArray.forEach(function(data) {
          var dataString = JSON.stringify(data, null, 4);

          backupMeta[type][data.ID] = thisBackup._sha(dataString);

          var dataFile = Path.join(blogFolder, type + '-' +
            data.ID + '.json');
          Jetpack.write(dataFile, dataString);
        });
        resolve();
      }
    });
  },

  _sha: function(text) {
    var shasum = Crypto.createHash('sha1');
    shasum.update(text);
    return shasum.digest('hex');
  }
}
