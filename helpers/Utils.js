// Collection of little utility helpers
var fs = require('fs'),
    q = require('q');

// Helper to return a slash-trailed version of the directory name
module.exports.slashDir = function (directory) {
  return directory[directory.length - 1] === '/' ? directory : directory + '/';
};

// Promisified version of fs.exists
module.exports.exists = function (path) {
  var deferred = q.defer();

  fs.exists(path, function (exists) {
    deferred.resolve(exists);
  });

  return deferred.promise;
};