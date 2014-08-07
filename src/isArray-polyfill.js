Array.isArray = Array.isArray || function(a){
    return ({}).toString.call(a) == '[object Array]';
};
