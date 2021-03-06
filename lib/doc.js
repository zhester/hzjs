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
/*?jspp { "include" : { "hz" : [ "html", "util" ] } } ?*/


/*----------------------------------------------------------------------------
Additions to Base Types
----------------------------------------------------------------------------*/

/**
 *  Gives tables the ability to add a row from an array of data values.
 *
 *  @param data The data to insert into the new row
 *  @return     The new table row element that was created
 */
HTMLTableElement.prototype.appendDataRow = function( data ) {
    var tr = this.insertRow( -1 );
    if( ( data instanceof Array ) == false ) {
        data = [ data ];
    }
    var td;
    for( var i = 0; i < data.length; ++i ) {
        td = tr.insertCell( -1 );
        td.appendChild( document.createTextNode( data[ i ] ) );
    }
    return tr;
};


/**
 *  Gives tables the ability to drop all rows.
 *
 */
HTMLTableElement.prototype.deleteAllRows = function() {
    var num_rows = this.rows.length;
    for( var i = 0; i < num_rows; ++i ) {
        this.deleteRow( -1 );
    }
};


/*----------------------------------------------------------------------------
Hz Document Submodule
----------------------------------------------------------------------------*/
hz.doc = ( function( ns ) {

    /*------------------------------------------------------------------------
    Public Properties
    ------------------------------------------------------------------------*/

    ns.status_stack = status_stack; //expose the status stack class
    ns.structure    = structure;    //expose the structure class


    /*------------------------------------------------------------------------
    Public Methods
    ------------------------------------------------------------------------*/

    /**
     *  Simplifies the creation and population of complex document structure.
     *  The simplification comes from not needing to write a lot of DOM
     *  create/append calls.  Instead, only the information needed to build
     *  the portion of the DOM is specified in a nested array structure.
     *
     *  The specification string is known as DTL: Document Tree Literals.  It
     *  is currently documented in development/dtl.md
     *
     *  Note: This is intended to replace the hz.doc.structure class.  It's
     *  use is considered deprecated for new code.
     *
     *  @param dtl Document Tree Literal array or string
     *  @return    An HTMLElement of the root node in the specification
     *  @throws    A string exception if one of the child node specifiers is
     *             is of an unknown type.
     */
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

            //Set up an optimized text accessor.
            root._text_nodes = [];
            root.textAccess  = _text_accessor;
        }

        //Scan through remaining "arguments" in the node specifier.
        var num_args = dtl.length;
        var arg, arg_type, num_subargs, subarg, text_node;
        for( var i = 1; i < num_args; ++i ) {

            //Null arguments do nothing.
            if( dtl[ i ] === null ) {
                continue;
            }

            //Set some shortcuts.
            arg = dtl[ i ];
            arg_type = typeof arg;

            //Strings are assumed to be the contents of new text nodes.
            if( arg_type === 'string' ) {
                text_node = document.createTextNode( arg );
                node.appendChild( text_node );
                root._text_nodes.push( text_node );
            }

            //Other objects are evaluated more thoroughly.
            else if( arg_type === 'object' ) {

                //Numeric array: assume it's a list of child nodes.
                if( 0 in arg ) {
                    num_subargs = arg.length;
                    for( var j = 0; j < num_subargs; ++j ) {
                        subarg = arg[ j ];

                        //Non-objects should be text nodes.
                        if( typeof subarg !== 'object' ) {
                            node.appendChild(
                                document.createTextNode( subarg )
                            );
                        }

                        //Check for DOM nodes.
                        else if( ( 'nodeType' in subarg     )
                         && ( ( subarg.nodeType == 1 )
                           || ( subarg.nodeType == 3 ) ) ) {
                            node.appendChild( subarg );
                        }

                        //Assume it's a node specifier.
                        else {
                            node.appendChild( ns.build( subarg, root ) );
                        }
                    }
                }

                //Associative array: containing attributes.
                else {
                    for( var key in arg ) {
                        if( arg.hasOwnProperty( key ) == false ) {
                            continue;
                        }
                        switch( key ) {
                            case 'id':
                                node.id = arg[ key ];
                                //See if we can auto-assign the property.
                                if( ( arg[ key ] in root ) == false ) {
                                    root[ arg[ key ] ] = node;
                                }
                                break;
                            case 'class':
                                node.className = arg[ key ];
                                break;
                            default:
                                //Property-style event handlers.
                                if( key.substr( 0, 2 ) == 'on' ) {
                                    node[ key ] = arg[ key ];
                                }
                                //Normal DOM attribute assignment.
                                else {
                                    node.setAttribute( key, arg[ key ] );
                                }
                                break;
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
    };


    /**
     *  Optimized text value accessor method for objects that contain DOM text
     *  nodes.
     *
     *  @param index  The linear index into the list of text nodes
     *                If not specified, all text node values are returned.
     *  @param setval The string value to set in the specified text node.
     *                If not specified, nothing is updated.
     *  @return       If the index is not given, a list of the values of all
     *                text nodes in the object are returned.
     *                If the index is given (and valid), the value of the text
     *                node is returned.
     *                If an error occurs, null is returned.
     */
    function _text_accessor() {
        var index  = arguments.length > 0 ? arguments[ 0 ] : false;
        var setval = arguments.length > 1 ? arguments[ 1 ] : false;
        if( index === false ) {
            var values = [];
            for( var i = 0; i < this._text_nodes.length; ++i ) {
                values.push( this._text_nodes[ i ].nodeValue );
            }
            return values;
        }
        if( index < this._text_nodes.length ) {
            if( setval !== false ) {
                this._text_nodes[ index ].nodeValue = setval;
            }
            return this._text_nodes[ index ].nodeValue;
        }
        return null;
    }


    /**
     *  Convenience method for quickly creating a primitive (data only) table
     *  element.
     *
     *  @param data     Optional 2D array of data to pre-populate
     *  @param headings Optional array of column heading labels
     *  @return         An HTMLTableElement
     */
    ns.create_table = function() {
        var data     = arguments.length > 0 ? arguments [ 0 ] : [];
        var headings = arguments.length > 1 ? arguments [ 1 ] : [];
        var te = document.createElement( 'table' );
        if( headings.length > 0 ) {
            var tr = te.insertRow( 0 );
            var th;
            for( var i = 0; i < headings.length; ++i ) {
                th = document.createElement( 'th' );
                th.appendChild( document.createTextNode( headings[ i ] ) );
                tr.appendChild( th );
            }
        }
        for( var i = 0; i < data.length; ++i ) {
            te.appendDataRow( data[ i ] );
        }
        return te;
    };


    /**
     *  Prefixes relative URLs in anchor elements.
     *
     *  @param element The root element from which to search for anchors
     *  @param prefix  The prefix to place before relative URLs
     */
    ns.pf_rel_url = function( element, prefix ) {
        var anchors = element.getElementsByTagName( 'a' );
        var num_anchors = anchors.length;
        var href;
        for( var i = 0; i < num_anchors; ++i ) {
            if( anchors[ i ].hasAttribute( 'href' ) ) {
                href = anchors[ i ].getAttribute( 'href' );
                if( ( href[ 0 ] != '/'                     )
                 && ( href.match( /^https?:\/\// ) == null ) ) {
                    anchors[ i ].setAttribute( 'href', prefix + href );
                }
            }
        }
    };


    /*------------------------------------------------------------------------
    Classes
    ------------------------------------------------------------------------*/

    /**
     *  Provides a set of methods to consistently manage a "stack" of status
     *  messages as document elements.
     *
     *  @param element    The element that will contain the status stack
     *  @param disruptive Set to false to use internal ID values (slower), or
     *                    leave default (true) to use DOM IDs.
     */
    function status_stack( element ) {
        this.element    = element;
        this.disruptive = arguments.length > 1 ? arguments[ 1 ] : true;
        this.idkey      = this.disruptive == true ? 'id' : 'hz.doc.id';
    }

    /**
     *  Append an element to the stack.
     *
     *  @param element The element to append to the status stack
     *  @return        The status element's ID value
     */
    status_stack.prototype.append = function( element ) {
        var id = hz.util.rand_id();
        hz.util.oset( element, this.idkey, id );
        this.element.appendChild( element );
        return id;
    };

    /**
     *  Append an element to the stack that removes itself from the stack
     *  after a set period of time.
     *
     *  @param element The element to append to the status stack
     *  @param timeout A timeout (ms) when the element will remove itself
     *  @return        The status element's ID value
     */
    status_stack.prototype.append_transient = function( element ) {
        var timeout = arguments.length > 1 ? arguments[ 1 ] : 8000;
        var context = this;
        var docid   = this.append( element );
        window.setTimeout(
            function( event ) { context.remove( docid ); },
            timeout
        );
        return docid;
    };

    /**
     *  Convenience method to construct a simple status message that removes
     *  itself after the transient's default timeout.
     *
     *  @param message The message to display in the status element
     *  @param cname   Optional class name to assign to the containing element
     *  @return        The status element's ID value
     */
    status_stack.prototype.message = function( message ) {
        var cname = arguments.length > 1 ? arguments[ 1 ] : '';
        var p = document.createElement( 'p' );
        p.className = cname;
        p.appendChild( document.createTextNode( message ) );
        return this.append_transient( p );
    };

    /**
     *  Remove a status element from the stack given its ID value.
     *
     *  @param id The ID value of the status element to remove
     *  @return   The DOM element that was removed
     */
    status_stack.prototype.remove = function( id ) {
        var rm = null;
        if( this.disruptive == true ) {
            rm = document.getElementById( id );
        }
        else {
            var num = this.element.childNodes.length;
            var docid;
            for( var i = 0; i < num; ++i ) {
                rm    = this.element.childNodes[ i ];
                docid = hz.util.oget( rm, this.idkey );
                if( ( docid != null ) && ( docid == id ) ) {
                    break;
                }
            }
            if( rm == null ) {
                throw new Error( 'Unable to remove element with ID = ' + id );
            }
        }
        return this.element.removeChild( rm );
    };


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
        if( hz.html.is_terminal( elem ) == false ) {
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
