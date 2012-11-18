REPORTER ?= list

all: test build

build-lib:
	node tools/concat.js
build-min:
	java -jar tools/compiler.jar --js=animitter.js --js_output_file=animitter.min.js --compilation_level=ADVANCED_OPTIMIZATIONS --output_wrapper="(function(){%output%}());"
build: build-lib build-min
test:
	mocha --reporter $(REPORTER) test/*

.PHONY: test