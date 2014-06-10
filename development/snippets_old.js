
/**
 * load_js
 * Imports JavaScript into the page
 */
function load_js(uri) {
    var scr = document.createElement('script');
    scr.setAttribute('type', 'text/javascript');
    scr.setAttribute('src', uri);
    document.getElementsByTagName('head').item(0).appendChild(scr);
}


//Position finding.
function get_position(elem) {
    var left = elem.offsetLeft;
    var top = elem.offsetTop;
    while(elem.offsetParent) {
        left += elem.offsetParent.offsetLeft;
        top += elem.offsetParent.offsetTop;
        elem = elem.offsetParent;
    }
    return([left, top]);
};

//Dimension finding.
function get_dimensions(elem) {
    return([elem.offsetWidth, elem.offsetHeight]);
};


/**
 * Function.inherit
 * Allows a function to inherit prototypes from a parent.
 *
 * To call the parent constructor inside the child's constructor:
 *  this.ParentClass();
 *
 * To call an overridden parent method inside a child method:
 *  ParentClass.prototype.ParentMethod.apply(this, arguments);
 *
 * @parent The parent class (function) from which to inherit.
 */
Function.prototype.inherit = function(parent) {

    //Find out of the parent is really a function.
    var pc = parent.toString();
    var m = pc.match(/\s*function ([^(]+)\(/);

    //Set up the parent constructor.
    if(m != null) { this.prototype[m[1]] = parent; }

    //Assign parent methods to this function's prototype.
    for(var k in parent.prototype) {
        this.prototype[k] = parent.prototype[k];
    }
};
