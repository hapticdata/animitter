module.exports = function(grunt){

    var banner = '// Animitter @VERSION\n// Build: @DATE\n// by [Kyle Phillips](http://haptic-data.com)\n// Available under [MIT License](http://github.com/hapticdata/animitter/blob/master/LICENSE)\n// Env: Browser + Node';

    var pkg = grunt.file.readJSON('package.json');

    //Project configuration
    grunt.initConfig({
        pkg: pkg,
        banner: banner
            .replace(/@VERSION/g, pkg.version)
            .replace(/@DATE/g, grunt.template.today('yyyy-mm-dd')) + '\n',
        uglify: {
            options: {
                banner: '<%= banner %>',
                report: 'min'
            },
            dist: {
                src: '<%= concat.target.dest %>',
                dest: '<%= pkg.name.toLowerCase() %>.min.js'
            }
        },
        concat: {
            options: {
                banner: '<%= banner %>\n(function(){\n',
                footer: '\n})();'
            },
            target: {
                dest: '<%= pkg.name %>.js',
                src: [
                    './src/module-exporter.js',
                    './src/rAF-polyfill.js',
                    './src/isArray-polyfill.js',
                    './src/date-now-polyfill.js',
                    './src/animitter-factory.js',
                    './src/events.js',
                    './src/inherits.js'
                ]
            }
        },
        karma: {
            options: {
                // frameworks to use
                frameworks: ['mocha', 'requirejs'],
                // list of files / patterns to load in the browser
                files: [
                    'node_modules/requirejs/require.js',
                    'tests/runner.js',
                    {pattern: 'animitter.js', included: false },
                    {pattern: 'node_modules/**/*.js', included: false },
                    {pattern: 'tests/**/*.js', included: false}
                ],
                // list of files to exclude
                exclude: [ '**/*.swp', '*.swp' ],
                browsers: ['Chrome'],
                captureTimeout: 60000,
                autoWatch: true
            },
            continuous: {
                singleRun: true,
                browsers: ['PhantomJS']
            },
            headless: {
                browsers: ['PhantomJS']
            },
            dev: {
                browsers: ['Chrome', 'Firefox']
            }
        },
        mochaTest: {
            test: {
                options: {
                    reporter: 'spec'
                },
                src: ['tests/**/spec-*.js']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.registerTask('default',['concat', 'uglify']);
    grunt.registerTask('test', ['karma:continuous', 'mochaTest']);
};
