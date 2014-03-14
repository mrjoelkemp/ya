module.exports.lib = 'grunt-contrib-less';
module.exports.target = {
  dist: {
    files: [{
      expand: true,
      src: ['**/*.less', '!node_modules/**/*.less'],
      ext: '.css'
    }]
  }
};