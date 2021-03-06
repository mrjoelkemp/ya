module.exports.lib = 'grunt-typescript';
module.exports.target = {
  typescript: {
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
  }
};