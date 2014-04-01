/*****************************************************************************
User Interface Utilities

This library is composed primary of static functions designed to provide very
basic interactions with the user of the application.  Some of these functions
duplicate traditional browser functionality in a more secure manner (e.g. the
dialogs do not appear to originate from the end-user's desktop manager).

No non-behavioral styling is applied to the elements to allow these to be
easily customized to the native design of the host page.
*****************************************************************************/

//hzjs library boilerplate
if( ( 'hz' in window ) == false ) { window.hz = {}; }

/*%{"hz.util":{"selectors":
    ["#hzutil_modal","#hzutil_overlay","#hzutil_alert"
    ".bar",".button",".x",".modal",".overlay",
    ".info",".query",".error",
    ".message",".control"]}}*/

window.hz.util = {

    //bits used to set flags in parameters
    'CLOSE'  : 0x0001,
    'OK'     : 0x0002,
    'CANCEL' : 0x0004,
    'INFO'   : 0x0100,
    'QUERY'  : 0x0200,
    'ERROR'  : 0x0400,

    /**
     *  Produces a traditional "alert" dialog.
     *  @param message The message to display to the user
     *  @param callback Optional function to call after acknowledgement
     *  @param title Optional title for the top of the box
     */
    'alert' : function( message ) {
        var title = arguments[ 2 ] ? arguments[ 2 ] : 'Alert';
        var ns = window.hz.util;
        ns.create_modal(
            message,
            ( ns.CLOSE | ns.INFO ),
            arguments[ 1 ],
            title
        );
    },

    /**
     *  Attempts to append almost anything to an element.
     *  @param elem The parent element appending the child
     *  @param data Something to append (string, number, object, element)
     *  @return The node or element that was appended
     */
    'append' : function( elem, data ) {
        var node;
        if( data == null ) {
            node = document.createTextNode( '' );
        }
        else if( typeof data === 'object' ) {
            if( ( 'nodeType' in data )
             && ( typeof data.nodeType === 'number' ) ) {
                node = data;
            }
            else if( 'get_element' in data ) {
                node = data.get_element();
            }
            else if( 'toString' in data  ) {
                node = document.createTextNode( data.toString() );
            }
            else {
                throw new Error( 'Attempted to append invalid object.' );
            }
        }
        else if( typeof data === 'function' ) {
            window.hz.util.append( elem, data() );
        }
        else {
            node = document.createTextNode( data );
        }
        elem.appendChild( node );
        return node;
    },

    /**
     *  Appends any DOM element to the document's body element.
     *  @param elem The DOM element to append
     */
    'body_append' : function( elem ) {
        document.getElementsByTagName( 'body' )[ 0 ].appendChild( elem );
    },

    /**
     *  Remove an element from the document's body given the element's ID.
     *  @param id The element ID of which to remove
     */
    'body_remove_id' : function( id ) {
        var body = document.getElementsByTagName( 'body' )[ 0 ];
        body.removeChild( window.hz.util.gid( id ) );
    },

    /**
     *  Produces a traditional "confirm" dialog.
     *  @param message The prompt message for an Ok/Cancel response
     *  @param callback The function to call with the user's answer
     *  @param title Optional title to display at the top of the box
     */
    'confirm' : function( message, callback ) {
        var title = arguments[ 2 ] ? arguments[ 2 ] : 'Confirm';
        var ns = window.hz.util;
        ns.create_modal(
            message,
            ( ns.OK | ns.CANCEL | ns.QUERY ),
            callback,
            title
        );
    },

    /**
     *  Event handler callback designed to add universal "close" capabilities
     *  to a dynamically created element.
     *  @param id The ID of the element to close
     *  @param result The result value to pass to the user's callback
     */
    'close_id' : function( id, result ) {
        var ns = window.hz.util;
        var elem = ns.gid( id );
        if( 'hz' in elem ) {
            var callback = null;
            if( 'callback' in elem.hz ) {
                callback = elem.hz.callback;
            }
            if( 'ids' in elem.hz ) {
                for( var i = 0; i < elem.hz.ids.length; ++i ) {
                    ns.body_remove_id( elem.hz.ids[ i ] );
                }
            }
            else {
                ns.body_remove_id( id );
            }
            if( callback != null ) {
                callback( result );
            }
        }
        else {
            ns.body_remove_id( id );
        }
    },

    /**
     *  Creates a modal dialog with features determined at runtime.
     *  @param message The message to display in the dialog
     *  @param flags Features to enable in the dialog (bit flags)
     *  @param callback Optional callback after user interaction is done
     *  @param title Optional title to display at the top of the box
     */
    'create_modal' : function( message, flags ) {
        var callback = arguments[ 2 ] ? arguments[ 2 ] : null;
        var title = arguments[ 3 ] ? arguments[ 3 ] : '';
        var ns = window.hz.util;
        var elem = document.createElement( 'div' );
        elem.id = 'hzutil_modal';
        elem.className = 'modal';
        if( flags & ns.INFO ) {
            elem.className += ' info';
        }
        if( flags & ns.QUERY ) {
            elem.className += ' query';
        }
        if( flags & ns.ERROR ) {
            elem.className += ' error';
        }
        elem.hz = {
            'ids' : [ 'hzutil_modal', 'hzutil_overlay' ],
            'callback' : callback
        };
        //adds "window decorations" to any box-ish element
        ns.decorate( elem, ns.CLOSE, title );
        //set up a container to display the primary message
        var p = document.createElement( 'p' );
        p.className = 'message';
        ns.append( p, message );
        elem.appendChild( p );
        //set up a container to hold the controls
        p = document.createElement( 'p' );
        p.className = 'control';
        //check for each button requested for the dialog
        var button;
        if( flags & ns.OK ) {
            button = document.createElement( 'input' );
            ns.omap( button, {
                'type' : 'button', 'value' : 'Ok',
                'onclick' : function( e ) {
                    ns.close_id( 'hzutil_modal', true ); }
            } );
            p.appendChild( button );
        }
        if( flags & ns.CANCEL ) {
            button = document.createElement( 'input' );
            ns.omap( button, {
                'type' : 'button', 'value' : 'Cancel',
                'onclick' : function( e ) {
                    ns.close_id( 'hzutil_modal', false ); }
            } );
            p.appendChild( button );
        }
        if( flags & ns.CLOSE ) {
            button = document.createElement( 'input' );
            ns.omap( button, {
                'type' : 'button', 'value' : 'Close',
                'onclick' : function( e ) {
                    ns.close_id( 'hzutil_modal', true ); }
            } );
            p.appendChild( button );
        }
        elem.appendChild( p );
        //place an overlay to (try to) prevent non-modal activities
        if( flags & ns.CLOSE ) {
            ns.create_overlay( 'hzutil_alert' );
        }
        else {
            ns.create_overlay();
        }
        //append the dialog element
        ns.body_append( elem );
    },

    /**
     *  Create and append an element to cover the rest of the document.
     *  @param closer The ID of an element that will close the overlay
     */
    'create_overlay' : function() {
        var closer = arguments[ 0 ] ? arguments[ 0 ] : false;
        var ns = window.hz.util;
        var elem = document.createElement( 'div' );
        elem.id = 'hzutil_overlay';
        elem.className = 'overlay';
        if( closer != false ) {
            elem.onclick = function( e ) { ns.close_id( closer, true ); };
        }
        ns.body_append( elem );
    },

    /**
     *  Adds window decorations to any element.
     *  @param elem The target element to dress up
     *  @param flags Features to enable for the decorations
     *  @param title Optional title to show at the top of the box
     */
    'decorate' : function( elem, flags ) {
        var title = arguments[ 2 ] ? arguments[ 2 ] : '';
        var ns = window.hz.util;
        var bar = document.createElement( 'div' );
        bar.className = 'bar';
        var div = document.createElement( 'div' );
        if( ( flags & ns.CLOSE ) == ns.CLOSE ) {
            var button = document.createElement( 'input' );
            ns.omap( button, {
                'type' : 'button', 'value' : 'Close',
                'title' : 'Close', 'className' : 'button x',
                'onclick' : function( e ) { ns.close_id( elem.id, false ); }
            } );
            div.appendChild( button );
        }
        bar.appendChild( div );
        div = document.createElement( 'h6' );
        div.appendChild( document.createTextNode( title ) );
        bar.appendChild( div );
        if( elem.firstChild != null ) {
            elem.insertBefore( bar, elem.firstChild );
        }
        else {
            elem.appendChild( bar );
        }
    },

    /**
     *  Provides an error dialog.  It's pretty much an "alert" dialog but
     *  it's super-serious about what it says.
     *  @param message The message to display to the user
     *  @param callback Optional function to call after acknowledgement
     *  @param title Optional title for the top of the box
     */
    'error' : function( message ) {
        var title = arguments[ 2 ] ? arguments[ 2 ] : 'Error';
        var ns = window.hz.util;
        ns.create_modal(
            message,
            ( ns.CLOSE | ns.ERROR ),
            arguments[ 1 ],
            title
        );
    },

    /**
     *  Gets an element out of the document given its ID.  It helps extract
     *  more useful information about why I can't access an element.
     *  @param id The ID of the element to retrieve
     *  @return A DOM element fetched from the document with the given ID
     *  @throws Error Tells me it couldn't find an element with that ID
     */
    'gid' : function( id ) {
        var elem;
        try {
            elem = document.getElementById( id );
        }
        catch( error ) {
            throw new Error( 'No element found with ID = "' + id + '"' );
        }
        return elem;
    },

    /**
     *  Object property injector.
     *  @param obj The object for which to set properties
     *  @param data Another object full of properties I want in the first one
     */
    'omap' : function( obj, data ) {
        for( var key in data ) {
            obj[ key ] = data[ key ];
        }
    }

}   /* hz.util */

/*%{"hz.view_url":{"includes":["hz.util"],"selectors":["#viewer"]}}*/
window.hz.view_url = function( url ) {
    var req = new XMLHttpRequest();
    req.onerror = function( e ) { ns.error( 'HTTP Request Error' ); };
    req.onabort = function( e ) { ns.alert( 'HTTP Request Abort' ); };
    req.onload  = function( e ) {
        var ns = window.hz.util;
        var view = document.createElement( 'div' );
        view.id = 'viewer';
        view.innerHTML = '<div class="content">'
            + req.responseText + '</div>';
        ns.decorate( view, ns.CLOSE );
        ns.body_append( view );
    };
    req.open( 'GET', url, true );
    req.send( null );
}   /* hz.view_url */
