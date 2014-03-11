module.exports.lib = 'grunt-contrib-sass';
// Special case when the extension doesn't match the target
// Note: grunt-contrib-sass expects the target to be named sass
module.exports.targetName = 'sass';
module.exports.target = {
  dist: {
    files: [{
      expand: true,
      src: ['**/*.{scss, sass}', '!node_modules/**/*.{scss, sass}'],
      ext: '.css'
    }]
  }
};