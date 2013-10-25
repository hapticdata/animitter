REPORTER ?= list
KARMA_TESTER ?=./node_modules/karma/bin/karma start karma.conf.js
all: build test

build-lib:
	node tools/concat.js
build-min:
	java -jar tools/compiler.jar --js=animitter.js --js_output_file=animitter.min.js --compilation_level=ADVANCED_OPTIMIZATIONS --output_wrapper="(function(){%output%}());"
build: build-lib build-min
test:
	$(KARMA_TESTER) --single-run
test-watch:
	$(KARMA_TESTER)

.PHONY: test
