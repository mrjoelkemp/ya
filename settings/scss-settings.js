var q = require('q'),
    deferred = q.defer(),
    exec     = require('child_process').exec,
    utils    = require('../helpers/Utils');

var
  compassSettings = {
    lib: 'grunt-contrib-compass',
    targetName: 'compass',
    target: {
      dist: {
        options: {
          sassDir: '.',
          cssDir:  '.'
        }
      }
    }
  },

  sassSettings = {
    lib: 'grunt-contrib-sass',
    targetName: 'sass',
    target: {
      dist: {
        files: [{
          expand: true,
          src: ['**/*.{scss, sass}', '!node_modules/**/*.{scss, sass}'],
          ext: '.css'
        }]
      }
    }
  };

// Resolves with whether or not the Compass gem is installed
function isCompassInstalled() {
  var deferred = q.defer(),
      cmd = 'compass';

  exec(cmd, function (err) {
    deferred.resolve(! err);
  });

  return deferred.promise;
}

// Whether or not the directory structure was auto-generated
// from compass create.
// Note: auto-generation is determined by the existence of
// the sass and stylesheets directories
function wasCompassCreate() {
  return q.all([utils.exists('sass'), utils.exists('stylesheets')])
    .then(function (results) {
      return results[0] && results[1];
    });
}


// Check if compass is installed
isCompassInstalled()
  .then(function (isInstalled) {
    if (isInstalled) {
      wasCompassCreate().then(function (wasGenenerated) {
        // Use the sass/ and stylesheets/ folders
        if (wasGenenerated) {
          compassSettings.target.dist.options.sassDir = 'sass';
          compassSettings.target.dist.options.cssDir  = 'stylesheets';
        }

        deferred.resolve(compassSettings);
      });
    } else {
      deferred.resolve(sassSettings);
    }
  });

module.exports = deferred.promise;