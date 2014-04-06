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

The typical element construction pattern used is that of appending generated
content to an existing element:

    var container = document.getElementById( 'container' );
    var button = hz.ui.add.button( container, 'Click Me!' );

This removes some of the repetitive appendChild() calls that shows up a lot in
my code.  Additionally, some of the internal mechanisms for manipulating the
document provide a few other convenience features (see util.js).

TODO:
  - updates to form class and ns.show_form
    - proper labeling (watch for widgets with labels: 'check')
    - tooltips, hints, validation regexps
    - make inputs support a 'reset' method to restore their initial values
      - implement a form reset
    - allow create-and-append for form fields that use ui.add.*
      - implement each complex input as a class that the ui.add.* uses
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
    ns.add = {

        /**
         *  Creates and adds a button input.
         *
         *  @param elem    The element that will contain the button
         *  @param value   The label text for the button
         *  @param handler An optional callback handler for the click event
         *  @return        The input element that was appended
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
         *  Creates and adds a textarea.
         *
         *  @param elem    The element that will contain the input
         *  @param value   Optional default text shown in input
         *  @param handler Optional callback handler for the change event
         *  @return        The input element that was appended
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
         *  Creates and adds a text input.
         *
         *  @param elem    The element that will contain the input
         *  @param value   Optional default ext shown in the input
         *  @Param handler Optional callback handler for the change event
         *  @return        The input element that was appended
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
         *  @param elem    The element that will contain the widget
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
         *  @return        The container DOM element (not an input)
         */
        'check' : function( elem, values ) {
            var handler = arguments.length > 2 ? arguments[ 2 ] : null;
            var flags   = arguments.length > 3 ? arguments[ 3 ] : 0;
            var select  = arguments.length > 4 ? arguments[ 4 ] : null;
            var itype   = 'checkbox';
            var iname   = null;
            var ul      = document.createElement( 'ul' );
            ul.className = 'check';
            if( flags & 1 ) {
                itype = 'radio';
                iname = 'radiogroup' + ns.add.radio_counter;
                ns.add.radio_counter += 1;
                ul.className += ' exclusive';
            }
            else {
                ul.className += ' inclusive';
            }
            var label, li, input, span;
            var make_check_item = function( value, text, checked ) {
                var check_id = 'checkid' + ns.add.check_id_counter;
                ns.add.check_id_counter += 1;
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
         *  @param flags Optional display flags (default 0)
         *                 1 : Show the fill total in %
         *  @return      The new element that was appended
         */
        'gauge' : function( elem ) {
            var label = arguments.length > 1 ? arguments[ 1 ] : '';
            var value = arguments.length > 2 ? arguments[ 2 ] : 0.0;
            var flags = arguments.length > 3 ? arguments[ 3 ] : 0;
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
            elem.appendChild( node );
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
         *  @param elem  The parent element of the new gauge widget
         *  @param label Optional textual label on top of the gauge
         *  @param value Optional initial value of the gauge (default is 0.0)
         *  @param flags Optional display flags (default 0)
         *                 1 : Show the fill total in %
         *  @return      The new element that was appended
         */
        'progress' : function( elem ) {
            var args = Array.prototype.slice.call( arguments );
            var node = ns.add.gauge.apply( this, args );
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
        elem.id = 'hzutil_modal' + _modal_counter;
        _modal_counter += 1;
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
        return hz.util.append( document.body, elem, true );
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
     *
     */
    ns.show_form = function( title, spec, callback ) {
        var notes = arguments.length > 3 ? arguments[ 3 ] : null;
        var node = document.createElement( 'div' );
        node.id = 'viewer' + _view_counter;
        _view_counter += 1;
        node.className = 'view';
        ns.decorate( node, ns.CLOSE, title );
        var content = document.createElement( 'div' );
        content.className = 'content';
        if( notes != null ) {
            var notes_elem = notes;
            if( typeof notes == 'string' ) {
                notes_elem = document.createElement( 'p' );
                notes_elem.innerHTML = notes;
            }
            hz.util.append( content, notes_elem );
        }
        var fld, hlp, lbl, nam, spc, typ, val;
        var frm = new form();
        var first = null;
        for( var key in spec ) {
            spc = spec[ key ];
            hlp = 'help'  in spc ? spc[ 'help' ]  : null;
            lbl = 'label' in spc ? spc[ 'label' ] : key;
            nam = 'name'  in spc ? spc[ 'name' ]  : key;
            typ = 'type'  in spc ? spc[ 'type' ]  : 'entry';
            val = 'value' in spc ? spc[ 'value' ] : '';
            fld = new form_field( lbl, hlp );
            var inp = ns.add[ typ ]( fld.get_connector(), val );
            if( first == null ) { first = inp; }
            inp.name = nam;
            fld.set_input( inp );
            frm.append_field( fld );
        }
        frm.append_submit(
            'Submit',
            function( data ) {
                frm.enable( false );
                if( callback( data ) == true ) {
                    ns.close_id( node.id );
                }
                else {
                    frm.enable( true );
                }
            }
        );
        var form_elem = frm.get_element();
        form_elem.onkeydown = function( event ) {
            if( event.keyCode == 13 ) {
                event.preventDefault();
                frm.enable( false );
                if( callback( frm.get_data() ) == true ) {
                    ns.close_id( node.id );
                }
                else {
                    frm.enable( true );
                }
            }
        };
        content.appendChild( form_elem );
        node.appendChild( content );
        hz.util.append( document.body, node, true );
        first.focus();
        return node;
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
     *  Displays generic HTML in a dynamically-generate element.  The intent
     *  is to then style this element so it appears to overlay on top of the
     *  document.
     *
     *  @param html A string of HTML to insert into the element's content area
     *  @return     The generated container element
     */
    ns.view = function( html ) {
        var node = document.createElement( 'div' );
        node.id = 'viewer' + _view_counter;
        _view_counter += 1;
        node.className = 'view';
        ns.decorate( node, ns.CLOSE );
        var content = document.createElement( 'div' );
        content.className = 'content';
        content.innerHTML = html;
        node.appendChild( content );
        return hz.util.append( document.body, node, true );
    };


    /**
     *  Initiates a request to view a document from a remote host.
     *
     *  @param url The URL to request
     */
    ns.view_url = function( url ) {
        var req = new XMLHttpRequest();
        req.onerror = function( e ) { ns.error( 'HTTP Request Error' ); };
        req.onabort = function( e ) { ns.alert( 'HTTP Request Abort' ); };
        req.onload  = function( e ) { ns.view( req.responseText ); };
        var q = ( url.indexOf( '?' ) == -1 ? '?' : '&' ) + '_n=' + Date.now();
        req.open( 'GET', url + q, true );
        req.send( null );
    };


    /*------------------------------------------------------------------------
    Classes
    ------------------------------------------------------------------------*/

    /**
     *  Creates document elements to build a form that deals with local state.
     *  Unlike traditional forms, this does NOT submit to a remote resource.
     *  The idea is to handle the form submission in the client, and pass on
     *  the request to the local application.
     *
     */
    function form() {
        this.fields = [];
        this.element = document.createElement( 'div' );
        this.element.className = 'form';
    }

    /**
     *  Appends a form_field object onto the form instance.
     *
     *  @param field The form_field object to append
     */
    form.prototype.append_field = function( field ) {
        this.fields.push( field );
        hz.util.append( this.element, field );
    };

    /**
     *  Appends a submit control onto the form instance.
     *
     *  @param label    The text label of the submit button
     *  @param callback The function to call when the form is submitted.
     *                  This function is passed the form data (see get_data())
     */
    form.prototype.append_submit = function( label, callback ) {
        var element = document.createElement( 'div' );
        element.className = 'control';
        var context = this;
        hz.ui.add.button(
            element,
            label,
            function( event ) {
                callback( context.get_data() );
            }
        );
        this.element.appendChild( element );
    };

    /**
     *  Enable or disable all fields in the form.
     *
     *  @param enable True to enable the form, false to disable it
     */
    form.prototype.enable = function() {
        var enable = arguments.length > 0 ? arguments[ 0 ] : true;
        for( var i = 0; i < this.fields.length; ++i ) {
            this.fields[ i ].input.disabled = !enable;
        }
    };

    /**
     *  Get all the data currently entered into the form.
     *
     *  @return The data entered into the form as an object of key-value pairs
     *          Some forms may have nested data (objects and arrays for
     *          values).
     */
    form.prototype.get_data = function() {
        var acount = 0;
        var bind;
        var data = {};
        var f;
        for( var i = 0; i < this.fields.length; ++i ) {
            f = this.fields[ i ];
            if( ( 'hz' in f.input ) && ( 'bind' in f.input.hz ) ) {
                bind = f.input.hz.bind;
            }
            else if( f.input.name ) {
                bind = f.input.name;
            }
            else if( f.input.id ) {
                bind = f.input.id;
            }
            else {
                bind = '_anonymous.' + acount;
                acount += 1;
            }
            hz.util.oset( data, bind, f.get_value() );
        }
        return data;
    };

    /**
     *  Get the root element of the form.
     *
     *  @return The root element of the form
     */
    form.prototype.get_element = function() {
        return this.element;
    };


    /**
     *  Constructs and helps interact with a form field.
     *
     *  @param label The text label that describes the input
     *  @param help  Optional help message to assist the user
     *  @param input Optional input element to use
     *  @param check Optional input value checking function.  When form data
     *               is requested, this function is passed the resolved value
     *               of the input.  The return value is used as the reported
     *               value of the input.
     */
    function form_field( label ) {
        var help     = arguments.length > 1 ? arguments[ 1 ] : null;
        this.input   = arguments.length > 2 ? arguments[ 2 ] : null;
        this.check   = arguments.length > 3 ? arguments[ 3 ] : null;
        this.element = document.createElement( 'div' );
        this.element.className = 'field';
        this.label   = document.createElement( 'label' );
        hz.util.append( this.label, label );
        this.element.appendChild( this.label );
        if( help != null ) {
            var span = document.createElement( 'span' );
            hz.util.append( span, help );
            this.label.appendChild( span );
        }
        this.connector = document.createElement( 'span' );
        if( this.input != null ) {
            this.set_input( this.input );
            this.connector.appendChild( this.input );
        }
        this.element.appendChild( this.connector );
    }

    /**
     *  Get the parent element of the input element.  Allows connecting new
     *  inputs to an existing form field.
     *
     *  @return The parent element of the input element
     */
    form_field.prototype.get_connector = function() {
        return this.connector;
    };

    /**
     *  Get the root element of the form field.
     *
     *  @return The root element of the form field
     */
    form_field.prototype.get_element = function() {
        return this.element;
    };

    /**
     *  Get the current value of the form field.
     *
     *  @return The current value of the form field
     */
    form_field.prototype.get_value = function() {
        var value = this._value();
        if( this.check != null ) {
            return this.check( value );
        }
        return value;
    };

    /**
     *  Set the input element of this field.  This does not append the input.
     *  This adds proper internal bindings and document references.
     *
     *  @param input The input that is being used with this field
     */
    form_field.prototype.set_input = function( input ) {
        this.input = input;
        if( input.id == '' ) {
            //ZIH - nodeValue not always good
            input.id = hz.util.make_id( this.label.firstChild.nodeValue );
        }
        var bind = input.name ? input.name : input.id;
        hz.util.oset( input, 'hz.bind', bind );
        this.label.setAttribute( 'for', input.id );
    };

    /**
     *  Internal value resolution.  Determines the best value to use for the
     *  type of input in this field.
     *
     *  @return The value of the input in this field.  This is usually a
     *          string, but may also be an array of values (e.g. inclusive
     *          selection inputs).
     */
    form_field.prototype._value = function() {
        var values = [];
        if( this.input.tagName == 'UL' ) {
            var input, item;
            var num_items = this.input.childNodes.length;
            if( this.input.className.indexOf( 'exclusive' ) != -1 ) {
                for( var i = 0; i < num_items; ++i ) {
                    item = this.input.childNodes[ i ];
                    input = item.getElementsByTagName( 'input' );
                    if( input.checked == true ) {
                        return input.value;
                    }
                }
                return null;
            }
            for( var i = 0; i < num_items; ++i ) {
                item = this.input.childNodes[ i ];
                input = item.getElementsByTagName( 'input' );
                if( input.checked == true ) {
                    values.push( input.value );
                }
            }
            return values;
        }
        else if( this.input.tagName == 'SELECT' ) {
            if( this.input.multiple == true ) {
                for( var i = 0; i < this.input.legth; ++i ) {
                    if( this.input.options[ i ].selected == true ) {
                        values.push( this.input.options[ i ].value );
                    }
                }
                return values;
            }
            return this.input.options[ this.input.selectedIndex ].value;
        }
        return this.input.value;
    };


    /*------------------------------------------------------------------------
    Private Properties
    ------------------------------------------------------------------------*/

    var _modal_counter = 0;
    var _view_counter  = 0;

    return ns;
} )( hz.ui || {} );
