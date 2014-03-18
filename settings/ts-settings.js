module.exports.lib = 'grunt-typescript';
module.exports.targetName = 'typescript';
module.exports.target = {
  dist: {
    options: {
      module: 'commonjs'
    },
    files: [{
      expand: true,
      src: ['**/*.ts', '!node_modules/**/*.ts'],
      ext: '.js'
    }]
  }
};