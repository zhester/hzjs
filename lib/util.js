/*****************************************************************************
Hz Utility Module



TODO:
  - make an "onenter" handler function, and an agumentation helper to add it
    to an input element
  - add style transition support to hz.util.remove.  the event name is
    'transitionend' (start a transition, then handle the event, and remove
    the element in the handler).

*****************************************************************************/

/*----------------------------------------------------------------------------
Hz Library Boilerplate
----------------------------------------------------------------------------*/
var hz = ( function( ns ) { return ns; } )( hz || {} );


/*----------------------------------------------------------------------------
Hz Utilities Submodule
----------------------------------------------------------------------------*/
hz.util = ( function( ns ) {

    /*------------------------------------------------------------------------
    Public Properties
    ------------------------------------------------------------------------*/

    ns.structure  = structure;      //expose the structure class
    ns.transition = transition;     //expose the transition class

    //lists of file size units used in the fsize function
    ns.fsunits = [
        [
            [ 'B', 'kB', 'MB', 'GB', 'TB', 'PB' ],
            [ 'bytes', 'kilobytes', 'megabytes', 'gigabytes', 'terabytes',
              'petabytes' ]
        ],
        [
            [ 'B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB' ],
            [ 'bytes', 'kibibytes', 'mebibytes', 'gibibytes', 'tebibytes',
              'pebibytes' ]
        ]
    ];

    //list of HTML elements that should not have children
    ns.sclose = [ 'area', 'br', 'col', 'embed', 'hr',
                  'img', 'input', 'link', 'meta', 'param' ];


    /*------------------------------------------------------------------------
    Public Methods
    ------------------------------------------------------------------------*/

    /**
     *  Attempts to append almost anything to an element.
     *  @param elem The parent element appending the child
     *  @param data Something to append (string, number, object, element)
     *  @return The node or element that was appended
     */
    ns.append = function() {
        var elem  = arguments.length > 0 ? arguments[ 0 ] : null;
        var data  = arguments.length > 1 ? arguments[ 1 ] : null;
        var node;
        var spool = false;
        //check for null parent argument
        if( elem === null ) {
            elem = document.body;
        }
        //special-case usage (no arguments), create a block container
        if( arguments.length == 0 ) {
            node = document.createElement( 'div' );
        }
        //null passed, create an empty text node
        else if( data === null ) {
            node = document.createTextNode( '' );
        }
        //object passed, play duck-duck-goose until we find something useful
        else if( typeof data === 'object' ) {
            //if the object appears to be a DOM node, use it directly
            if( ( 'nodeType' in data )
             && ( typeof data.nodeType === 'number' ) ) {
                node = data;
            }
            //if the object has a way to extract a DOM element, get it
            else if( 'get_element' in data ) {
                node = data.get_element();
            }
            //if the object has a way to generate HTML, fetch it
            else if( 'get_html' in data ) {
                node = document.createElement( 'div' );
                node.innerHTML = data.get_html();
                spool = true;
            }
            //if the object can be safely converted to a string, do it
            else if( 'toString' in data  ) {
                node = document.createTextNode( data.toString() );
            }
            //the object is stubborn, inform the developer of a problem
            else {
                throw new Error( 'Attempted to append invalid object.' );
            }
        }
        //function passed, attempt to append whatever it returns
        else if( typeof data === 'function' ) {
            ns.append( elem, data() );
        }
        //this is (hopefully) a primitive type that we can treat as plain text
        else {
            node = document.createTextNode( data );
        }
        //spool all elements from a node onto the end of the target node
        if( spool == true ) {
            while( node.firstChild != null ) {
                elem.appendChild( node.firstChild );
            }
        }
        //normal, single-element appending, use internal append
        else {
            _append( elem, node );
        }

        //return the node that was appended
        return node;
    };


    /**
     *  Empties a DOM element of all of its children given its ID.
     *
     *  @param id The ID of the element to empty
     */
    ns.empty_id = function( id ) {
        var element = ns.gid( id );
        while( element.firstChild != null ) {
            element.removeChild( element.firstChild );
        }
    };


    /**
     *  Modifies an element's height to completely fill the remaining vertical
     *  space of a reference element.  If the reference element happens to be
     *  the document element, the target element will fill the remainder of
     *  the viewport.
     *
     *  @param elem   The target element to resize
     *  @param relem  The reference element to attempt to fill
     *  @param bounce Optional amount of margin below the target element
     *  @return       Height value that was used to resize the element
     */
    ns.fill_vertical = function( elem, relem ) {

        //check/default the bounce argument
        var bounce = arguments.length > 2 ? arguments[ 2 ] : 0;

        //retrieve the bounding rectangles of both elements
        var elem_rect  = elem.getBoundingClientRect();
        var relem_rect = relem.getBoundingClientRect();

        //determine the height that will be filled
        var fill_height = relem_rect.height;
        if( relem.clientHeight ) {
            fill_height = relem.clientHeight;
        }

        //get the target element's current style information
        var style = window.getComputedStyle( elem, null );

        //compensate for other styling factors that add padding/borders
        var inner_height = parseInt( style.getPropertyValue( 'height' ) );
        var vertical_padding = elem_rect.height - inner_height;

        //compensate for differences in the tops of both elements
        var vertical_offset = elem_rect.top - relem_rect.top;

        //compute the new height of target element
        var height = fill_height - vertical_offset - vertical_padding - bounce;

        //resize to and report the new height
        elem.style.height = height + 'px';
        return height;
    };


    /**
     *  Makes it easy to display file sizes.
     *
     *  @param size      The file size in bytes
     *  @param flags     Optional formatting flags (default is 0)
     *                     1 : enable verbose unit names
     *                     2 : use IEC units (just to mess with folks)
     *  @param precision Optional formatted number precision (default is 2)
     *  @return          A string describing the storage size of a file
     */
    ns.fsize = function( size ) {
        var errmsg = 'Attempted format invalid file size: ' + size;
        if( size < 0 ) {
            throw new Error( errmsg );
        }
        var flags     = arguments.length > 1 ? arguments[ 1 ] : 0;
        var precision = arguments.length > 2 ? arguments[ 2 ] : 2;
        var units = ns.fsunits[ ( flags & 2 ) >> 1 ][ flags & 1 ];
        var order = size;
        var index = 0;
        while( order >= 1024 ) {
            order /= 1024;
            index += 1;
        }
        if( index >= units.length ) {
            throw new Error( errmsg );
        }
        return order.toFixed( precision ) + ' ' + units[ index ];
    };


    /**
     *  Gets an element out of the document given its ID.  It helps extract
     *  more useful information about why I can't access an element.
     *
     *  @param id     The ID of the element to retrieve
     *  @return       A DOM element from the document with the given ID
     *  @throws Error That tells me it couldn't find an element with that ID
     */
    ns.gid = function( id ) {
        var elem;
        var errmsg = 'No element found with ID = "' + id + '"';
        if( typeof id !== 'string' ) {
            throw new Error( 'Attempted to get element with non-string ID.' );
        }
        if( id.length <= 0 ) {
            throw new Error( 'Attempted to get element with empty ID.' );
        }
        try {
            elem = document.getElementById( id );
        }
        catch( error ) {
            throw new Error( errmsg );
        }
        if( elem == null ) {
            throw new Error( errmsg );
        }
        return elem;
    };


    /**
     *  Attempts to create a value suitable as a DOM ID from many kinds of
     *  values.
     *
     *  @param value     The primitive or object for which to generate an ID
     *  @param check_dom Optionally detect DOM collisions
     *  @return          A string suitable for use as a DOM ID
     */
    ns.make_id = function( value ) {
        var check_dom = arguments.length > 1 ? arguments[ 1 ] : false;
        var new_id;
        if( typeof value === 'number' ) {
            new_id = 'idn_' + value.toFixed( 0 ).toString();
        }
        else if( typeof value === 'object' ) {
            if( 'toString' in value ) {
                new_id = ns.make_id( value.toString() );
            }
            else if( value instanceof Array ) {
                new_id = ns.make_id( value.join( '_' ) );
            }
            var sig = [];
            for( var key in value ) {
                if( typeof value[ key ] !== 'object' ) {
                    sig.push( key + '_' + value[ key ] );
                }
                if( sig.length > 8 ) {
                    break;
                }
            }
            new_id = 'ido_' + sig.join( '_' );
        }
        else {
            new_id = value.replace( /\s+/g, '_' );
            new_id = 'ids_' + new_id.replace( /[^a-zA-Z0-9_]/g, '' );
        }
        if( check_dom == true ) {
            var counter = 0;
            while( document.getElementById( new_id ) != null ) {
                new_id = new_id.replace( /\d+$/, '' ) + counter;
                counter += 1;
            }
        }
        return new_id;
    };


    /**
     *  Object property getter.
     *
     *  @param obj   The object for which to get a property
     *  @param bind  A binding key into the object.  This may contain periods
     *               to indicate checking/creating sub-objects.
     *  @return      The value in the object, null if none found
     */
    ns.oget = function( obj, bind ) {
        var keys = bind.split( '.' );
        var node = obj;
        for( var i = 0; i < keys.length; ++i ) {
            if( typeof node !== 'object' ) {
                return null;
            }
            else if( ( keys[ i ] in node ) == false ) {
                return null;
            }
            node = node[ keys[ i ] ];
        }
        return node;
    };


    /**
     *  Object property injector.
     *
     *  @param obj  The object for which to set properties
     *  @param data Another object full of properties I want in the first one
     */
    ns.omap = function( obj, data ) {
        for( var key in data ) {
            obj[ key ] = data[ key ];
        }
    };


    /**
     *  Object property setter.
     *
     *  @param obj   The object for which to set a property
     *  @param bind  A binding key into the object.  This may contain periods
     *               to indicate checking/creating sub-objects.
     *  @param value The value to set in the object
     */
    ns.oset = function( obj, bind, value ) {
        var keys = bind.split( '.' );
        if( keys.length == 1 ) {
            obj[ bind ] = value;
            return;
        }
        var node = obj;
        for( var i = 0; i < ( keys.length - 1 ); ++i ) {
            if( ( keys[ i ] in node ) == false ) {
                node[ keys[ i ] ] = {};
            }
            node = node[ keys[ i ] ];
        }
        node[ ( keys.length - 1 ) ] = value;
    };


    /**
     *  Pushes a transition onto the transition stack.  The next time an
     *  element is appended to the document, the style transitions will be
     *  applied automatically.
     *
     *  @param trans The transition object to push
     */
    ns.push_transition = function( trans ) {
        _trans_stack.push( trans );
    };


    /**
     *  Remove an element from a parent element.
     *
     *  @param elem  The parent element from which to remove
     *  @param child A DOM element or ID of an element to remove
     *  @return      The element that was removed
     */
    ns.remove = function( elem, child ) {
        if( elem === null ) {
            elem = document.body;
        }
        if( typeof child === 'object' ) {
            if( ( 'nodeType' in child )
             && ( typeof child.nodeType === 'number' ) ) {
                return elem.removeChild( child );
            }
            throw new Error( 'Unable to remove object ' + child );
        }
        else if( typeof child === 'string' ) {
            return elem.removeChild( ns.gid( child ) );
        }
        else if( ( typeof child === 'number' ) && ( ( child % 1 ) == 0 ) ) {
            if( child < elem.childNodes.length ) {
                return elem.removeChild( elem.childNodes[ child ] );
            }
            throw new Error( 'Unable to resolve child by offset ' + child );
        }
        throw new Error( 'Unable to resolve child ' + child );
    };


    /**
     *  Set the default transition for major document modifications.
     *
     *  @param trans Optional transition object to set (defaults to opacity)
     */
    ns.set_default_transition = function() {
        var trans = arguments.length > 0 ? arguments[ 0 ]
            : new transition( { 'opacity' : null } );
        _trans_default = trans;
    };


    /**
     *
     */
    ns.create_style_sheet = function() {
        var element = document.createElement( 'style' );
        document.head.appendChild( element );
        return element.sheet;
    };


    /**
     *
     */
    ns.append_styles = function( sheet, styles ) {
        var buffer, pname, prop, selector;
        for( selector in styles ) {
            buffer = '';
            prop = styles[ selector ];
            for( pname in prop ) {
                buffer += pname + ':' + prop[ pname ] + ';\n';
            }
            sheet.insertRule(
                selector + '{' + buffer + '}',
                sheet.cssRules.length
            );
        }
    };


    /*------------------------------------------------------------------------
    Classes
    ------------------------------------------------------------------------*/

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
     *      h1,p,p,h2,p,h2,ul:li,li,li;p:strong,null;h2,p
     *
     *  A special name "null" is used to indicate a pure text node.
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
     *  Supports the get_element() interface for Hz library objects.
     *
     *  @return The root document element representing this object
     */
    structure.prototype.get_element = function() {
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
        if( ns.sclose.indexOf( elem.tagName.toLowerCase() ) == -1 ) {
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
                    if( token == 'null' ) {
                        this._apptnode( state.e, value );
                        this.nodes[ j ] = state.e.lastChild;
                    }
                    else {
                        node = document.createElement( token );
                        this._apptnode( node, value );
                        state.e.appendChild( node );
                        this.nodes[ j ] = node;
                    }
                    j += 1;
                    break;
            }
        }
    };


    /**
     *  Supports a common interface to specifying style property transitions
     *  for various element actions (appending, event handling, etc).
     *
     *  Note: It's acceptable to use more than two values across all
     *  properties.  However, the user is then responsible for invoking the
     *  set() method, and passing the value index.
     *
     *  @param properties An object of property names with initial and final
     *                    values
     *                      { 'opacity':[0.0,1.0], 'color':['red','blue'] }
     *                    Some properties can be set to null, and get assumed
     *                    initial/final values.
     *  @param invert     Optional: Auto-generated values are inverted
     */
    function transition( properties ) {
        this.properties = properties;
        this.invert     = arguments.length > 1 ? arguments[ 1 ] : false;
        for( var key in this.properties ) {
            if( this.properties[ key ] == null ) {
                switch( key ) {
                    case 'opacity':
                        this.properties[ key ] = this.invert ?
                            [ '1.0', '0.0' ] : [ '0.0', '1.0' ];
                        break;
                    case 'visibility':
                        this.properties[ key ] = this.invert ?
                            [ 'visible', 'hidden' ] : [ 'hidden', 'visible' ];
                        break;
                }
            }
        }
    }

    /**
     *  Set transition properties on the element.
     *
     *  @param elem  The element whose properties are set
     *  @param stage The stage in the transition (0=initial,1=final)
     */
    transition.prototype.set = function( elem, stage ) {
        if( ( 'style' in elem ) == false ) {
            return;
        }
        for( var key in this.properties ) {
            if( this.properties[ key ] != null ) {
                window.getComputedStyle( elem )[ key ];
                elem.style[ key ] = this.properties[ key ][ stage ];
            }
        }
    };

    /**
     *  Set the initial transition properties on the element.
     *
     *  @param elem The element whose properties are set
     */
    transition.prototype.set_initial = function( elem ) {
        this.set( elem, 0 );
    };

    /**
     *  Set the final transition properties on the element.
     *
     *  @param elem The element whose properties are set
     */
    transition.prototype.set_final = function( elem ) {
        this.set( elem, 1 );
    };


    /*------------------------------------------------------------------------
    Private Properties
    ------------------------------------------------------------------------*/

    var _trans_stack   = [];        //style transition stack
    var _trans_default = null;      //default transition (when stack is empty)


    /*------------------------------------------------------------------------
    Private Methods
    ------------------------------------------------------------------------*/

    /**
     *  Append an element with possible extra features.
     *
     *  @param parent
     *  @param child
     *  @return
     */
    function _append( parent, child ) {
        var result, trans;
        if( 'style' in child ) {
            if( _trans_stack.length > 0 ) {
                trans = _trans_stack.pop();
                trans.set_initial( child );
                result = parent.appendChild( child );
                trans.set_final( child );
                return result;
            }
            else if( _trans_default != null ) {
                _trans_default.set_initial( child );
                result = parent.appendChild( child );
                _trans_default.set_final( child );
                return result;
            }
        }
        return parent.appendChild( child );
    }


    return ns;
} )( hz.util || {} );
