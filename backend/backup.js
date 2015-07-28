var Q = require('q');
var Request = require('superagent');
var Path = require('path');
var Jetpack = require('fs-jetpack');

module.exports = {
  backup: function(options, config, siteConfig) {
    var blogFolder = Path.join(config.backupLocation, siteConfig.blog_id);
    var thisBackup = this;
    return thisBackup
      ._getBackupMeta(blogFolder)
      .then(function(backupMeta) {
        return Q.allSettled([
          thisBackup._backupPosts(options, siteConfig, blogFolder,
            backupMeta),
          thisBackup._backupComments(options, siteConfig, blogFolder,
            backupMeta),
          thisBackup._backupMedia(options, siteConfig, blogFolder,
            backupMeta)
        ]).then(function(results) {
          return thisBackup._saveBackupMeta(blogFolder, backupMeta);
        });
      });
  },

  _backupPosts: function(options, siteConfig, blogFolder, backupMeta) {
    if (typeof(backupMeta.posts) !== 'number') {
      backupMeta.posts = 0;
    }
    return this._doBackupPosts(options, siteConfig, blogFolder, backupMeta,
      backupMeta.posts, 1);
  },

  _doBackupPosts: function(options, siteConfig, blogFolder, backupMeta,
    maxPostId, page) {
    var thisBackup = this;
    return Q.promise(function(resolve, reject) {
      Request
        .get(options.createApiUrl('sites/' + siteConfig.blog_id +
          '/posts'))
        .set('Authorization', 'BEARER ' + siteConfig.access_token)
        .query('order', 'DESC')
        .query('order_by', 'ID')
        .query('page', page)
        .end(function(err, res) {
          console.log(res.meta);
          thisBackup
            ._saveData(err, res.body.posts, 'posts', blogFolder,
              backupMeta)
            .then(function() {
              if (backupMeta.posts > maxPostId) {
                return thisBackup._doBackupPosts(options,
                  siteConfig, blogFolder, backupMeta, maxPostId,
                  page + 1);
              } else {
                resolve();
              }
            })
            .catch(reject);
        });
    });
  },

  _backupComments: function(options, siteConfig, blogFolder, backupMeta) {
    var thisBackup = this;
    return Q.promise(function(resolve, reject) {
      Request
        .get(options.createApiUrl('sites/' + siteConfig.blog_id +
          '/comments'))
        .set('Authorization', 'BEARER ' + siteConfig.access_token)
        .end(function(err, res) {
          thisBackup
            ._saveData(err, res.body.comments, 'comments',
              blogFolder,
              backupMeta)
            .then(resolve)
            .catch(reject);
        });
    });
  },

  _backupMedia: function(options, siteConfig, blogFolder, backupMeta) {
    var thisBackup = this;
    return Q.promise(function(resolve, reject) {
      Request
        .get(options.createApiUrl('sites/' + siteConfig.blog_id +
          '/media'))
        .query('order', 'DESC')
        .query('order_by', 'ID')
        .set('Authorization', 'BEARER ' + siteConfig.access_token)
        .end(function(err, res) {
          thisBackup
            ._saveData(err, res.body.media, 'media', blogFolder,
              backupMeta)
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
    return Q.promise(function(resolve, reject) {
      if (err) {
        reject(new Error(err));
      } else {
        dataArray.forEach(function(data) {
          var id = data.ID;
          if (id > backupMeta[type]) {
            backupMeta[type] = id;
          }

          var dataFile = Path.join(blogFolder, type + '-' +
            data.ID + '.json');
          Jetpack.write(dataFile, data);
        });
        resolve();
      }
    });
  }
}
