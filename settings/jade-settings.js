module.exports.lib = 'grunt-contrib-jade';
module.exports.target = {
  dist: {
    files: [{
      expand: true,
      src: ['**/*.jade', '!node_modules/**/*.jade'],
      ext: '.html'
    }]
  }
};