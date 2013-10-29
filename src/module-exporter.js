if( typeof define === 'function' && define.amd ){
    define(function(){ return createAnimitter(this, inherits, EventEmitter); });
} else if( typeof require === 'function' ){
    module.exports = createAnimitter(this, require('util').inherits, require('events').EventEmitter);
} else {
    this.animitter = createAnimitter(this, inherits, EventEmitter);
}

