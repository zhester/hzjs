/*****************************************************************************
User Interface Utilities

This library is composed primarily of static functions designed to provide
very basic interactions with the user of the application.  Some of these
functions duplicate traditional browser functionality in a more secure manner
(e.g. the dialogs do not appear to originate from the end-user's desktop
manager).

No non-behavioral styling is applied to the elements to allow these to be
easily customized to the native design of the host page.

Note on style sheets: For immediate results, pair the document output used
here with the style sheet in my hzcss project:
    https://github.com/zhester/hzcss
        --> styles/ui.css

Note on icons: Icons are dynamically generated SVG images and sprite sets.
The generators are currently sourced from my personal web site.  If you wish
to host the generators yourself, my hzphp project can help:
    https://github.com/zhester/hzphp
        --> tools/icon.php
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
        var trans = arguments.length > 2 ? arguments[ 2 ] : false;
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
        //see if the append has some style transitions to perform
        else if( ( trans == true ) && ( 'style' in node ) ) {
            //ZIH - should move transition specification to stylesheet
            //ZIH - setup a new append_trans() function that takes
            //      a list of things to recalculate (opacity, etc)
            //      of the list, specify start and stop values
            //   --> sounds like a "transition" object
            node.style.transition = 'opacity 400ms ease-out';
            node.style.opacity = 0.0;
            elem.appendChild( node );
            window.getComputedStyle( node ).transition;
            window.getComputedStyle( node ).opacity;
            node.style.opacity = 1.0;
        }
        //plain, normal element appending
        else {
            elem.appendChild( node );
        }
        //return the node that was appended
        return node;
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
    fsize = function( size ) {
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
     *  Object property injector.
     *
     *  @param obj  The object for which to set properties
     *  @param data Another object full of properties I want in the first one
     */
    ns.omap = function( obj, data ) {
        for( var key in data ) {
            obj[ key ] = data[ key ];
        }
    },


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


    return ns;
} )( hz.util || {} );
