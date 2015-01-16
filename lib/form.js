/*****************************************************************************
Hz Form Module

TODO:
  - add form validation definitions and auto-validation before submitting
      - consider auto-generating hints/tooltips based on validation defs
  - add simplified hooks for on-the-fly field validation and auto-completion
    with possible requests to a remote resource
*****************************************************************************/

/*----------------------------------------------------------------------------
Hz Library Boilerplate
----------------------------------------------------------------------------*/
var hz = ( function( ns ) { return ns; } )( hz || {} );


/*----------------------------------------------------------------------------
Module Dependencies
----------------------------------------------------------------------------*/
/*?jspp { "include" : { "hz" : [ "ui", "util" ] } } ?*/


/*----------------------------------------------------------------------------
Additions to Base Types
----------------------------------------------------------------------------*/

/**
 *  Attempts to focus on the best element for keyboard input.
 *
 */
HTMLFormElement.prototype.autoFocus = function() {
    var num_elements = this.elements.length;
    for( var i = 0; i < num_elements; ++i ) {
        if( this.elements[ i ].type != 'hidden' ) {
            this.elements[ i ].focus();
            return;
        }
    }
};


/**
 *  Enable or disable all fields in the form.
 *
 *  @param enable True to enable the form, false to disable it
 */
HTMLFormElement.prototype.enableAll = function() {
    var enable = arguments.length > 0 ? arguments[ 0 ] : true;
    var num_elements = this.elements.length;
    for( var i = 0; i < num_elements; ++i ) {
        this.elements[ i ].disabled = !enable;
    }
};


/**
 *  Copies all the input data contained in the form into an object that is
 *  intended to be submitted to a remote resource (usually as JSON).
 *
 *  Inputs of type submit, reset, button, and image are ignored.
 *  Inputs whose names begin with "__" are ignored.
 *  Inputs for which a distinct name can not be determined are added to a list
 *  of values under the "_anonymous" property in the object.
 *
 *  @return An object containing data entered into the form
 */
HTMLFormElement.prototype.getData = function() {
    var a = '_anonymous';
    var bind;
    var data = {};
    var f;
    var num_elements = this.elements.length;
    for( var i = 0; i < num_elements; ++i ) {
        f = this.elements.item( i );
        if( ( f.name.substring( 0, 2 ) == '__'             )
         || ( hz.form.ignore_types.indexOf( f.type ) != -1 ) ) {
            continue;
        }
        bind = f.name.length > 0 ? f.name : f.id;
        if( bind.length > 0 ) {
            data[ bind ] = hz.form.get_value( f );
        }
        else {
            if( ( a in data ) == false ) { data[ a ] = []; }
            data[ a ].push( hz.form.get_value( f ) );
        }
    }
    return data;
};


/**
 *  Convenience method to set a value in a form as a hidden input.
 *
 *  @param name  The name of the hidden input
 *  @param value The value to set in the hidden input
 *  @return      The input element that was constructed (or updated)
 */
HTMLFormElement.prototype.setHiddenInput = function( name, value ) {
    var input = this.elements.namedItem( name );
    if( input == null ) {
        input = document.createElement( 'input' );
        this.appendChild( input );
    }
    hz.util.omap(
        input,
        { 'type' : 'hidden', 'name' : name, 'value' : value }
    );
    return input;
};


/*----------------------------------------------------------------------------
Hz Form Submodule
----------------------------------------------------------------------------*/
hz.form = ( function( ns ) {

    /*------------------------------------------------------------------------
    Public Properties
    ------------------------------------------------------------------------*/

    ns.ignore_types = [ 'submit', 'reset', 'button', 'image' ];
                                    //input types ignored in forms

    /*------------------------------------------------------------------------
    Public Methods
    ------------------------------------------------------------------------*/

    /**
     *  Consistently builds complex document structure to house an input in
     *  a form.
     *
     *  @param label The content of the field's label
     *  @param input Optional input element (defaults to un-typed input)
     *  @param help  Optional user assistance information
     *  @return      The container to append to the form
     */
    ns.create_field = function( label ) {
        var input = arguments.length > 1 ? arguments[ 1 ] : null;
        var help  = arguments.length > 2 ? arguments[ 2 ] : null;

        //the field's container element
        var div = document.createElement( 'div' );
        div.className = 'field';

        //the field's label
        var lbl = document.createElement( 'label' );
        hz.util.append( lbl, label );
        div.appendChild( lbl );

        var span;

        //check for a specified help message
        if( help != null ) {
            span = document.createElement( 'span' );
            hz.util.append( span, help );
            lbl.appendChild( span );
        }

        //see if the user wants a default input element
        if( input == null ) {
            input = document.createElement( 'input' );
        }

        //see if this input needs a name
        if( input.name == '' ) {
            input.name = hz.util.slug( label );
        }

        //see if the input needs an ID
        if( input.id == '' ) {
            input.id = input.name;
        }

        //set the label's "for" attribute for proper interaction
        lbl.setAttribute( 'for', input.id );

        //set up and append the input's container to the field container
        span = document.createElement( 'span' );
        span.appendChild( input );
        div.appendChild( span );

        //decorate the element for future access
        div.hz = { 'input' : input };

        //return the form field structure
        return div;
    };


    /**
     *  Default form construction.  Creates the form in a controlled way to
     *  prevent default browser behavior (these forms are not meant to be
     *  submitted by the browser to a remote resource).
     *
     *  @param handler Optional callback handler for submit events
     *  @return        The form element that was created
     */
    ns.create_form = function() {
        var handler = arguments.length > 0 ? arguments[ 0 ] : null;

        //create a form element
        var form = document.createElement( 'form' );
        form.className = 'form';

        //handle all submit events ourselves (the user can override this)
        form.onsubmit = function( event ) {
            event.preventDefault();
            if( handler instanceof Function ) {
                handler( event );
            }
        };

        //this sets up a redirect for calling submit() directly on the form
        var event = new Event(
            'trap_submit',
            { 'bubbles' : false, 'cancelable' : true }
        );
        form.addEventListener( 'trap_submit', form.onsubmit );
        form.submit = function() { return form.dispatchEvent( event ); };

        //attach magical form builder method
        form.build = _build;

        //return the constructed form element
        return form;
    };


    /**
     *  Deals with the complexities of fetching a value from an input.  The
     *  given input is not always an input element.  It may also be a known
     *  container for composite inputs (e.g. "check" inputs from the hz.ui
     *  module).
     *
     *  @param input The input element from which to get it's current value
     *  @return      The value of the input.  This is usually a string, but
     *               may also be an array of values (e.g. inclusive select
     *               inputs).  If a value could not be resolved, returns null.
     */
    ns.get_value = function( input ) {

        //check the input for a self-specified getter
        if( 'getValue' in input ) {
            return input.getValue();
        }

        //a container for extracting multiple values from some elements
        var values = [];

        //special-case form elements may be a list of checkbox|radio inputs
        if( input.tagName == 'UL' ) {
            var inp, item;
            var num_items = input.childNodes.length;
            if( input.className.indexOf( 'exclusive' ) != -1 ) {
                for( var i = 0; i < num_items; ++i ) {
                    item = input.childNodes[ i ];
                    inp = item.getElementsByTagName( 'input' ).item( 0 );
                    if( inp.checked == true ) {
                        return inp.value;
                    }
                }
                return null;
            }
            for( var i = 0; i < num_items; ++i ) {
                item = input.childNodes[ i ];
                inp = item.getElementsByTagName( 'input' ).item( 0 );
                if( inp.checked == true ) {
                    values.push( inp.value );
                }
            }
            return values;
        }

        //handle select inputs (that may contain multiple values)
        else if( input.tagName == 'SELECT' ) {
            if( input.multiple == true ) {
                for( var i = 0; i < input.options.legth; ++i ) {
                    if( input.options[ i ].selected == true ) {
                        values.push( input.options[ i ].value );
                    }
                }
                return values;
            }
            return input.options[ input.selectedIndex ].value;
        }

        //handle file inputs
        else if( input.type == 'file' ) {
            return input.files;
        }

        //return the value of all other form elements
        return input.value;
    };


    /*------------------------------------------------------------------------
    Classes
    ------------------------------------------------------------------------*/

    /*------------------------------------------------------------------------
    Private Properties
    ------------------------------------------------------------------------*/

    var _build_keys = [ 'args', 'help', 'label', 'name', 'type', 'value' ];
                                    //desired form field building keys


    /*------------------------------------------------------------------------
    Private Methods
    ------------------------------------------------------------------------*/

    /**
     *  Convenience function that gets added to internally-constructed forms.
     *
     *  @param formspec A form specification object (object of fields)
     *  @param sublabel The label of the submit button in the form
     */
    function _build( formspec ) {
        var sublabel = arguments.length > 1 ? arguments[ 1 ] : 'Submit';

        var field, input, spec;
        for( var key in formspec ) {
            spec = formspec[ key ];
            hz.util.odef( spec, _build_keys );
            if( spec.type == 'hidden' ) {
                this.setHiddenInput( key, spec.value );
                continue;
            }
            if( spec.type  == null ) { spec.type  = 'entry'; }
            if( spec.label == null ) { spec.label = key;     }
            if( spec.name  == null ) { spec.name  = key;     }
            if( spec.args  == null ) {
                spec.args = spec.value != null
                    ? spec.args = [ spec.value ] : spec.args = [];
            }
            input = hz.ui.create[ spec.type ].apply( null, spec.args );
            input.name = spec.name;
            field = ns.create_field( spec.label, input, spec.help );
            this.appendChild( field );
        }

        if( sublabel != null ) {
            var button = hz.ui.create.button( sublabel );
            button.type = 'submit';
            var subfield = document.createElement( 'div' );
            subfield.className = 'control';
            subfield.appendChild( button );
            this.appendChild( subfield );
        }

    };


    return ns;
} )( hz.form || {} );
