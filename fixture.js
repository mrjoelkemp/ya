var npmh = require('./helpers/NpmHelper'),
    fs = require('fs'),
    q = require('q');

/**
 * The sanbox directory path
 * @type {String}
 */
var sandboxPath = './sandbox';

/**
 * Creates the sandbox directory if it doesn't exist
 * @return {Promise} Resolves when the sandbox directory has been created,
 *                   rejects on failure to create the directory
 */
function createSandboxDirectory() {
  var deferred = q.defer();

  fs.exists(sandboxPath, function(exists) {
    if (!exists) {
      fs.mkdir(sandboxPath, function(err) {
        if (err) deferred.reject(arguments);
        else deferred.resolve();
      });
    }
  });

  return deferred.promise;
}

/**
 * Installs all supported build engine plugins
 * so that the tests don't need to.
 * @return {Promise} Resolves when all plugins have been installed
 */
function installBuildEnginePlugins() {
  var settings = [
    require('./settings/coffee-settings'),
    require('./settings/jade-settings'),
    require('./settings/jsx-settings'),
    require('./settings/less-settings'),
    require('./settings/slim-settings'),
    require('./settings/styl-settings'),
    require('./settings/ts-settings'),
    require('./settings/scss-settings')
  ],

  // TODO: JS settings are dynamic based on the module type

  // TODO: Change current working directory
  //
  promises = settings.map(function(settings) {
    return npmh.installIfNecessary(settings.lib);
  });

  return q.all(promises);
}

/**
 * Entry point to fixturizing to prep for testing
 */
(function main() {
  createSandboxDirectory()
  .then(installBuildEnginePlugins)
  .then(function() {
    console.log('Finished fixturizing. \n Run tests with npm test');
  });
})();
