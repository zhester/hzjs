/*****************************************************************************
Form v2 Utilities

This module is intended to replace many features in the `form` and `ui`
modules.  The primary goal is a simplification of form construction and
interrogation, along with unifying it with the more easily-maintained DTL
method for constructing pieces of a document.

Design priorities:

- extend the native elements to support a few new methods/properties
    - `fields` property provides a live list of form fields similar to the
      `elements` property, but is able to more intelligently combine composite
      form fields

- modeling:
    - a `field` is the base unit for capturing user input.  a single field
      may be composed of one or more HTML input elements.  however, a field
      should represent one common piece of user information.  e.g. a date,
      a string, an inclusive selection of options, city+state+zip, etc.
    - a `fieldgroup` is a collection of `field`s and `fieldgroup`s
    - a `form` is a specialized `fieldgroup` that maintains specifics about
      how to work with the entirety of the user's input (e.g. collating all
      the data in the form, and providing it to event handlers, or just
      submitting the data to a remote resource).

Each field is identified by either its basic HTML input type: input, select,
textarea, or an extended "ui" type: entry, edit, check.  Fields may also be
one of the special non-input types: heading, help.  The field, itself, is an
HTML <div> element that contains a two-part internal structure:

    <div>
        <label>Label Text</label>
        <div></div>
    </div>

The interior <div> element will contain the internal structure necessary to
present the user input for the given piece of information.

All `field`s and `fieldgroup`s support the following common interface:

- addListener( type, callback )
- addValidator( type, param, help )
- clearError()
- enable( enabled )
- focusInput()
- get( key )
- getValue()
- lock( locked )
- removeListener( type, callback )
- reset()
- setError( text )
- set( key, value )
- setValue( value )
- toString()

    - handler types are standard DOM handler types ( 'change', 'click', etc.)
      there may be a few special handlers such as 'enter' that are fired when
      the enter key is pressed while focused on an input element within the
      field or fieldgroup
    - properties allow uniform access to special attributes and internal
      properties for a field or fieldgroup.  some special properties include:
      - name: proxies the input element(s) name attribute
      - label: allows access to human-friendly label
      - help: allows access to per-field/fieldgroup help text
      - value: another way to access the current value of the field
    - the `toString()` method converts any `field`'s or `fieldgroup`'s value
      to a string regardless of the normal value returned (see below).  when
      a value is converted to a string, its normal value is encoded using
      JSON.stringify().
    - `reset()`ing a field causes it to clear any current errors, and restores
      the field's value to that which was last set via initialization or the
      last call to setValue() (or set( 'value', ... ))

Not all form fields report their values as strings.  Some will report arrays
(composite fields such as inclusive selection, city+state+zip) or numeric
values (integer-filtered inputs, range inputs, color pickers).

When setting values on non-trivial fields and fieldgroups, be sure to mimic
the structure of what they would normally report.  If a string is passed as a
value to a composite field, it may be passed through JSON.parse() before it is
used to update the value in the field.

The DTL for building a form looks similar to how a regular fragment of the DOM
is constructed.  The difference is that the element specifiers do not always
refer to individual elements in the DOM.  These specifiers "expand" into all
the elements necessary to represent the target item, but are represented by a
singular HTMLElement object when constructed.

    '_field'
    '_fieldgroup'
    '_form'
    '_entry'
    '_edit'
    '_check_exc'
    '_check_inc'
    '_check_lim'
    '_file'

There are also "expanded" elements that are constructed a little differently
to support future improvements of HTML elements.

    'date'
    'color'

*****************************************************************************/

/*----------------------------------------------------------------------------
Library Boilerplate
----------------------------------------------------------------------------*/
var hz = ( function( ns ) { return ns; } )( hz || {} );

/*----------------------------------------------------------------------------
Module Dependencies
----------------------------------------------------------------------------*/
/*?jspp { "include" : { "hz" : [] } } ?*/

/*----------------------------------------------------------------------------
Form v2 Utilities Submodule
----------------------------------------------------------------------------*/
hz.submodule = ( function( ns ) {

    /*------------------------------------------------------------------------
    Public Properties
    ------------------------------------------------------------------------*/

    /*------------------------------------------------------------------------
    Public Methods
    ------------------------------------------------------------------------*/

    /*------------------------------------------------------------------------
    Classes
    ------------------------------------------------------------------------*/

    /*------------------------------------------------------------------------
    Private Properties
    ------------------------------------------------------------------------*/

    /*------------------------------------------------------------------------
    Private Methods
    ------------------------------------------------------------------------*/


    return ns;
} )( hz.submodule || {} );

