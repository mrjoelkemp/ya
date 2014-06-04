module.exports.lib = 'grunt-contrib-jade';
module.exports.useNewer = true;
module.exports.target = {
  jade: {
    dist: {
      files: [{
        expand: true,
        src: ['**/*.jade', '!node_modules/**/*.jade'],
        ext: '.html'
      }]
    }
  }
};