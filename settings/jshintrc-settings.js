var utils = require('../helpers/Utils');

module.exports.lib = 'grunt-contrib-jshint';
module.exports.useNewer = true;
module.exports.target = {
  jshint: {
    options: {
      jshintrc: '.jshintrc',
      ignores: utils.ignoredDirs,
      // Don't fail the task
      force: true
    },
    all: ['**/*.js'].concat(utils.ignoredDirs.map(function (ignore) {
      return '!' + ignore + '/**/*';
    }))
  }
};