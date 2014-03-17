var q = require('q'),
    exec  = require('child_process').exec,
    fs    = require('fs'),
    utils = require('./Utils');

// A library/module is already installed if its folder exists
// within node_modules
// TODO: Why not just use require.resolve?
module.exports.isLibInstalled = function (lib) {
  var installDir = './node_modules/' + lib,
      deferred = q.defer();

  fs.exists(installDir, function (exists) {
    deferred.resolve(exists);
  });

  return deferred.promise;
};

// Installs the given library as a dev dependency
// and resolve when done or if the lib was already installed
module.exports.installLib = function (lib) {
  var deferred = q.defer(),
      // Get the grunt package to install
      installCmd = 'npm install --save-dev ' + lib;

  // Install it
  exec(installCmd, function(err) {
    if (err) {
      console.log(err);
      deferred.reject(err);
    } else {
      deferred.resolve();
    }
  });

  return deferred.promise;
};

module.exports.hasPackageJsonFile = function (directory) {
  if (! directory) throw new Error('directory not given');

  var deferred = q.defer();

  // TODO: Are we guaranteed for the package.json file to live in supplied directory?
  directory = utils.slashDir(directory);

  fs.exists(directory + 'package.json', function (exists) {
    deferred.resolve(exists);
  });

  return deferred.promise;
};

// Returns a json object representing an empty package.json file
module.exports.getDummyPackageJson = function () {
  return {
    'author': '',
    'name': '',
    'description': '',
    'version': '',
    'repository': {
      'url': ''
    },
    'dependencies': {},
    'devDependencies': {
      'ya.js': '*'
    },
    'main': '',
    'license': ''
  };
};

// Generates and saves an empty package.json file in
// the passed directory
module.exports.createEmptyPackageJsonFile = function (directory) {
  directory = utils.slashDir(directory);

  var emptyPackageFile = JSON.stringify(this.getDummyPackageJson(), null, 2),
      deferred = q.defer();

  fs.writeFile(directory + 'package.json', emptyPackageFile, function (err) {
    if (err) deferred.reject();
    else deferred.resolve();
  });

  return deferred.promise;
};