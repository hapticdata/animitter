Array.isArray = Array.isArray || function(a){
        return a.toString() == '[object Array]';
};
