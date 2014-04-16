/*****************************************************************************
Hz Document Module

*****************************************************************************/

/*----------------------------------------------------------------------------
Hz Library Boilerplate
----------------------------------------------------------------------------*/
var hz = ( function( ns ) { return ns; } )( hz || {} );


/*----------------------------------------------------------------------------
Module Dependencies
----------------------------------------------------------------------------*/
/*?jspp { "include" : { "hz" : [] } } ?*/


/*----------------------------------------------------------------------------
Hz Document Submodule
----------------------------------------------------------------------------*/
hz.doc = ( function( ns ) {

    /*------------------------------------------------------------------------
    Public Properties
    ------------------------------------------------------------------------*/

    ns.structure  = structure;      //expose the structure class

    //list of HTML elements that should not have children
    ns.self_close = [ 'area', 'br', 'col', 'embed', 'hr',
                      'img', 'input', 'link', 'meta', 'param' ];

    /*------------------------------------------------------------------------
    Public Methods
    ------------------------------------------------------------------------*/

    /*------------------------------------------------------------------------
    Classes
    ------------------------------------------------------------------------*/

    /**
     *  Provides a set of methods to consistently manage a "stack" of status
     *  messages as document elements.
     */
    function status_stack() {
        //// ZIH - TBD
    }


    /**
     *  Simplifies the creation and population of complex document structure.
     *  The simplification comes from not needing to write a lot of DOM
     *  create/append calls.  Instead, a very lightweight tree string format
     *  is defined to allow a single, short string to specify a complete
     *  document fragment.
     *
     *  The specification format defines the list of tag names to construct in
     *  the requested hierarchy.  Tag names are separated by commas.
     *  Descending the hierarchy is done with colons.  Ascending the tree is
     *  done with semicolons.  For example:
     *
     *      h1,p,p,h2,p,h2,ul:li,li,li;p:strong,_text_;h2,p
     *
     *  A special name "_text_" is used to indicate a pure text node.
     *
     *  Nodes are dereferenced by index in order of their serialization.
     *  This allows easily specifying default text values as a flat array.
     *  Elements/nodes can also be fetched by their index.
     *
     *  @param spec   Document structure specification
     *  @param values Optional list of text values to insert
     */
    function structure( spec ) {
        var values   = arguments.length > 1 ? arguments[ 1 ] : [];
        this.element = document.createElement( 'div' );
        this.nodes   = [];
        this._create( spec, values );
    }

    /**
     *  Allows a user to quickly bind the generated elements to any object.
     *
     *  @param obj     The target object
     *  @param keys    An array of object keys to bind each element.  Specify
     *                 a key as null to prevent binding it.
     *  @param set_ids If true, all keys are assigned to the elements as their
     *                 DOM IDs.  If a string, all the keys are prefixed with
     *                 the parameter before being assigned as IDs.
     */
    structure.prototype.bind_object = function( obj, keys ) {
        var set_ids = arguments.length > 2 ? arguments[ 2 ] : false;
        var num_elems = Math.min( keys.length, this.nodes.length );
        for( var i = 0; i < num_elems; ++i ) {
            if( keys[ i ] != null ) {
                obj[ keys[ i ] ] = this.nodes[ i ];
                if( set_ids === true ) {
                    obj[ keys[ i ] ].id = keys[ i ];
                }
                else if( set_ids !== false ) {
                    obj[ keys[ i ] ].id = set_ids + keys[ i ];
                }
            }
        }
    };

    /**
     *  Supports the get_element() interface for Hz library objects.
     *
     *  @return The root document element representing this object
     */
    structure.prototype.get_element = function() {
        //request spool-style appending (if we get a choice) to avoid
        //  injecting the base container
        if( ( 'hz' in this.element ) == false ) { this.element.hz = {} };
        this.element.hz.spool = true;
        return this.element;
    };

    /**
     *  Requests one of the constructed nodes by serialized index.
     *
     *  @param index The serialized index of the node to fetch
     *  @return      The corresponding document element or node
     */
    structure.prototype.get_node = function( index ) {
        if( ( index < 0 ) || ( index >= this.nodes.length ) ) {
            throw new Error( 'Invalid structure index.' );
        }
        return this.nodes[ index ];
    };

    /**
     *  Get a text value based on serialized index.
     *
     *  @param index The serialized index of the text node
     *  @return      The text stored in the node
     */
    structure.prototype.get_text = function( index ) {
        if( ( index < 0 ) || ( index >= this.nodes.length ) ) {
            throw new Error( 'Invalid structure index.' );
        }
        var node = this.nodes[ index ];
        if( node && node.nodeType == 3 ) {
            return node.nodeValue;
        }
        else if( node.firstChild.nodeType == 3 ) {
            return node.firstChild.nodeValue;
        }
        throw new Error( 'Unable to get text for invalid node.' );
    };

    /**
     *  Set a text value based on serialized index.  The idea is to provide a
     *  must faster way of updating text content within the structure (no need
     *  to query the DOM for elements in a hierarchy).
     *
     *  @param index The serialized index of the text node
     *  @param value The value to store in the text node
     */
    structure.prototype.set_text = function( index, value ) {
        if( ( index < 0 ) || ( index >= this.nodes.length ) ) {
            throw new Error( 'Invalid structure index.' );
        }
        var node = this.nodes[ index ];
        if( node && node.nodeType == 3 ) {
            node.nodeValue = value;
        }
        else if( node.firstChild.nodeType == 3 ) {
            node.firstChild.nodeValue = value;
        }
        else {
            throw new Error( 'Unable to set text for invalid node.' );
        }
    };

    /**
     *  Appends a text node with a given value to the specified element.
     *  Note: Self-closing tags do not get text nodes appended to them.
     *  Note: If the value is passed as null, no text node is appended.
     *
     *  @param elem  The element to which the new text node is appended.
     *  @param value The value to use for the new text node.
     */
    structure.prototype._apptnode = function( elem, value ) {
        if( ns.self_close.indexOf( elem.tagName.toLowerCase() ) == -1 ) {
            if( value !== null ) {
                elem.appendChild( document.createTextNode( value ) );
            }
        }
    };

    /**
     *  Creates the document structure from the given specification.
     *  Note: Who let the C programmer in here?
     *
     *  @param spec   Document structure specification
     *  @param values List of text values to insert
     */
    structure.prototype._create = function( spec, values ) {
        var new_state, node, token, value;
        var context = this;
        var stack  = [];
        var state  = { 'i' : 0, 'e' : this.element };
        var tokens = spec.split( /([,:;])/ );
        for( var i = 0, j = 0; i < tokens.length; ++i ) {
            token = tokens[ i ];
            switch( token ) {
                case '':
                    continue;
                    break;
                case ',':
                    state.i += 1;
                    break;
                case ':':
                    new_state = { 'i' : 0, 'e' : node };
                    stack.push( state );
                    state = new_state;
                    break;
                case ';':
                    state = stack.pop();
                    break;
                default:
                    value = values.length > 0 ? values.shift() : '';
                    if( token == '_text_' ) {
                        this._apptnode( state.e, value );
                        this.nodes[ j ] = state.e.lastChild;
                        this.nodes[ j ].set_text = ( function( index ) {
                            return function( value ) {
                                var cnode = context.nodes[ index ];
                                cnode.nodeValue = value;
                            };
                        } )( j );
                    }
                    else {
                        node = document.createElement( token );
                        this._apptnode( node, value );
                        state.e.appendChild( node );
                        this.nodes[ j ] = node;
                        this.nodes[ j ].set_text = ( function( index ) {
                            return function( value ) {
                                var cnode = context.nodes[ index ];
                                cnode.firstChild.nodeValue = value;
                            };
                        } )( j );
                    }
                    j += 1;
                    break;
            }
        }
    };


    /*------------------------------------------------------------------------
    Private Properties
    ------------------------------------------------------------------------*/

    /*------------------------------------------------------------------------
    Private Methods
    ------------------------------------------------------------------------*/


    return ns;
} )( hz.doc || {} );