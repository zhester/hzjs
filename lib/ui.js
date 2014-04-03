/*****************************************************************************
    Hz User Interface Library

//ZIH - build a transition specification object
//  list of transitioning styles and their start/end values
//  can be passed to append/remove functions
//  possibility for a callback when time is up (on remove, anyway)

*****************************************************************************/

/*----------------------------------------------------------------------------
Hz Library Boilerplate
----------------------------------------------------------------------------*/
var hz = ( function( ns ) { return ns; } )( hz || {} );


/*----------------------------------------------------------------------------
Hz User Interface Submodule
----------------------------------------------------------------------------*/
hz.ui = ( function( ns ) {

    /*------------------------------------------------------------------------
    Public Properties
    ------------------------------------------------------------------------*/

    //bits used to set flags in parameters
    ns.CLOSE  = 0x0001;
    ns.OK     = 0x0002;
    ns.CANCEL = 0x0004;
    ns.INFO   = 0x0100;
    ns.QUERY  = 0x0200;
    ns.ERROR  = 0x0400;

    //convenience functions for adding UI elements
    //ZIH - refactor into sub-sub-module?
    ns.add = {

        /**
         *
         */
        'button' : function( elem, value ) {
            var handler = arguments.length > 2 ? arguments[ 2 ] : null;
            var input = document.createElement( 'input' );
            hz.util.omap(
                input,
                { 'type' : 'button', 'value' : value, 'onclick' : handler }
            );
            elem.appendChild( input );
            return input;
        },

        /**
         *
         */
        'edit' : function( elem ) {
            var value   = arguments.length > 1 ? arguments[ 1 ] : '';
            var handler = arguments.length > 2 ? arguments[ 2 ] : null;
            var input = document.createElement( 'textarea' );
            input.value = value;
            input.onchange = handler;
            elem.appendChild( input );
            return input;
        },

        /**
         *
         */
        'entry' : function( elem ) {
            var value   = arguments.length > 1 ? arguments[ 1 ] : '';
            var handler = arguments.length > 2 ? arguments[ 2 ] : null;
            var input = document.createElement( 'input' );
            hz.util.omap(
                input,
                { 'type' : 'text', 'value' : value, 'onchange' : handler }
            );
            elem.appendChild( input );
            return input;
        },

        /**
         *  Construct a check-style selection widget.  The widget is designed
         *  for exclusive (radio buttons) selection or inclusive (check boxes)
         *  selection.
         *
         *  @param elem
         *  @param values
         *  @param handler
         *  @param flags
         *                   1 : Require exclusive selection
         *  @param select  Optionally select the default enabled checkbox(es)
         *  @return        The container DOM element (not an input)
         */
        'check' : function( elem, values ) {
            var handler = arguments.length > 2 ? arguments[ 2 ] : null;
            var flags   = arguments.length > 3 ? arguments[ 3 ] : 0;
            var select  = arguments.length > 4 ? arguments[ 4 ] : null;
            var itype   = 'checkbox';
            var iname   = null;
            if( flags & 1 ) {
                itype = 'radio';
                iname = 'radiogroup' + ns.add.radio_counter;
                ns.add.radio_counter += 1;
            }
            var ul = document.createElement( 'ul' );
            ul.className = 'check';
            var label, li, input, span;
            var make_check_item = function( value, text, checked ) {
                var check_id = 'checkid' + ns.add.check_id_counter;
                ns.add.check_id_counter += 1;
                li = document.createElement( 'li' );
                input = document.createElement( 'input' );
                input.id = check_id;
                input.type = itype;
                input.name = iname;
                input.value = value;
                input.onchange = handler;
                input.checked = ( checked === true );
                li.appendChild( input );
                label = document.createElement( 'label' );
                label.setAttribute( 'for', check_id );
                label.setAttribute( 'tabindex', '0' );
                //ZIH - need to handle key events for toggling control
                //      while using keyboard-only form entry
                hz.util.append( label, text );
                li.appendChild( label );
                ul.appendChild( li );
            };
            var checkit;
            if( select instanceof Array ) {
                checkit = function( i ) { return select.indexOf( i ) !== -1; };
            }
            else {
                checkit = function( i ) { return i == select; };
            }
            if( values instanceof Array ) {
                for( var i = 0; i < values.length; ++i ) {
                    make_check_item( values[ i ], values[ i ], checkit( i ) );
                }
            }
            else {
                for( var key in values ) {
                    make_check_item( key, values[ key ], checkit( key ) );
                }
            }
            elem.appendChild( ul );
            return ul;
        },

        //helps build names and IDs without needing help from the user
        'radio_counter' : 0,
        'check_id_counter' : 0,

        /**
         *  Provides a typical display of ratios.  Most of the heavy lifting
         *  is done in CSS.  This just allows us to adjust the width of one
         *  of the elements in the stack programmatically.  The element's
         *  set_value() method takes a single argument that is a ratio of the
         *  amount the gauge is filled (0.0 to 1.0).
         *
         *  @param elem  The parent element of the new gauge widget
         *  @param label Optional textual label on top of the gauge
         *  @param value Optional initial value of the gauge (default is 0.0)
         *  @return      The new element that was appended
         */
        'gauge' : function( elem ) {
            var label = arguments.length > 1 ? arguments[ 1 ] : '';
            var value = arguments.length > 2 ? arguments[ 2 ] : 0.0;
            var node = document.createElement( 'div' );
            node.className = 'gauge';
            var fill = document.createElement( 'div' );
            fill.className = 'gauge_fill';
            node.appendChild( fill );
            var cont = document.createElement( 'div' );
            cont.className = 'gauge_content';
            cont.appendChild( document.createTextNode( label ) );
            node.appendChild( cont );
            elem.appendChild( node );
            node.hz = {
                'set_value' : function( value ) {
                    fill.style.width = ( value * 100.0 ) + '%';
                }
            };
            fill.style.height = node.clientHeight + 'px';
            node.hz.set_value( value );
            return node;
        },

        /**
         *  Provides an enhancement to the base gauge widget intended to show
         *  progress of some activity.
         *
         *  @param elem  The parent element of the new gauge widget
         *  @param label Optional textual label on top of the gauge
         *  @param value Optional initial value of the gauge (default is 0.0)
         *  @return      The new element that was appended
         */
        'progress' : function( elem ) {
            var label = arguments.length > 1 ? arguments[ 1 ] : '';
            var value = arguments.length > 2 ? arguments[ 2 ] : 0.0;
            var node = ns.add.gauge( elem, label, value );
            node.className += ' pulse';
            return node;
        },

        /**
         *  Provides an enhancement to the base gauge widget intended to show
         *  indeterminate activity is being performed.
         *
         *  @param elem  The parent element of the new gauge widget
         *  @param label Optional textual label on top of the gauge
         *  @return      The new element that was appended
         */
        'pulse' : function( elem ) {
            var label = arguments.length > 1 ? arguments[ 1 ] : '';
            var node = ns.add.gauge( elem, label, 1.0 );
            node.className += ' pulse';
            return node;
        },

        /**
         *  Provides a convenience method for adding a select menu to the UI.
         *
         *  @param elem     The parent element of the new select widget
         *  @param values   Optional array or object of options
         *  @param handler  Optional onchange callback handler
         *  @param selected Optional default selection (index/key)
         *  @return         The new element that was appended
         */
        'select' : function( elem ) {
            var values   = arguments.length > 1 ? arguments[ 1 ] : [];
            var handler  = arguments.length > 2 ? arguments[ 2 ] : null;
            var selected = arguments.length > 3 ? arguments[ 3 ] : 0;
            var input = document.createElement( 'select' );
            input.onchange = handler;
            var option;
            if( values instanceof Array ) {
                for( var i = 0; i < values.length; ++i ) {
                    option          = document.createElement( 'option' );
                    option.value    = values[ i ];
                    option.text     = values[ i ];
                    option.selected = selected == i;
                    input.add( option );
                }
            }
            else {
                for( var key in values ) {
                    option          = document.createElement( 'option' );
                    option.value    = key;
                    option.text     = values[ key ];
                    option.selected = selected === key;
                    input.add( option );
                }
            }
            elem.appendChild( input );
            return input;
        }

    };


    /*------------------------------------------------------------------------
    Public Methods
    ------------------------------------------------------------------------*/

    /**
     *  Produces a traditional "alert" dialog.
     *
     *  @param message  The message to display to the user
     *  @param callback Optional function to call after acknowledgement
     *  @param title    Optional title for the top of the box
     */
    ns.alert = function( message ) {
        var callback = arguments.length > 1 ? arguments[ 1 ] : null;
        var title    = arguments.length > 2 ? arguments[ 2 ] : 'Alert';
        ns.create_modal(
            message,
            ( ns.CLOSE | ns.INFO ),
            callback,
            title
        );
    };


    /**
     *  Produces a traditional "confirm" dialog.
     *
     *  @param message  The prompt message for an Ok/Cancel response
     *  @param callback The function to call with the user's answer
     *  @param title    Optional title to display at the top of the box
     */
    ns.confirm = function( message, callback ) {
        var title = arguments[ 2 ] ? arguments[ 2 ] : 'Confirm';
        ns.create_modal(
            message,
            ( ns.OK | ns.CANCEL | ns.QUERY ),
            callback,
            title
        );
    };


    /**
     *  Event handler callback designed to add universal "close" capabilities
     *  to a dynamically created element.
     *
     *  @param id     The ID of the element to close
     *  @param result The result value to pass to the user's callback
     */
    ns.close_id = function( id, result ) {
        var elem = hz.util.gid( id );
        if( 'hz' in elem ) {
            var callback = null;
            if( 'callback' in elem.hz ) {
                callback = elem.hz.callback;
            }
            if( 'ids' in elem.hz ) {
                for( var i = 0; i < elem.hz.ids.length; ++i ) {
                    hz.util.remove( document.body, elem.hz.ids[ i ] );
                }
            }
            else {
                hz.util.remove( document.body, id );
            }
            if( callback != null ) {
                callback( result );
            }
        }
        else {
            hz.util.remove( document.body, id );
        }
    };


    /**
     *  Creates a modal dialog with features determined at runtime.
     *
     *  @param message  The message to display in the dialog
     *  @param flags    Features to enable in the dialog (bit flags)
     *  @param callback Optional callback after user interaction is done
     *  @param title    Optional title to display at the top of the box
     */
    ns.create_modal = function( message, flags ) {
        var callback = arguments[ 2 ] ? arguments[ 2 ] : null;
        var title = arguments[ 3 ] ? arguments[ 3 ] : '';
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
        var p = document.createElement( 'div' );
        p.className = 'message';
        hz.util.append( p, message );
        elem.appendChild( p );
        //set up a container to hold the controls
        p = document.createElement( 'div' );
        p.className = 'control';
        //check for each button requested for the dialog
        var button;
        if( flags & ns.OK ) {
            button = document.createElement( 'input' );
            hz.util.omap( button, {
                'type' : 'button', 'value' : 'Ok',
                'onclick' : function( e ) {
                    ns.close_id( 'hzutil_modal', true ); }
            } );
            p.appendChild( button );
        }
        if( flags & ns.CANCEL ) {
            button = document.createElement( 'input' );
            hz.util.omap( button, {
                'type' : 'button', 'value' : 'Cancel',
                'onclick' : function( e ) {
                    ns.close_id( 'hzutil_modal', false ); }
            } );
            p.appendChild( button );
        }
        if( flags & ns.CLOSE ) {
            button = document.createElement( 'input' );
            hz.util.omap( button, {
                'type' : 'button', 'value' : 'Close',
                'onclick' : function( e ) {
                    ns.close_id( 'hzutil_modal', true ); }
            } );
            p.appendChild( button );
        }
        elem.appendChild( p );
        //place an overlay to (try to) prevent non-modal activities
        if( flags & ns.CLOSE ) {
            ns.create_overlay( 'hzutil_modal' );
        }
        else {
            ns.create_overlay();
        }
        //append the dialog element
        hz.util.append( document.body, elem, true );
    };


    /**
     *  Create and append an element to cover the rest of the document.
     *
     *  @param closer The ID of an element that will close the overlay
     */
    ns.create_overlay = function() {
        var closer = arguments.length > 0 ? arguments[ 0 ] : false;
        var elem = document.createElement( 'div' );
        elem.id = 'hzutil_overlay';
        elem.className = 'overlay';
        if( closer !== false ) {
            elem.onclick = function( e ) { ns.close_id( closer, true ); };
        }
        hz.util.append( document.body, elem );
    };


    /**
     *  Adds window decorations to any element.
     *
     *  @param elem  The target element to dress up
     *  @param flags Features to enable for the decorations
     *  @param title Optional title to show at the top of the box
     */
    ns.decorate = function( elem, flags ) {
        var title = arguments[ 2 ] ? arguments[ 2 ] : '';
        var bar = document.createElement( 'div' );
        bar.className = 'bar';
        var div = document.createElement( 'div' );
        if( ( flags & ns.CLOSE ) == ns.CLOSE ) {
            var button = document.createElement( 'input' );
            hz.util.omap( button, {
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
    };


    /**
     *  Provides an error dialog.  It's pretty much an "alert" dialog but it's
     *  super-serious about what it says.
     *
     *  @param message  The message to display to the user
     *  @param callback Optional function to call after acknowledgement
     *  @param title    Optional title for the top of the box
     */
    ns.error = function( message ) {
        var callback = arguments.length > 1 ? arguments[ 1 ] : null;
        var title    = arguments.length > 2 ? arguments[ 2 ] : 'Error';
        ns.create_modal(
            message,
            ( ns.CLOSE | ns.ERROR ),
            callback,
            title
        );
    };


    /**
     *  Produces a traditional "prompt" dialog.
     *
     *  @param message  The prompt message for an text response
     *  @param callback The function to call with the user's response
     *  @param title    Optional title to display at the top of the box
     *  @param text     Optional default text to show in the entry widget
     */
    ns.prompt = function( message, callback ) {
        var title = arguments[ 2 ] ? arguments[ 2 ] : 'Prompt';
        var text  = arguments[ 3 ] ? arguments[ 3 ] : '';
        var form = document.createElement( 'div' );
        var p = document.createElement( 'p' );
        hz.util.append( p, message );
        form.appendChild( p );
        p = document.createElement( 'p' );
        //ZIH - need to add an onenter-like handler to text box
        var tbox = ns.add.entry( form, text );
        //ZIH - this doesn't work... need to focus after it's in the document
        //    --> append callback?
        tbox.focus();
        ns.create_modal(
            form,
            ( ns.OK | ns.CANCEL | ns.QUERY ),
            function( answer ) {
                if( answer == true ) {
                    callback( tbox.value );
                }
                else {
                    callback( answer );
                }
            },
            title
        );
    };


    /**
     *
     */
    ns.view_url = function( url ) {
        var req = new XMLHttpRequest();
        req.onerror = function( e ) { ns.error( 'HTTP Request Error' ); };
        req.onabort = function( e ) { ns.alert( 'HTTP Request Abort' ); };
        req.onload  = function( e ) {
            var view = document.createElement( 'div' );
            //ZIH - make unique IDs for every viewer
            view.id = 'viewer';
            view.className = 'view';
            ns.decorate( view, ns.CLOSE );
            var content = document.createElement( 'div' );
            content.className = 'content';
            content.innerHTML = req.responseText;
            view.appendChild( content );
            hz.util.append( document.body, view, true );
        };
        var q = ( url.indexOf( '?' ) == -1 ? '?' : '&' ) + '_n=' + Date.now;
        req.open( 'GET', url + q, true );
        req.send( null );
    };


    return ns;
} )( hz.ui || {} );
