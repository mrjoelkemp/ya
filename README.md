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

### Example

*Here are some walkthroughs of using YA*

**Starting a new project**

* Make a new directory and `cd` into it
* Set up the directory however you like (add subfolders, use a Yeoman generator)
* Run `npm install ya.js` to install YA
* Run `ya` in the root of that directory (or specify a particular directory `ya app/assets`)
 * YA will detect the lack of a `package.json` file and mock one up for you
 * YA will download `grunt`, `grunt-cli`, and any other startup modules (as devDependencies)
* Create a new file like `styles.scss` anywhere within that directory or a subfolder
* YA will detect the use of the `.scss` preprocessor and do the following:
 * install `grunt-contrib-sass`
 * generate the Gruntfile.js that has the configuration to compile and watch `.scss` files
 * compile `styles.scss` into `styles.css` (in the same location)
 * initiate `grunt watch`
* Create files that use any of YA's supported preprocessors and YA will take care of it.

**YA an existing project**

* `cd` into your project's directory
* Run `ya` (or `ya [directory]` for `ya` to manage a subfolder)
* YA will scan the directory's files for preprocessor extensions (like `.scss`, `.coffee`, etc)
* For each preprocessor, YA will:
 * download the `grunt-contrib-*` package to compile the preprocessor
 * generate the Grunt config to compile and watch files using the preprocessor
* YA will generate `Gruntfile.js` into the directory it's managing
* YA will recompile any files using preprocessors
* YA will run `grunt watch` to watch for new preprocessors being used and for file changes

**Note: If you have an existing Gruntfile, YA will overwrite it.**

### Why should you use YA?

If you just need to build something quickly and don't want to waste time
maintaining a build script (like a Gruntfile or Gulpfile), then YA shines.

YA is not a tool for large-scale application development, but allows you
to use Grunt to take over where YA leaves off. YA sacrifices extensibility
for ease of use.

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
