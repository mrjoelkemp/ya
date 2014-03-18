module.exports.lib = 'grunt-contrib-stylus';
module.exports.targetName = 'stylus';
module.exports.target = {
  dist: {
    files: [{
      expand: true,
      src: ['**/*.styl', '!node_modules/**/*.styl'],
      ext: '.css'
    }]
  }
};