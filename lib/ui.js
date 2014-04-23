/*****************************************************************************
Hz User Interface Module

The primary purpose of this library is to repeatably build complex document
structure with lots of reasonable default properties/behaviors.  The structure
is created in an effort to provide robust customization of the look of the
interface using CSS.  The only time styling is ever specified here is when a
style is an aspect of the element's behavior (e.g. the width of a progress
bar).

For immediate results, pair the document output used here with the style sheet
in my hzcss project:
    https://github.com/zhester/hzcss
        --> styles/ui.css

Cross-browser interoperability is NOT a focus of this module, and absolutely
no testing has been performed with MSIE.  All my users are running Mozilla or
Webkit.  That being said, I avoid vendor-specific features at great cost, and
I will provide cross-fills from time to time when I do need something one of
the browsers does really well.

Accessibility and keyboard-only access IS an important aspect of this module.
I detest designers who create new widgets using primitive elements which
nearly always removes features I use (e.g. navigating select menus using the
keyboard).  I prefer to allow the browser to keep all its default behaviors,
and I'll augment those when I need something to act/look different.

TODO:
  - set up a way to decorate a container (not the viewport) to add scrollbar
    elements that can be styled by CSS.  it must work properly with a block
    container that is using overflow:auto|scroll.  it must hide the desktop
    manager's version of the widget.  all normal scrolling behavior must be
    supported (scroll input, arrow keys, space bar, pgup/pgdn, etc)

*****************************************************************************/

/*----------------------------------------------------------------------------
Hz Library Boilerplate
----------------------------------------------------------------------------*/
var hz = ( function( ns ) { return ns; } )( hz || {} );


/*----------------------------------------------------------------------------
Module Dependencies
----------------------------------------------------------------------------*/
/*?jspp { "include" : { "hz" : [ "doc", "form", "util" ] } } ?*/


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

    ns.form       = form;           //expose the form class
    ns.form_field = form_field;     //expose the form field class

    /*------------------------------------------------------------------------
    Public Methods
    ------------------------------------------------------------------------*/

    /*
     *  Convenience functions for consistently generating various input
     *  elements and composite input widgets.
     */
    ns.create = {

        /**
         *  Creates a button input.
         *
         *  @param value   The label text for the button
         *  @param handler An optional callback handler for the click event
         *  @return        The new input element
         */
        'button' : function( value ) {
            var handler = arguments.length > 1 ? arguments[ 1 ] : null;
            var input = document.createElement( 'input' );
            hz.util.omap(
                input,
                { 'type' : 'button', 'value' : value, 'onclick' : handler }
            );
            return input;
        },

        /**
         *  Construct a check-style selection widget.  The widget is designed
         *  for exclusive (radio buttons) selection or inclusive (check boxes)
         *  selection.
         *
         *  @param values  An array or key-value object of values to display
         *                 and use for selection.  When passing an array, each
         *                 item is both the value and label.  When passing an
         *                 object, the property keys are the values, and the
         *                 the property values are the label contents.
         *  @param handler Optional callback handler for all inputs' onchange
         *                 events.
         *  @param flags   Optional construction/behavior flags
         *                   1 : Require exclusive selection
         *  @param select  The initial state of each input.  When used with
         *                 inclusive selection, this should be an array of
         *                 indexes (when using an array of values) or an array
         *                 of keys (when using an object of values) that
         *                 should be selected/checked.  When used with
         *                 exclusive selection, this should be a single index
         *                 or key of the item to select.
         *  @return        The new check widget
         */
        'check' : function( values ) {
            var handler = arguments.length > 1 ? arguments[ 1 ] : null;
            var flags   = arguments.length > 2 ? arguments[ 2 ] : 0;
            var select  = arguments.length > 3 ? arguments[ 3 ] : null;
            var itype   = 'checkbox';
            var iname   = null;
            var ul      = document.createElement( 'ul' );
            ul.className = 'check';
            if( flags & 1 ) {
                itype = 'radio';
                iname = hz.util.rand_id();
                ul.className += ' exclusive';
            }
            else {
                ul.className += ' inclusive';
            }
            var label, li, input, span;
            var make_check_item = function( value, text, checked ) {
                var check_id = hz.util.rand_id();
                li = document.createElement( 'li' );
                input = document.createElement( 'input' );
                hz.util.omap( input, {
                    'id' : check_id, 'type' : itype, 'name' : iname,
                    'value' : value, 'onchange' : handler,
                    'checked' : ( checked === true )
                } );
                li.appendChild( input );
                label = document.createElement( 'label' );
                label.setAttribute( 'for', check_id );
                label.setAttribute( 'tabindex', '0' );
                label.onkeydown = function( event ) {
                    if( event.keyCode == 32 ) {
                        event.preventDefault();
                        var inp = event.target.parentNode.firstChild;
                        inp.checked = !inp.checked;
                    }
                };
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
            return ul;
        },

        /**
         *  Creates a textarea.
         *
         *  @param value   Optional default text shown in input
         *  @param handler Optional callback handler for the change event
         *  @return        The new input element
         */
        'edit' : function() {
            var value   = arguments.length > 0 ? arguments[ 0 ] : '';
            var handler = arguments.length > 1 ? arguments[ 1 ] : null;
            var input = document.createElement( 'textarea' );
            input.value = value;
            input.onchange = handler;
            return input;
        },

        /**
         *  Creates an enhanced file input widget.  The document structure is
         *  intended to allow sweeping changes to the style of the input via
         *  CSS.  The file or files selected are displayed in a nice table
         *  within the widget (with types and sizes of each file).
         *
         *  @param handler  Optional callback handler for the change event
         *  @param multiple Set to allow multiple file selection
         *  @return         The new efile widget
         */
        'efile' : function() {
            var handler      = arguments.length > 0 ? arguments[ 0 ] : null;
            var multiple     = arguments.length > 1 ? arguments[ 1 ] : false;
            var parent       = document.createElement( 'div' );
            var help         = document.createElement( 'p'   );
            var initial      = document.createElement( 'p'   );
            var table        = hz.doc.create_table();
            parent.className = 'efile';
            help.className   = 'input';
            var input = ns.add.file(
                parent,
                function( event ) {
                    if( initial.parentNode == parent ) {
                        parent.removeChild( initial );
                    }
                    if( table.parentNode == parent ) {
                        table.deleteAllRows();
                    }
                    var fs = event.target.files;
                    var num_files = fs.length;
                    var total = 0;
                    for( var i = 0; i < num_files; ++i ) {
                        table.appendDataRow( [
                            fs[ i ].name,
                            fs[ i ].type,
                            hz.util.fsize( fs[ i ].size )
                        ] );
                        total += fs[ i ].size;
                    }
                    if( num_files > 1 ) {
                        var tr = table.appendDataRow( [
                            num_files + ' files',
                            '',
                            hz.util.fsize( total )
                        ] );
                        tr.className = 'summary';
                    }
                    parent.appendChild( table );
                    if( handler instanceof Function ) {
                        handler( event );
                    }
                },
                multiple
            );
            help.appendChild(
                document.createTextNode(
                    'Click to browse, or drop files here.'
                )
            );
            parent.appendChild( help );
            var s = multiple ? 's' : '';
            initial.appendChild(
                document.createTextNode( 'No file' + s + ' selected.' )
            );
            parent.appendChild( initial );
            return parent;
        },

        /**
         *  Creates a text input.
         *
         *  @param value   Optional default text shown in the input
         *  @Param handler Optional callback handler for the change event
         *  @return        The new input element
         */
        'entry' : function() {
            var value   = arguments.length > 0 ? arguments[ 0 ] : '';
            var handler = arguments.length > 1 ? arguments[ 1 ] : null;
            var input = document.createElement( 'input' );
            hz.util.omap(
                input,
                { 'type' : 'text', 'value' : value, 'onchange' : handler }
            );
            return input;
        },

        /**
         *  Creates a standard file input.
         *
         *  @param handler  Optional callback handler when a file is selected
         *  @param multiple Optionally set to true to allow multiple files
         *  @return         The new input element
         */
        'file' : function() {
            var handler  = arguments.length > 0 ? arguments[ 0 ] : null;
            var multiple = arguments.length > 1 ? arguments[ 1 ] : false;
            var input = document.createElement( 'input' );
            input.setAttribute( 'type', 'file' );
            input.onchange = handler;
            input.multiple = multiple;
            return input;
        },

        /**
         *  Provides a typical display of ratios.  Most of the heavy lifting
         *  is done in CSS.  This just allows us to adjust the width of one
         *  of the elements in the stack programmatically.  The element's
         *  set_value() method takes a single argument that is a ratio of the
         *  amount the gauge is filled (0.0 to 1.0).
         *
         *  @param label Optional textual label on top of the gauge
         *  @param value Optional initial value of the gauge (default is 0.0)
         *  @param flags Optional display flags (default 0)
         *                 1 : Show the fill total in %
         *  @return      The new gauge widget
         */
        'gauge' : function() {
            var label = arguments.length > 0 ? arguments[ 0 ] : '';
            var value = arguments.length > 1 ? arguments[ 1 ] : 0.0;
            var flags = arguments.length > 2 ? arguments[ 2 ] : 0;
            var perc, span;
            var node = document.createElement( 'div' );
            node.className = 'gauge';
            var fill = document.createElement( 'div' );
            fill.className = 'gauge_fill';
            node.appendChild( fill );
            var cont = document.createElement( 'div' );
            cont.className = 'gauge_content';
            cont.appendChild( document.createTextNode( label ) );
            node.appendChild( cont );
            if( flags & 1 ) {
                span = document.createElement( 'span' );
                perc = document.createTextNode( '' );
                span.appendChild( perc );
                node.appendChild( span );
            }
            node.hz = {
                'set_value' : function( value ) {
                    fill.style.width = ( value * 100.0 ) + '%';
                    if( flags & 1 ) {
                        perc.nodeValue = ( value * 100.0 ).toFixed( 0 ) + '%';
                    }
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
         *  @param label Optional textual label on top of the gauge
         *  @param value Optional initial value of the gauge (default is 0.0)
         *  @param flags Optional display flags (default 0)
         *                 1 : Show the fill total in %
         *  @return      The new progress widget
         */
        'progress' : function() {
            var args = Array.prototype.slice.call( arguments );
            var node = ns.create.gauge.apply( this, args );
            node.className += ' pulse';
            return node;
        },

        /**
         *  Provides an enhancement to the base gauge widget intended to show
         *  indeterminate activity is being performed.
         *
         *  @param label Optional textual label on top of the gauge
         *  @return      The new pulse widget
         */
        'pulse' : function() {
            var label = arguments.length > 0 ? arguments[ 0 ] : '';
            var node = ns.create.gauge( label, 1.0 );
            node.className += ' pulse';
            return node;
        },

        /**
         *  Provides a convenience method for creating a select menu.
         *
         *  @param values   Optional array or object of options
         *  @param handler  Optional onchange callback handler
         *  @param selected Optional default selection (index/key)
         *  @return         The new select element
         */
        'select' : function() {
            var values   = arguments.length > 0 ? arguments[ 0 ] : [];
            var handler  = arguments.length > 1 ? arguments[ 1 ] : null;
            var selected = arguments.length > 2 ? arguments[ 2 ] : 0;
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
            return input;
        }

    };


    /*
     *  Maintains backwards compatibility with the old hz.ui.add interface.
     *  This is deprecated, and will be removed in a future version of this
     *  module.
     */
    function _make_add( key ) {
        return function() {
            var args    = Array.prototype.slice.call( arguments );
            var parent  = args.shift();
            var element = ns.create[ key ].apply( this, args );
            parent.appendChild( element );
            return element;
        };
    }
    ns.add = {};
    for( key in ns.create ) {
        ns.add[ key ] = _make_add( key );
    }


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
        var title = arguments.length > 2 ? arguments[ 2 ] : 'Confirm';
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
     *  @return         The element that was created as a dialog
     */
    ns.create_modal = function( message, flags ) {
        var callback = arguments.length > 2 ? arguments[ 2 ] : null;
        var title    = arguments.length > 3 ? arguments[ 3 ] : '';
        var elem = document.createElement( 'div' );
        elem.id = hz.util.rand_id();
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
            'ids' : [ elem.id, elem.id + '_overlay' ],
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
                    ns.close_id( elem.id, true ); }
            } );
            p.appendChild( button );
        }
        if( flags & ns.CANCEL ) {
            button = document.createElement( 'input' );
            hz.util.omap( button, {
                'type' : 'button', 'value' : 'Cancel',
                'onclick' : function( e ) {
                    ns.close_id( elem.id, false ); }
            } );
            p.appendChild( button );
        }
        if( flags & ns.CLOSE ) {
            button = document.createElement( 'input' );
            hz.util.omap( button, {
                'type' : 'button', 'value' : 'Close',
                'onclick' : function( e ) {
                    ns.close_id( elem.id, true ); }
            } );
            p.appendChild( button );
        }
        elem.appendChild( p );
        //place an overlay to (try to) prevent non-modal activities
        if( flags & ns.CLOSE ) {
            ns.create_overlay( elem.id, elem.id );
        }
        else {
            ns.create_overlay( elem.id );
        }
        //append the dialog element
        return hz.util.append( document.body, elem );
    };


    /**
     *  Create and append an element to cover the rest of the document.
     *
     *  @param owner_id ID of the element that "owns" the overlay
     *  @param close_id Optional ID of an element that the overlay can close
     *  @return         The element that was created as an overlay
     */
    ns.create_overlay = function( owner_id ) {
        var close_id = arguments.length > 0 ? arguments[ 0 ] : false;
        var elem = document.createElement( 'div' );
        elem.id = owner_id + '_overlay';
        elem.className = 'overlay';
        if( close_id !== false ) {
            elem.onclick = function( e ) { ns.close_id( close_id, true ); };
        }
        return hz.util.append( document.body, elem );
    };


    /**
     *  Adds window decorations to any element.
     *
     *  @param elem  The target element to dress up
     *  @param flags Features to enable for the decorations
     *  @param title Optional title to show at the top of the box
     */
    ns.decorate = function( elem, flags ) {
        var title = arguments.length > 2 ? arguments[ 2 ] : '';
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
        var title = arguments.length > 2 ? arguments[ 2 ] : 'Prompt';
        var text  = arguments.length > 3 ? arguments[ 3 ] : '';
        var keyed = false;
        var form = document.createElement( 'div' );
        var p = document.createElement( 'p' );
        hz.util.append( p, message );
        form.appendChild( p );
        p = document.createElement( 'p' );
        var tbox = ns.add.entry( form, text );
        var modal = ns.create_modal(
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
        //handle "enter" key interaction in the text box
        tbox.onkeydown = function( event ) {
            if( event.keyCode == 13 ) {
                event.preventDefault();
                ns.close_id( modal.id, true );
            }
            else if( keyed == false ) {
                if( text != '' ) {
                    tbox.value = '';
                }
                keyed = true;
            }
        };
        //place focus on the text box
        tbox.focus();
    };


    /**
     *  Builds a display container and a form for gathering input from the
     *  user within the current document.
     *
     *  @param title    The title to display above the form
     *  @param spec     The form elements specification object
     *  @param handler  The handler to call for the form's submit event
     *  @param notes    Optional helpful notes for completing the form
     *  @param sublabel Optional label to display on the submit button
     *  @param          The containing display element
     */
    ns.show_form = function( title, spec, handler ) {
        var notes    = arguments.length > 3 ? arguments[ 3 ] : null;
        var sublabel = arguments.length > 4 ? arguments[ 4 ] : 'Submit';

        //create the display container
        var display = document.createElement( 'div' );
        display.id = hz.util.rand_id();
        display.className = 'view';

        //add a title bar with a close button
        ns.decorate( display, ns.CLOSE, title );

        //create a container for the internal contents
        var content = document.createElement( 'div' );
        content.className = 'content';
        display.appendChild( content );

        //check for helpful notes about filling out the form
        if( notes != null ) {
            var notes_elem = notes;
            if( typeof notes == 'string' ) {
                notes_elem = document.createElement( 'p' );
                notes_elem.innerHTML = notes;
            }
            hz.util.append( content, notes_elem );
        }

        //create the form
        var form = hz.form.create_form( handler );

        //auto-generate the form fields
        form.build( spec, sublabel );

        //add the form to the content container
        content.appendChild( form );

        //add the whole display to the document
        document.body.appendChild( display );

        //set the focus for immediate keyboard interaction
        form.autoFocus();

        //return the generated container
        return display;
    };


    /**
     *  Displays content in a dynamically-generate element.  The intent is to
     *  then style this element so it appears to overlay on top of the
     *  document.
     *
     *  @param content  The content to display
     *  @param title    Optional title to show on the viewer
     *  @param wrap_tag Optional tag name within which to wrap the contents
     *  @return         The generated viewer element
     */
    ns.view = function( content ) {
        var title    = arguments.length > 1 ? arguments[ 1 ] : '';
        var wrap_tag = arguments.length > 2 ? arguments[ 2 ] : null;

        //view root node
        var node = document.createElement( 'div' );
        node.id = hz.util.rand_id();
        node.className = 'view';

        //decorate root node
        ns.decorate( node, ns.CLOSE, title );

        //content container
        var container = document.createElement( 'div' );
        container.className = 'content';
        node.appendChild( container );

        //check for wrapper
        if( wrap_tag != null ) {
            var wrapper = document.createElement( wrap_tag );
            container.appendChild( wrapper );
            container = wrapper;
        }

        //see if content appears to be a DOM node
        if( ( typeof content === 'object'          )
         && ( 'nodeType' in content                )
         && ( typeof content.nodeType === 'number' ) ) {

            //most of the time, the content is an unwanted body element
            while( content.firstChild != null ) {
                container.appendChild( content.firstChild );
            }
        }

        //just jam the content into the container
        else {
            container.innerHTML = content;
        }

        //append viewer to body of document, and return the element
        return hz.util.append( document.body, node );
    };


    /**
     *  Initiates a request to view a document from a remote host.
     *
     *  @param url     The URL to request
     *  @param html    False if the response will not be an HTML document
     *  @param nocache False to allow normal response cache behavior
     *  @param title   Optional default title (if response has none)
     */
    ns.view_url = function( url ) {
        var html    = arguments.length > 1 ? arguments[ 1 ] : true;
        var nocache = arguments.length > 2 ? arguments[ 2 ] : true;
        var title   = arguments.length > 3 ? arguments[ 3 ] : '';

        //typical XHR setup
        var xhr     = new XMLHttpRequest();
        xhr.onerror = function( event ) { ns.error( 'HTTP Request Error' ); };
        xhr.onabort = function( event ) { ns.alert( 'HTTP Request Abort' ); };
        xhr.onload  = function( event ) {

            //fetch and parse the response's Content-Type header
            var rctype  = xhr.getResponseHeader( 'content-type' );
            rctype = hz.util.base_ctype( rctype );

            //if HTML, and we were expecting it, use it natively
            if( ( rctype == 'text/html' ) && ( html == true ) ) {
                ns.view( xhr.responseXML.body, xhr.responseXML.title );
            }

            //if plain text, ask to have it formatted like plain text
            else if( rctype == 'text/plain' ) {
                ns.view( xhr.responseText, title, 'pre' );
            }

            //otherwise, just show the response
            else {
                ns.view( xhr.responseText, title );
            }
        };

        //check for a desire to not cache the response
        if( nocache == true ) {
            url += ( url.indexOf( '?' ) == -1 ? '?' : '&' )
                + '_n=' + Date.now();
        }

        //initiate a GET query for the content
        xhr.open( 'GET', url );

        //this asks the browser to go ahead and parse the response as HTML
        if( html == true ) {
            xhr.responseType = 'document';
        }

        //send the request
        xhr.send();
    };


    return ns;
} )( hz.ui || {} );
