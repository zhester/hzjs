/*
This is the new document tree builder: DTL implementation.

Document Tree Literals

A tree literal consists of nested arrays of tree data.  The arrays allow
efficient literal notation for transport over JSON and as in-script literals.
There is no string parser needed, so the "builder" is vastly simplified.

Furthermore, the DTN version of some document fragments became a bit
cumbersome (fewer and fewer one-line literals for basic fragments).

A document tree literal starts as an array of one or more elements.

The first element is always the element name (tag name).

The following elements are interchangeable, and JavaScript type detection is
used to sort out how to use them.  Order is somewhat important, however, so
it's best to stick to a few basic conventions to keep your tree literals
easier to maintain.

The types of the 2nd through Nth elements determine how they are used in
constructing the document fragment:

    - array(0): a list of child nodes to build and append
    - array('a'): an associative array of attributes to assign
    - string: used as the node value of a new text node
    - number: used as the node value of a new text node
    - object:
        - DOM HTMLElement: appended
        - DOM HTMLCollection: individual nodes are reattached here
        - getDOM(): retrieved and appended
        - toString(): retrieved and used as a new text node

An example:

<div>
    <h1>Heading</h1>
    <p class="example">Paragraph 1</p>
    <p>Paragraph 2</p>
</div>

[ 'div',
  [
    [ 'h1', 'Heading' ],
    [ 'p', {'class':'example'}, 'Paragraph 1' ],
    [ 'p', 'Paragraph 2' ]
  ]
]


*/

Element.prototype.addClass = function( className ) {
    if( this.className.length == 0 ) {
        this.className = className;
    }
    else {
        var classes = this.className.split( /\s+/ );
        if( classes.indexOf( className ) == -1 ) {
            classes.push( className );
        }
        this.className = classes.join( ' ' );
    }
};
Element.prototype.removeClass = function( className ) {
    if( this.className.length == 0 ) {
        return;
    }
    var classes = this.className.split( /\s+/ );
    var index = classes.indexOf( className );
    if( index != -1 ) {
        this.className = classes.splice( index, 1 ).join( ' ' );
    }
};


var ns = {};

    ns.build = function( dtl ) {

        //See if we are building relative an outside root node.
        var root = arguments.length > 1 ? arguments[ 1 ] : null;

        //See if we got a string instead of the expected array
        if( typeof dtl === 'string' ) {

            //Check for slightly compressed JSON.
            var result = dtl.match( /^\[\w+,/ );
            if( result != null ) {

                //Expand the compressed JSON.
                dtl = dtl.replace(
                    /(\[(\w+),)|({(\w+):)/g,
                    function( match, sub0, sub1, sub2, sub3 ) {
                        if( match[ 0 ] == '{' ) {
                            return '{"' + sub3 + '":';
                        }
                        return '["' + sub1 + '",';
                    }
                );
            }

            //Parse the JSON back into a DTL-style specification.
            dtl = JSON.parse( dtl );
        }

        //Create the node we are building.
        var node = document.createElement( dtl[ 0 ] );

        //See if this is also the root node.
        if( root == null ) {
            root = node;
        }

        //Scan through remaining "arguments" in the node specifier.
        var num_args = dtl.length;
        var arg, arg_type, num_subargs;
        for( var i = 1; i < num_args; ++i ) {

            //Set some shortcuts.
            arg = dtl[ i ];
            arg_type = typeof arg;

            //Strings are assumed to be the contents of new text nodes.
            if( arg_type === 'string' ) {
                node.appendChild( document.createTextNode( arg ) );
            }

            //Other objects are evaluated more thoroughly.
            else if( arg_type === 'object' ) {

                //Object appears to be a DOM node.
                if( ( 'nodeType' in arg )
                 && ( ( arg.nodeType == 1 ) || ( arg.nodeType == 3 ) ) ) {
                     node.appendChild( arg );
                }

                //Numeric array: assume it's a list of child nodes.
                else if( 0 in arg ) {
                    num_subargs = arg.length;
                    for( var j = 0; j < num_subargs; ++j ) {
                        node.appendChild( ns.build( arg[ j ] ), root );
                    }
                }

                //Associative array: containing attributes.
                else {
                    for( var key in arg ) {
                        if( arg.hasOwnProperty( key ) ) {
                            switch( key ) {
                                case 'id':
                                    node.id = arg[ key ];
                                    root[ key ] = node;
                                    break;
                                case 'class':
                                    node.className = arg[ key ];
                                    break;
                                default:
                                    node.setAttribute( key, arg[ key ] );
                                    break;
                            }
                        }
                    }
                }
            }

            //This argument is not known to us.
            else {
                throw 'Unknown DTL argument type.';
                //console.log( arg );
            }
        }

        //Return the constructed node.
        return node;
    }




function main( argv ) {
    include(
        //[ '../lib/html.js', '../lib/util.js' ],
        [ '../lib/html.js' ],
        function() {

            var div   = document.body.append( '<div>' );
            var txt   = div.append( '<textarea>' );
            txt.rows  = 10;
            txt.cols  = 60;
            //txt.value = '["div",[["h1","Heading"],["p","para 1"],["p","para 2"]]]';
            txt.value = '[div,[[h1,"Heading"],[p,{class:"example"},"para 1"],[p,"para 2"]]]';
            div = document.body.append( '<div>' );
            var btn     = div.append( '<input>' );
            btn.type    = 'button';
            btn.value   = 'Render';
            btn.onclick = function( event ) {
                //var dtl = JSON.parse( txt.value );
                //var fragment = ns.build( dtl );
                var fragment = ns.build( txt.value );
                target.appendChild( fragment );
            };

            btn = div.append( '<input>' );
            btn.type    = 'button';
            btn.value   = 'Clear';
            btn.onclick = function( event ) {
                target.removeChildren();
            };

            var target = document.body.append( '<div>' );
            target.id  = 'target';
            target.style.border = 'dashed 1px green';

        }
    );
}
