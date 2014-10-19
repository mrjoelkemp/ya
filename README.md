# YA [![npm](http://img.shields.io/npm/v/ya.js.svg)](https://npmjs.org/package/ya.js) [![npm](http://img.shields.io/npm/dm/ya.js.svg)](https://npmjs.org/package/ya.js)

*Like "Ya mule!"*

1. [Motivation](#motivation)
2. [Usage](#usage)
 - [Automatically compile preprocessors](#automatically-compile-preprocessors)
 - [Automatically build your CommonJS or RequireJS app bundles](#automatically-build-your-browserify-or-requirejs-application-bundles)
 - [Automatically JSHint your apps](#automatically-jshint-all-of-your-js-files)
3. [More custom usage](#more-custom-build-tooling)
3. [Assumptions](#assumptions)
 - [Ignored Files and Directories](#ignored-files-and-directories)
4. [Examples](#examples)
 - [YA a New Project](#starting-a-new-project)
 - [YA an Existing Project](#ya-an-existing-project)
 - [Only using YA for preprocessors](#using-ya-only-for-preprocessor-compilation)
5. [Preprocessors Supported](#preprocessors-supported)
 - [CSS](#css)
 - [JS](#js)
 - [HTML](#html)
6. [Future Work](#future-work)
7. [Troubleshooting](#troubleshooting)
8. [Changelog](#changelog)

### Motivation

We shouldn't have to waste time defining and maintaining Grunt/Gulp/Broccoli configuration
files or build scripts. Our tools should do that for us.

The ultimate goal for YA is a zero-configuration tool for all front-end development build process needs.

YA is a tool that explores automatic, build-engine, configuration file generation.
It manages Grunt (currently, but could be user-choosen in the future) behind the scenes to
auto-generate and maintain your Gruntfile –
downloading any dependencies and recompiling changes along the way.

`npm install -g ya.js`

### Usage

Simply run `ya` in an empty or non-empty directory and it will start working for you.

`ya [directory]` (defaults to `.` if a directory is not supplied)

* [Known issue](https://github.com/mrjoelkemp/ya/issues/35) if you `ya` a subdirectory. `cd` into that directory and run `ya` in the interim.

That's it. Running the above command will do the following for you:

#### Automatically compile preprocessors

1. Generates a dummy package.json (if you don't already have one)
2. Downloads (as devDependencies) what's needed for any existing preprocessor files found in `[directory]`
3. Generate/overwrites a Gruntfile in `[directory]`
4. Compiles any existing preprocessor files. See [Supported Preprocessors](#preprocessors-supported).
5. Watches `[directory]` for new preprocessors (repeating steps 2 to 6)
6. Watches `[directory]` for changes and recompile changed files

#### Automatically build your Browserify or RequireJS application bundles

1. Determines the entry points (i.e., roots) to all JavaScript applications found in `[directory]`
2. For each root:
 - If it's a CommonJS app, YA auto-generates a Browserify configuration and creates `*-b-bundle.js` in `[directory]`
 * If it's an AMD app, YA auto-generates a RequireJS r.js configuration and creates a `*-r-bundle.js` file in `[directory]`
3. YA watches `[directory]` for any changes to the JS files and will regenerate the bundles
 - If your app root changes, YA will detect that and generate a new bundle

*Note:* The `*` in the bundle name is replaced with the filename of the app's root. For example, if your CommonJS app's main file is `index.js`, then YA will generate a Browserified bundle: `index-b-bundle.js`.

* The `-b-` in the bundle name stands for Browserify
* The `-r-` in the bundle name stands for RequireJS

#### Automatically JSHint all of your JS files

1. If you have a `.jshintrc` file in `[directory]`, YA will run JSHint on the modification
of any JS file in `[directory]`.

### More custom build tooling

If you need to customize the Gruntfile for more advanced/custom use-cases, modify the gruntfile and
just continue to use `grunt` instead of `ya`. **YA will overwrite the existing Gruntfile on every run.**

### Assumptions

YA assumes:

* You don't care about separating your preprocessed files from their compiled equivalents
 * YA compiles a file like `mydir/styles.scss` into `mydir/styles.css`
* You don't care about maintaining a Gruntfile
 * YA overwrites an existing Gruntfile (or creates one) in the directory being watched
* You want all grunt-specific plugins installed as devDependencies
* You'll take care of generating an index.html file that references any scripts/stylesheets you've created

#### Ignored Files and Directories

YA should only process/manage files relevant to your application, not its dependencies (or totally unrelated resources). Hence, the following files and folders are not processed by YA:

* Gruntfile.js
* node_modules/
* vendor/
* bower_components/
* .git/
* .sass-cache/
* `*-b-bundle.js` and `*-r-bundle.js` (the YA-built bundles)

### Examples

*Here are some walkthroughs of using YA*

#### Starting a new project

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

#### YA an existing project

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

#### Using YA only for preprocessor compilation

You can set the `preprocess` flag when running `ya` to avoid the JS processing
and only handle the automatic Grunt configuration for the preprocessors that you use.

`ya [directory] --preprocess=1`

This is helpful if, for example, you're building a Node.js app that doesn't need
browserify capability.

### Preprocessors Supported

#### CSS

* sass
* less
* stylus
* compass
 * YA expects Compass and/or SASS to be installed.
 * If Compass is not installed, YA will only use a sass compilation.
 * YA also respects projects created using `compass create` and will modify the settings to use the `sass/` and `stylesheets/` directories.

#### JS

* coffee
* jsx
* typescript

#### HTML

* slim
* jade

Adding support for a new preprocessor involves creating a
new `-settings.js` files in `ya/settings/` and adding the details about the
grunt plugin that should be used for compiling that preprocessor.

### Future Work

* Make the build engine choice configurable. You should be able to say `ya [build-engine] [directory]`.
 * Grunt: `ya grunt .`
 * Gulp: `ya gulp .`
 * Broccoli: `ya broccoli .`
* Allow for custom grunt tasks/plugins to get mixed in to allow for custom usage without abandoning YA.
* Automatic Image compression
* SASS Sourcemaps
* Live Reload
* Automatic test running
* Automatically fetch your vendor dependencies (like Backbone, Underscore, etc)

### Troubleshooting

* You may need to have `grunt` and `grunt-cli` installed globally. [Known Issue](https://github.com/mrjoelkemp/ya/issues/27)

* Beware of errors stemming from your preprocessor files. If you have errors in your SASS files, for example, it will kill YA and you'll need to restart it.

### Changelog

* v0.6.0 Added Browerify, R.js, and JSHint support
* v0.5.0 Typescript
* v0.4.0 Stylus
* v0.3.0 Added JSX Support
* v0.2.0 Added Slim Support
* v0.1.0 Added Compass Support
