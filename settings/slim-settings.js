module.exports.lib = 'grunt-slim';
module.exports.target = {
  slim: {
    dist: {
      files: [{
        expand: true,
        src: ['**/*.slim', '!node_modules/**/*.slim'],
        ext: '.html'
      }]
    }
  }
};