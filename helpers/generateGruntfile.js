module.exports = function (generatedConfig) {

  return function(grunt) {
    var path = require('path');

    require('load-grunt-tasks')(grunt);

    grunt.initConfig(generatedConfig);

    grunt.registerTask('default', ['watch']);

    // Handle new files with that have a new, supported preprocessor
    grunt.event.on('watch', function(action, filepath) {
      if (action !== 'added') return;

      // This is a special message that's parsed by Mule
      // to determine if support for an additional preprocessor is necessary
      // Note: this allows us to avoid controlling grunt manually within Mule
      console.log('EXTADDED:' + path.extname(filepath));
    });

    // For watching entire directories but allowing
    // the grunt.event binding to take care of it
    grunt.registerTask('noop', function () {});
  };
};