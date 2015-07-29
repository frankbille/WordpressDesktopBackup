var Q = require('q');
var Request = require('superagent');
var Request2 = require('request');
var Path = require('path');
var Jetpack = require('fs-jetpack');
var Crypto = require('crypto');
var Moment = require('moment');
var Fs = require('fs');

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
            backupMeta),
          thisBackup._backupUsers(options, siteConfig, backupFolder,
            backupMeta),
          thisBackup._backupCategories(options, siteConfig,
            backupFolder, backupMeta),
          thisBackup._backupTags(options, siteConfig, backupFolder,
            backupMeta)
        ]).then(function(results) {
          return thisBackup._processBackup(blogFolder, backupFolder,
            backupMeta);
        }).then(function() {
          backupMeta.lastBackup = backupDateString;
          return thisBackup._saveBackupMeta(blogFolder, backupMeta);
        });
      });
  },

  _backupPosts: function(options, siteConfig, backupFolder, backupMeta, repo) {
    return this._doBackup(siteConfig, backupFolder, backupMeta,
      1, 'posts', options.createApiUrl('sites/' + siteConfig.blog_id +
        '/posts'));
  },

  _backupComments: function(options, siteConfig, backupFolder, backupMeta,
    repo) {
    return this._doBackup(siteConfig, backupFolder, backupMeta,
      1, 'comments', options.createApiUrl('sites/' + siteConfig.blog_id +
        '/comments'));
  },

  _backupMedia: function(options, siteConfig, backupFolder, backupMeta, repo) {
    return this._doBackup(siteConfig, backupFolder, backupMeta,
      1, 'media', options.createApiUrl('sites/' + siteConfig.blog_id +
        '/media'), this._downloadMediaEntry);
  },

  _downloadMediaEntry: function(backupFolder, mediaEntry, siteConfig) {
    var mediaFolder = Path.join(backupFolder, 'media');
    Jetpack.dir(mediaFolder);
    var mediaFilePath = Path.join(mediaFolder, mediaEntry.file);
    var fileStream = Fs.createWriteStream(mediaFilePath);
    fileStream.on('finish', function() {
      fileStream.close();
    });
    Request
      .get(mediaEntry.URL)
      .set('Authorization', 'BEARER ' + siteConfig.access_token)
      .pipe(fileStream);
  },

  _backupUsers: function(options, siteConfig, backupFolder, backupMeta, repo) {
    return this._doBackup(siteConfig, backupFolder, backupMeta,
      1, 'users', options.createApiUrl('sites/' + siteConfig.blog_id +
        '/users'));
  },

  _backupCategories: function(options, siteConfig, backupFolder, backupMeta,
    repo) {
    return this._doBackup(siteConfig, backupFolder, backupMeta,
      1, 'categories', options.createApiUrl('sites/' + siteConfig.blog_id +
        '/categories'));
  },

  _backupTags: function(options, siteConfig, backupFolder, backupMeta, repo) {
    return this._doBackup(siteConfig, backupFolder, backupMeta,
      1, 'tags', options.createApiUrl('sites/' + siteConfig.blog_id +
        '/tags'));
  },

  _doBackup: function(siteConfig, backupFolder, backupMeta, page, type, url,
    entryCallback) {
    if (typeof(backupMeta[type]) !== 'object') {
      backupMeta[type] = {};
    }

    var thisBackup = this;
    return Q.promise(function(resolve, reject) {
      Request
        .get(url)
        .set('Authorization', 'BEARER ' + siteConfig.access_token)
        .query({
          page: page,
          number: 100
        })
        .end(function(err, res) {
          thisBackup
            ._saveData(err, res.body[type], type, backupFolder,
              backupMeta, siteConfig, entryCallback)
            .then(function() {
              if (res.body[type].length >= 100) {
                return thisBackup._doBackup(siteConfig,
                  backupFolder, backupMeta, page + 1, type, url,
                  entryCallback);
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

  _saveData: function(err, dataArray, type, backupFolder, backupMeta,
    siteConfig, entryCallback) {
    var thisBackup = this;
    return Q.promise(function(resolve, reject) {
      if (err) {
        reject(new Error(err));
      } else {
        dataArray.forEach(function(data) {
          var dataString = JSON.stringify(data, null, 4);

          var fileName = type + '-' + data.ID + '.json';
          var filePath = Path.join(backupFolder, fileName);

          backupMeta[type][fileName] = thisBackup._sha(dataString);
          Jetpack.write(filePath, dataString);

          if (typeof(entryCallback) === 'function') {
            entryCallback(backupFolder, data, siteConfig);
          }
        });
        resolve();
      }
    });
  },

  _processBackup: function(blogFolder, backupFolder, backupMeta) {
    return Q.promise(function(resolve, reject) {
      if (typeof(backupMeta.lastBackup) === 'string') {
        var lastBackupFolder = Path.join(blogFolder, backupMeta.lastBackup);
      }
      resolve();
    });
  },

  _sha: function(text) {
    var shasum = Crypto.createHash('sha1');
    shasum.update(text);
    return shasum.digest('hex');
  }
}
