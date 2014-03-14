YA
===

*Like "Ya mule!"*

### Motivation

It's silly that we have to waste time defining configuration files or build scripts
for simple projects. Our tools should do that for us.

I just wanted to use my favorite preprocessors freely and have a tool download whatever
dependencies I need to make that happen – recompiling my changes along the way.

YA is that tool. It manages Grunt behind the scenes and auto-generates your Gruntfile.

`npm install ya.js`

### Usage

YA was built for ease of use.

`ya [directory]` (defaults to `.` if directory is not supplied)

Simply run `ya` in an empty or non-empty directory and it'll do the following:

1. generate a dummy package.json (if you don't have one)
2. download (as devDependencies) what's needed for any existing preprocessors
3. generate a Gruntfile in `directory`
4. compile any existing files
5. watch the directory for new preprocessors (repeating steps 2 to 4) or changes to recompile

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