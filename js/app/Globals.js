// define a module which contains an Object (not a class)

define(function(){
    // variables are private due to closure and only accessible via the functions in the returned object.
    var _name = 'Grid Extract';

    // essentially the public API
    return {
        getName: function() {
            return _name;
        }
    };

});