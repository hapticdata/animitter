(function() {
    /*jshint sub: true */
    var karma = window["__karma__"],
        tests = Object.keys(karma.files).filter(function(f) {
            return (/\/tests\/spec-*/).test(f) &&
                  !(/\/tests\/runner.js/.test(f));
        });

    require({
        //urlArgs: new Date().getTime(),
        // Karma serves files from /base
        baseUrl: "/base",
        paths: {
            'chai' : 'node_modules/chai/chai'
        }
    }, tests, karma.start);

}());
