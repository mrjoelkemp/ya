module.exports.lib = 'grunt-contrib-coffee';
module.exports.target = {
  coffee: {
    dist: {
      files: [{
        expand: true,
        src: ['**/*.coffee', '!node_modules/**/*.coffee'],
        ext: '.js'
      }]
    }
  }
};