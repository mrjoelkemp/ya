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

// Returns a slash-trailed version of the directory name
// Returns an empty string if given an empty string
// Throws if given a non-string
module.exports.slashDir = function (directory) {
  if (typeof directory !== 'string') throw new Error('directory is not a string');

  if (! directory) return '';

  return directory[directory.length - 1] === '/' ? directory : directory + '/';
};

// Returns a dot-prefixed version of the given extension
// Returns an empty string if given an empty string
// Throws if not given a string
module.exports.dotExt = function (ext) {
  if (typeof ext !== 'string') throw new Error('extension is not a string');

  if (! ext) return '';

  return ext[0] === '.' ? ext : '.' + ext;
};

// Promisified version of fs.exists
module.exports.exists = function (path) {
  var deferred = q.defer();

  fs.exists(path, function (exists) {
    deferred.resolve(exists);
  });

  return deferred.promise;
};

// (Shallow) Copies the properties from obj2 onto obj1.
module.exports.shallowExtend = function (obj1, obj2) {
  for (var key in obj2) {
    if (obj2.hasOwnProperty(key)) {
      obj1[key] = obj2[key];
    }
  }
};

// Returns true if the given object is empty, false otherwise.
module.exports.isEmptyObject = function (obj1) {
  return ! Object.keys(obj1).length;
};

// Returns true if the given arrays are equal, false otherwise.
module.exports.areArraysEqual = function (arr1, arr2) {
  if (! (arr1 instanceof Array) || ! (arr2 instanceof Array)) {
    throw new Error('arguments must be an array');
  }

  if (arr1.length !== arr2.length) return false;

  for (var i = 0, l = arr1.length; i < l; i++) {
    if (arr1[i] !== arr2[i]) {
      return false;
    }
  }

  return true;
};

// Binds all methods of obj and obj's prototype to obj
// for easy async chaining
module.exports.bindAll = function (obj) {
  if (typeof obj !== 'object') throw new Error('cannot bind a non-object');

  // Get all properties of the object and its prototype
  var props = Object.keys(obj).concat(Object.keys(Object.getPrototypeOf(obj)));

  props.forEach(function (prop) {
    if (typeof obj[prop] !== 'function') return;

    obj[prop] = obj[prop].bind(obj);
  });
};