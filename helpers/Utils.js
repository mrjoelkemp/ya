// Collection of little utility helpers
var fs  = require('fs'),
    q   = require('q');

// Shared collection of folders that should be ignored
// Basically, directories that don't contain files created
// for the ya'd project
module.exports.ignoredDirs = [
  'node_modules',
  '.git',
  '.sass-cache',
  'bower_components',
  'vendor'
];

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

module.exports.shallowExtend = function (obj1, obj2) {
  for (var key in obj2) {
    if (obj2.hasOwnProperty(key)) {
      obj1[key] = obj2[key];
    }
  }
};

module.exports.isEmptyObject = function (obj1) {
  return ! Object.keys(obj1).length;
};

module.exports.areArraysEqual = function (arr1, arr2) {
  if (arr1.length !== arr2.length) return false;

  for (var i = 0, l = arr1.length; i < l; i++) {
    if (arr1[i] !== arr2[i]) {
      return false;
    }
  }
};