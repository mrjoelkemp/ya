var JSH   = require('../helpers/JsHelper'),
    jsh = new JSH(process.argv[2] || '.');

module.exports = jsh.getSettings();