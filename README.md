YA
===

*Like "Ya mule!"*

### Motivation

Tools like Grunt and Gulp are good for large applications. However, for smaller projects,
we shouldn't have to waste time defining configuration files or build scripts.
Our tools should do that for us – downloading any dependencies and
recompiling changes along the way.

YA is that tool. It manages Grunt behind the scenes and auto-generates your Gruntfile.

`npm install ya.js`

### Usage

`ya [directory]` (defaults to `.` if directory is not supplied)

That's it. Simply run `ya` in an empty or non-empty directory and it'll do the following for you

1. generate a dummy package.json (if you don't have one)
2. download (as devDependencies) what's needed for any existing preprocessors found in `directory`
3. generate/overwrite a Gruntfile in `directory`
4. compile any existing files
5. watch `directory` for new preprocessors (repeating steps 2 to 6)
6. watch `directory` for changes and recompile

If you need to customize the Gruntfile for more advanced uses, modify the gruntfile and
just continue to use `grunt` instead of `ya`.

### Preprocessors Supported

**CSS**

* sass
* less

**JS**

* coffee

**HTML**

* jade

Adding support for a new preprocessor involves creating a
new `-settings.js` files in `ya/settings/` and adding the details about the
grunt plugin that should be used for compiling that preprocessor.
