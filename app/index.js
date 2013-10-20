
'use strict';
var util = require('util');
var path = require('path');
var spawn = require('child_process').spawn;
var yeoman = require('yeoman-generator');
// var colors = require('colors');

var SailsGenerator = module.exports = function SailsGenerator(args, options, config) {
  yeoman.generators.Base.apply(this, arguments);

  // setup the test-framework property, Gruntfile template will need this
  this.testFramework = options['test-framework'] || 'mocha';

  // for hooks to resolve on mocha by default
  if (!options['test-framework']) {
      options['test-framework'] = 'mocha';
  }

  // resolved to mocha by default (could be switched to jasmine for instance)
  this.hookFor('test-framework', {
      as: 'app'
  });

  this.indexFile = this.readFileAsString(path.join(this.sourceRoot(), 'index.html'));
  this.mainJsFile = '';
  this.mainCoffeeFile = 'console.log "\'Allo from CoffeeScript!"';

  this.on('end', function () {
    this.installDependencies({ skipInstall: options['skip-install'] });
  });

  this.pkg = JSON.parse(this.readFileAsString(path.join(__dirname, '../package.json')));
};

util.inherits(SailsGenerator, yeoman.generators.Base);

SailsGenerator.prototype.askFor = function askFor() {
  var cb = this.async();

  // have Yeoman greet the user.
  console.log(this.yeoman);

  console.log('Out of the box I include HTML5 Boilerplate, jQuery and Modernizr.');

  var prompts = [{
      name: 'compassBootstrap',
      message: 'Would you like to include Twitter Bootstrap for Sass?'
  }, {
      name: 'includeRequireJS',
      message: 'Would you like to include RequireJS (for AMD support)?'
  }];

  this.prompt(prompts, function (props) {
      // `props` is an object passed in containing the response values, named in
      // accordance with the `name` property from your prompt object. So, for us:
      this.compassBootstrap = props.compassBootstrap;
      this.includeRequireJS = props.includeRequireJS;

      cb();
  }.bind(this));
};

SailsGenerator.prototype.gruntfile = function gruntfile() {
    this.template('Gruntfile.js');
};

SailsGenerator.prototype.packageJSON = function packageJSON() {
    this.template('_package.json', 'package.json');
};

SailsGenerator.prototype.git = function git() {
    this.copy('gitignore', '.gitignore');
    this.copy('gitattributes', '.gitattributes');
};

SailsGenerator.prototype.bower = function bower() {
    this.copy('bowerrc', '.bowerrc');
    this.copy('_component.json', 'component.json');
};

SailsGenerator.prototype.jshint = function jshint() {
    this.copy('jshintrc', '.jshintrc');
};

SailsGenerator.prototype.editorConfig = function editorConfig() {
    this.copy('editorconfig', '.editorconfig');
};

SailsGenerator.prototype.h5bp = function h5bp() {
    this.copy('favicon.ico', 'app/favicon.ico');
    this.copy('404.html', 'app/404.html');
    this.copy('robots.txt', 'app/robots.txt');
    this.copy('htaccess', 'app/.htaccess');
};

SailsGenerator.prototype.bootstrapImg = function bootstrapImg() {
    if (this.compassBootstrap) {
        this.copy('glyphicons-halflings.png', 'app/images/glyphicons-halflings.png');
        this.copy('glyphicons-halflings-white.png', 'app/images/glyphicons-halflings-white.png');
    }
};

SailsGenerator.prototype.bootstrapJs = function bootstrapJs() {
    // TODO: create a Bower component for this
    if (this.includeRequireJS) {
        this.copy('bootstrap.js', 'app/scripts/vendor/bootstrap.js');
    }
};

SailsGenerator.prototype.mainStylesheet = function mainStylesheet() {
    if (this.compassBootstrap) {
        this.write('app/styles/main.scss', '$iconSpritePath: "../images/glyphicons-halflings.png";\n$iconWhiteSpritePath: "../images/glyphicons-halflings-white.png";\n\n@import \'sass-bootstrap/lib/bootstrap\';\n\n.hero-unit {\n    margin: 50px auto 0 auto;\n    width: 300px;\n}');
    } else {
        this.write('app/styles/main.css', 'body {\n    background: #fafafa;\n}\n\n.hero-unit {\n    margin: 50px auto 0 auto;\n    width: 300px;\n}');
    }
};

SailsGenerator.prototype.writeIndex = function writeIndex() {
    // prepare default content text
    var defaults = ['HTML5 Boilerplate', 'Twitter Bootstrap'];
    var contentText = ['        <div class="container">', '            <div class="hero-unit">', '                <h1>\'Allo, \'Allo!</h1>', '                <p>You now have</p>', '                <ul>'];

    if (!this.includeRequireJS) {
        this.indexFile = this.appendScripts(this.indexFile, 'scripts/main.js', ['components/jquery/jquery.js', 'scripts/main.js']);

        this.indexFile = this.appendFiles({
            html: this.indexFile,
            fileType: 'js',
            optimizedPath: 'scripts/coffee.js',
            sourceFileList: ['scripts/hello.js'],
            searchPath: '.tmp'
        });
    }

    if (this.compassBootstrap && !this.includeRequireJS) {
        // wire Twitter Bootstrap plugins
        this.indexFile = this.appendScripts(this.indexFile, 'scripts/plugins.js', ['components/sass-bootstrap/js/bootstrap-affix.js', 'components/sass-bootstrap/js/bootstrap-alert.js', 'components/sass-bootstrap/js/bootstrap-dropdown.js', 'components/sass-bootstrap/js/bootstrap-tooltip.js', 'components/sass-bootstrap/js/bootstrap-modal.js', 'components/sass-bootstrap/js/bootstrap-transition.js', 'components/sass-bootstrap/js/bootstrap-button.js', 'components/sass-bootstrap/js/bootstrap-popover.js', 'components/sass-bootstrap/js/bootstrap-typeahead.js', 'components/sass-bootstrap/js/bootstrap-carousel.js', 'components/sass-bootstrap/js/bootstrap-scrollspy.js', 'components/sass-bootstrap/js/bootstrap-collapse.js', 'components/sass-bootstrap/js/bootstrap-tab.js']);
    }

    if (this.includeRequireJS) {
        defaults.push('RequireJS');
    } else {
        this.mainJsFile = 'console.log(\'\\\'Allo \\\'Allo!\');';
    }

    // iterate over defaults and create content string
    defaults.forEach(function(el) {
        contentText.push('                    <li>' + el + '</li>');
    });

    contentText = contentText.concat(['                </ul>', '                <p>installed.</p>', '                <h3>Enjoy coding! - Yeoman</h3>', '            </div>', '        </div>', '']);

    // append the default content
    this.indexFile = this.indexFile.replace('<body>', '<body>\n' + contentText.join('\n'));
};

// TODO(mklabs): to be put in a subgenerator like rjs:app
SailsGenerator.prototype.requirejs = function requirejs() {
    if (this.includeRequireJS) {
        this.indexFile = this.appendScripts(this.indexFile, 'scripts/main.js', ['components/requirejs/require.js'], {
            'data-main': 'scripts/main'
        });

        // add a basic amd module
        this.write('app/scripts/app.js', ['/*global define */', 'define([], function () {', '    \'use strict\';\n', '    return \'\\\'Allo \\\'Allo!\';', '});'].join('\n'));

        this.mainJsFile = ['require.config({', '    paths: {', '        jquery: \'../components/jquery/jquery\',', '        bootstrap: \'vendor/bootstrap\'', '    },', '    shim: {', '        bootstrap: {', '            deps: [\'jquery\'],', '            exports: \'jquery\'', '        }', '    }', '});', '', 'require([\'app\', \'jquery\', \'bootstrap\'], function (app, $) {', '    \'use strict\';', '    // use app here', '    console.log(app);', '    console.log(\'Running jQuery %s\', $().jquery);', '});'].join('\n');
    }
};

SailsGenerator.prototype.app = function app() {
    this.mkdir('app');
    this.mkdir('app/scripts');
    this.mkdir('app/styles');
    this.mkdir('app/images');
    this.write('app/index.html', this.indexFile);
    this.write('app/scripts/main.js', this.mainJsFile);
    this.write('app/scripts/hello.coffee', this.mainCoffeeFile);
    this.directory('./sails', './');
};
