'use strict';
/**
 * Test Example - A JSDoc plugin for generating test files by parsing @example
 *
 * @module    {object} test-example
 *
 * @version   0.3.0
 *
 * @see       {@link https://techquery.github.io/test-example|Offical Web site}
 *
 * @copyright TechQuery <shiy007@qq.com> 2017
 */
const Path = require('path'), FS = require('fs-extra');

/**
 * **Config namespace** of this plugin
 *
 * @namespace test-example
 *
 * @example  // Merge those options below to your JSDoc `config.json`
 *     {
 *         "plugins":         ["node_modules/test-example"],
 *         "test-example":    {
 *             "sourcePath":    "path/to/source/directory",
 *             "overWrite":     true,
 *             "headerFile":    "path/to/test/header.js",
 *             "hookModule":    "path/to/plugin/hook"
 *         }
 *     }
 */
const config = require('jsdoc/env').conf['test-example'] || { },
      TestFile = require('./TestFile');

/**
 * Relative directory path of the **Source module**
 *
 * @name sourcePath
 * @type {string}
 *
 * @memberof test-example
 */
const sourcePath = Path.join(process.cwd(),  config.sourcePath || ''),
      testPath = Path.join(process.cwd(), 'test');

/**
 * Path of **Common test code** prepended to every test file
 *
 * @name headerFile
 * @type {string}
 *
 * @memberof test-example
 */
const header = config.headerFile  &&
          FS.existsSync( config.headerFile )  &&
          FS.readFileSync( config.headerFile );

/**
 * Path of the **Hook module**
 *
 * @name hookModule
 * @type {string}
 *
 * @memberof test-example
 */
const hook = config.hookModule && require(
          Path.join(process.cwd(), config.hookModule)
      );

var file;


exports.handlers = {
    beforeParse:     function (event) {

        file = new TestFile( Path.relative(sourcePath, event.filename) );

        for (var handler in hook)  file.on(handler,  hook[ handler ]);

        if (! /\s*define\(/.test( event.source ))
            file.addHeader(
                `var ${file.ID} = require('${Path.relative(
                    Path.join(testPath, file.URI),
                    Path.join(sourcePath, file.URI)
                )}')`
            );
    },
    newDoclet:       function(event) {

        file.addUnit( event.doclet );
    },
    fileComplete:    function (event) {

        var fileName = Path.join(testPath, file.URI);

        /**
         * Overwrite existed test files or not
         *
         * @name overWrite
         * @type {boolean}
         *
         * @memberof test-example
         */
        if ((! file[0])  ||  (
            FS.existsSync( fileName )  &&  (! config.overWrite)
        ))
            return;

        if ( header )  file.addHeader( header );

        FS.outputFileSync(fileName,  file + '');

        console.log(`\n\t[Test file] ${fileName}\n`);
    }
};
