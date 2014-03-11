var q = require('q'),
    exec = require('child_process').exec,
    fs   = require('fs');

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
  exec(installCmd, function(err /*,  stdout, stderr */) {
    // if (stderr) {
    //   console.log(stderr);
    // }

    if (err) {
      console.log(err);
      deferred.reject(err);
    } else {
      deferred.resolve();
    }
  });

  return deferred.promise;
};