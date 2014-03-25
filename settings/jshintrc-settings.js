module.exports.lib = 'grunt-contrib-jshint';
module.exports.target = {
  jshint: {
    options: {
      jshintrc: '.jshintrc'
    },
    all: {
      src: '**/*.js'
    }
  }
};