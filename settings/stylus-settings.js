module.exports.lib = 'grunt-contrib-stylus';
module.exports.target = {
  dist: {
    files: [{
      expand: true,
      src: ['**/*.stylus', '!node_modules/**/*.stylus'],
      ext: '.css'
    }]
  }
};