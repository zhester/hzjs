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
Module Dependencies
----------------------------------------------------------------------------*/
/*?jspp { "include" : { "hz" : [] } } ?*/


/*----------------------------------------------------------------------------
Additions to Base Types
----------------------------------------------------------------------------*/

/**
 *  Provides concise syntax for simply transforming an array in-place.
 *  Unlike Array.prototype.map(), this function assigns the returned values
 *  to the current array rather than constructing and returning a new array.
 *
 *  @param callback The function to call on each item in the array
 *                  This function must return the value to use to replace the
 *                  original value in the array.
 */
Array.prototype.transform = function( callback ) {
    for( var i = 0; i < this.length; ++i ) {
        this[ i ] = callback( this[ i ] );
    }
};


/*----------------------------------------------------------------------------
Hz Utilities Submodule
----------------------------------------------------------------------------*/
hz.util = ( function( ns ) {

    /*------------------------------------------------------------------------
    Public Properties
    ------------------------------------------------------------------------*/

    ns.icollection = icollection;   //expose the icollection interface class
    ns.transition  = transition;    //expose the transition class

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
                //check for a spool request
                if( ( 'hz' in node ) && ( node.hz.spool ) ) {
                    spool = true;
                }
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
     *  Checks/converts any MIME-style content-type string into the base type
     *  for easier use in verifying content with specific character sets.
     *
     *  @param ctype The content-type string to check/convert
     *  @param etype Optionally, check the given type to see if the base types
     *               of both match.
     *  @return      The base 'genus/species' of the type string.  If the
     *               optional etype parameter is given, returns true if the
     *               base type of both strings match.
     */
    ns.base_ctype = function( ctype ) {
        if( arguments.length > 1 ) {
            return ns.base_ctype( ctype ) == ns.base_ctype( arguments[ 1 ] );
        }
        var semipos = ctype.indexOf( ';' );
        if( semipos != -1 ) {
            ctype = ctype.substring( 0, semipos );
        }
        return ctype;
    };


    /**
     *  Makes a property-for-property copy of a given object.
     *
     *  @param host The original object to copy
     *  @return     The duplicate object
     */
    ns.clone = function( host ) {
        //ZIH - this is shallow copying: references will still be from host
        //http://stackoverflow.com/questions/728360/most-elegant-way-to-clone-a-javascript-object
        var copy = {};
        for( var property in host ) {
            if( host.hasOwnProperty( property ) == true ) {
                copy[ property ] = host[ property ];
            }
        }
    };


    /**
     *  Empties a DOM element of all of its children.
     *
     *  @param element The element to empty
     */
    ns.empty = function( element ) {
        while( element.firstChild != null ) {
            element.removeChild( element.firstChild );
        }
    };


    /**
     *  Empties a DOM element of all of its children given its ID.
     *
     *  @param id The ID of the element to empty
     */
    ns.empty_id = function( id ) {
        ns.empty( ns.gid( id ) );
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
     *  Object property defaulter.
     *
     *  @param obj   The object for which to default properties
     *  @param keys  A list of keys to check/default in the object
     *  @param value An optional default value to use (null is default)
     */
    ns.odef = function( obj, keys ) {
        var value = arguments.length > 2 ? arguments[ 2 ] : null;
        for( var i = 0; i < keys.length; ++i ) {
            if( ( keys[ i ] in obj ) == false ) {
                obj[ keys[ i ] ] = value;
            }
        }
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
     *  Object property proxyfier.
     *
     *  @param external Object that will act as the external interface
     *  @param internal Object that will be manipulation by the proxy object
     *  @param keys     The list of property names to proxy
     */
    function _make_getter( obj, key ) {
        return function() { return obj[ key ]; };
    }
    function _make_setter( obj, key ) {
        return function( value ) { obj[ key ] = value; };
    }
    ns.oprx = function( external, internal, keys ) {
        var key;
        for( var i = 0; i < keys.length; ++i ) {
            key = keys[ i ];
            Object.defineProperty(
                external,
                key,
                {
                    'enumerable' : true,
                    'get' : _make_getter( internal, key ),
                    'set' : _make_setter( internal, key )
                }
            );
        }
    };


    /**
     *  Object property setter.
     *
     *  @param obj   The object for which to set a property
     *  @param bind  A binding key into the object.  This may contain periods
     *               to indicate checking/creating sub-objects.
     *  @param value Optional value to set in the object (defaults to true)
     */
    ns.oset = function( obj, bind ) {
        var value = arguments.length > 2 ? arguments[ 2 ] : true;
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
        node[ keys[ keys.length - 1 ] ] = value;
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
     *  Generates slug strings.
     *
     *  @param user The user's string to slug
     *  @return     A string worthy of being called a slug
     */
    ns.slug = function( user ) {
        //convert it to all lower-case
        var slug = user.toLowerCase();
        //get rid of unwanted punctuation
        slug = slug.replace( /[^a-z0-9 _-]/g, '' );
        //get rid of any non-alpha leading characters
        slug = slug.replace( /^[^a-z]+/, '' );
        //convert repeated spaces/underscores/hyphens to single underscores
        slug = slug.replace( /[ _-]+/g, '_' );
        return slug;
    };


    /**
     *  Generates random ID strings.
     *
     *  @param prefix An optional prefix string (default is 'rand_id_')
     *  @return       A nearly guaranteed random ID string
     */
    ns.rand_id = function() {
        var prefix = arguments.length > 0 ? arguments[ 0 ] : 'rand_id_';
        return prefix + (
            Math.floor( Date.now() / ( Math.random() * 10000000 ) )
        );
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
     *  Creates and appends a new stylesheet to the current document.  This
     *  style sheet features an append() method that can be used to append
     *  style information to the sheet.
     *
     *  @return The new DOM StyleSheet object
     */
    ns.create_style_sheet = function() {

        //create the new style sheet
        var element = document.createElement( 'style' );
        document.head.appendChild( element );

        //attach a utility append method
        element.sheet.append = function( spec ) {

            //if the style specification is a string, just append it
            if( typeof spec == 'string' ) {
                this.insertRule( spec, this.cssRules.length );
            }

            //the style specification should be an object
            else if( ( typeof spec == 'object' ) && ( spec !== null ) ) {
                var block, decls;

                //each key in this object is a selector
                for( var sel in spec ) {
                    if( spec.hasOwnProperty( sel ) == false ) {
                        continue;
                    }
                    block = spec[ sel ];

                    //if the declaration block is a string, just append it
                    if( typeof block == 'string' ) {
                        this.insertRule(
                            sel + '{' + block + '}',
                            this.cssRules.length
                        );
                    }

                    //the declaration block should be an object
                    else if(
                        ( typeof block == 'object' )
                        &&
                        ( block !== null )
                    ) {
                        decls = [];

                        //each key in this object is a property name
                        for( var prop in block ) {
                            if( block.hasOwnProperty( prop ) == false ) {
                                continue;
                            }
                            decls.push( prop + ':' + block[ prop ] + ';' );
                        }

                        //construct and append the declaration block
                        this.insertRule(
                            sel + '{' + decls.join( '\n' ) + '}',
                            this.cssRules.length
                        );
                    }
                }
            }
        };

        //return the DOM StyleSheet object
        return element.sheet;
    };


    /*------------------------------------------------------------------------
    Classes
    ------------------------------------------------------------------------*/

    /**
     *  Provides emulation for the native HTMLCollection interface that is
     *  returned from requests for lists of elements (e.g.
     *  Element.getElementsByTagName()).  This allows applications to
     *  generate interface-equivalent return values when dealing with
     *  collections of elements.
     *
     *  @param init An initial list of items to use for the collection
     */
    function icollection() {
        var init = arguments.length > 0 ? arguments[ 0 ] : [];
        this._length = init.length;
        for( var i = 0; i < this._length; ++i ) {
            this[ i ] = init[ i ];
        }
        Object.defineProperty(
            this,
            'length',
            {
                'get' : function() { return this._length; }
            }
        );
    }

    /**
     *  Returns an item from the collection at the given index.
     *
     *  @param index The index of the item to retrieve
     *  @return      The item at the given index
     */
    icollection.prototype.item = function( index ) {
        if( ( index < 0 ) || ( index >= this._length ) ) {
            throw new Error( 'Invalid index ' + index + ' into collection.' );
        }
        return this[ index ];
    };

    /**
     *  Returns an item from the collection given the items "id" or "name"
     *  property.  The "name" property is used as a last resort only if all
     *  items in the collection do not have a matching "id" value.
     *
     *  @param name The requested item's "id" or "name" property
     *  @return     The item with the requested ID or name, or null if none
     */
    icollection.prototype.namedItem = function( name ) {
        var names = [];
        for( var i = 0; i < this._length; ++i ) {
            if( ( 'id' in this[ i ] ) && ( this[ i ].id === name ) ) {
                return this[ i ];
            }
            if( 'name' in this[ i ] ) {
                names.push( this[ i ].name );
            }
        }
        var name_index = names.indexOf( name );
        if( name_index != -1 ) {
            return this[ name_index ];
        }
        return null;
    };

    /**
     *  Module private method: Adds an item to the collection.
     *
     *  @param item The item to add to the collection
     */
    icollection.prototype._add = function( item ) {
        this[ this._length ] = item;
        this._length += 1;
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
