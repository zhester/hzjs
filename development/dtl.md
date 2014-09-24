Document Tree Literals (DTL)
============================

Introduction
============

Document Tree Literals provide a flexible way to specify fragments of a
document tree.  The goal is to be able to easily create and manage DOM
fragments by writing only the code that is unique to the tree that needs to be
manipulated.  Typically, the tree needs to repeatedly reference members of the
tree (e.g. rapidly updating a value in a display node).

The traditional way is to create the document tree fragment in HTML.  However,
that separates where the tree is specified from the tightly-coupled logic that
manipulates it.  This can cause a lot of refactoring headaches when it's not
necessary to de-couple complex tree structure (for the sake of ideology).  In
most of my cases of doing a lot of complex DOM manipulation, I want to
generate small portions of the document within the logic, and "attach" them to
the presentation layer that is well-abstracted.

The more typical way is to call the DOM methods provided by the browser
(repeatedly) until the sub-tree is suitably created.  The DOM methods tend to
get a bit verbose, and a script ends up causing the browser to load a lot more
repeated code than truly significant information.

Tree Specification
==================

The tree is specified by nested arrays of node specifiers.  A node specifier
must begin with the element name (tag name) as a string.  All other values in
the array are used according to their type for document construction under
that node.

    [ 'p', 'hello world' ] == <p>hello world</p>

If the type of element in the specifier is an associative array, it is treated
as list of attributes to set on the node.

    [ 'span', { 'style' : 'color:red;font-weight:bold;' }, 'ERROR!' ]
    ==
    <span style="color:red;font-weight:bold;">ERROR!</span>

If the type of element in the specifier is a numerically-indexed array, it is
treated as a list of child node specifiers to be appended to the base node.

    [ 'div', [ [ 'p', 'hello foo' ], [ 'p', 'hello bar' ] ] ]
    ==
    <div><p>hello foo</p><p>hello bar</p></div>

The children specified in this list need not all be specifier arrays.  They
can also be DOM nodes themselves.

    var node = document.createElement( 'p' );
    node.appendChild( document.createTextNode( 'Node 2' ) );
    node.onclick = function( event ) { alert( 'Node 2!' ); };
    var dtl = [ 'div', [ [ 'p', 'Node 1' ], node ] ];

Order is important when dealing with repeated specifications for the same
type.  For example, when giving two strings in the specifier, both strings
create text nodes, and are appended to the base node:

    [ 'p', 'hello ', 'world' ] == <p>hello world</p>

The subtle difference is that those two text nodes are separate in the DOM,
and can be addressed and manipulated independently.  I don't know of an easy
way to do that with HTML (beyond adding more markup).

When dealing with repeated attribute lists, attributes of the same name that
appear in _later_ lists will override the values set in the _earlier_
attribute lists.

    [ 'p', 'Hi!', { 'class' : 'greeting' }, { 'class' : 'salutation' } ]
    ==
    <p class="salutation">Hi!</p>

Additional numerically-indexed arrays are treated as if they were all a part
of the same list of child node specifiers; all of the child nodes from all
arrays are created and appended.

Library Interface
=================

The `build()` function is used by simply passing the DTL structure or string
representing the structure.  The return value is a DOM HTMLElement that
represents the root node in the given structure.  One exception may be thrown
if one of the specified items doesn't work with the built-in type sniffing.

    //Typical literal usage.
    var dtl = [ 'div', 'Example Div', { 'id' : 'did' } ];
    var div = hz.doc.build( dtl );
    document.body.appendChild( div );

    //String literal usage.
    document.body.appendChild(hz.doc.build('[div,"Example Div",{id:"did"}]'));

Example Comparisons
===================

Example: HTML
-------------

### The Document

    { HTML intro }
    <div id="my_widget">
        <h1>The Widget Heading</h1>
        <p>Some information for the user.</p>
        <p><input type="text" id="user_input"></p>
        <p><input type="button" value="Input" onclick="take_input(event);"></p>
    </div>
    { HTML outtro }

### The Script (usually in some other file)

    function take_input( event ) {
        var user_input = document.getElementById( 'user_input' );
        if( user_input != null ) {
            alert( 'You input "' + user_input.value + '"' );
        }
    }

In this case, if the outside document has to change (e.g. someone changes the
`id` attribute in the text input), the script has to be updated.  There's also
a check to make sure the DOM was successful in it's (not-so-cheap) search of
the document tree.

Example: JavaScript and pure DOM
--------------------------------

### The Script

    var div = document.createElement( 'div' );
    var h1 = document.createElement( 'h1' );
    h1.appendChild( document.createTextNode( 'The Widget Heading' ) );
    var p = document.createElement( 'p' );
    p.appendChild(
        document.createTextNode( 'Some information for the user.' )
    );
    div.appendChild( p );
    p = document.createElement( 'p' );
    var text_input = document.createElement( 'input' );
    text_input.setAttribute( 'type', 'text' );
    text_input.id = 'user_input';
    p.appendChild( text_input );
    div.appendChild( p );
    p = document.createElement( 'p' );
    var input = document.createElement( 'input' );
    input.setAttribute( 'type', 'button' );
    input.setAttribute( 'value', 'Input' );
    input.onclick = function( event ) {
        alert( 'You input "' + text_input.value + '"' );
    }
    p.appendChild( input );
    div.appendChild( p );
    document.body.appendChild( div );

In this case, we had to specify a lot more redundant data, with very little
application-specific information (relatively).  A major improvement is the
removal of the need to sanity check the DOM retrieval process.  We also aren't
dealing with dual maintenance against the particulars of the document since
it's both generated and manipulated in close proximity.

Example: Document Tree Literals
-------------------------------

### The Script

    var fragment = hz.doc.build(
        [ 'div', [
            [ 'h1', 'The Widget Heading' ],
            [ 'p', 'Some information for the user.' ],
            [ 'p', [
                [ 'input', { 'type' : 'text', 'id' : 'user_input' } ],
            ] ],
            [ 'p', [
                [ 'input', {
                    'type' : 'button',
                    'value' : 'input',
                    'onclick' : function( event ) {
                        alert(
                            'You input "' + fragment.user_input.value + '"'
                        );
                    }
                } ],
            ] ]
        ] ]
    );

In this case, we end up writing a little more text than the HTML document that
has an accompanying script.  However, we've eliminated dual maintenance.
We've also reduced all the reduntant code to be hidden behind the `build()`
function.  So, for this example, we really aren't saving an appreciable amount
of information transfer.  However, now we only need to maintain
application-specific information, and not a lot of calls and checks to
repeated methods.

Futhermore, my style for writing code literals is a tad verbose.  These
literals can be dropped into a string, and slightly _compressed_ for more
terse specification.

Example: Terse Document Construction
------------------------------------

### HTML

    <div>
        <h1>Heading</h1>
        <p>Paragraph 1</p>
        <p>Paragraph 2</p>
    </div>

### DTL

    '[div,[[h1,"Heading"],[p,"Paragraph 1"],[p,"Paragraph 2"]]]'

The "compression" comes from not having to quote the tag name or any attribute
names.  FYI: When this string is passed into the `build()` function, it is
re-translated into valid JSON (replacing the quotation marks), then parsed by
the browser's JSON implementation.  Therefore, we don't get to insert things
like functions or DOM element directly when using this technique.  However,
accessing the constructed fragment becomes quite a bit easier when you start
to use the auto-ID feature.

Automatic ID Usage
------------------

If any element is given a DOM ID through its attribute array (see the
"user_input" example above), and the ID does not collide the the native
JavaScript base objects or DOM HTMLElement objects (e.g. it's not "length" or
"item"), the constructed root node is assigned a new property with the ID
value as the name of the property.  This can be used to completely
short-circuit DOM lookups over the life of the application.

When to use HTMLElement.innerHTML
=================================

Unless you're going for some kind of "code purity" contest, `innerHTML` is
faster and simpler to use than this system when all you need is a quick
document fragment thrown into the DOM.  However, if you need to go back and
manipulate elements within that fragment, it starts to be easier to maintain
when those elements are procedurally generated and referenced outside of a
single HTML string.

Futhermore, if you're going to continue appending to the same element, using
`innerHTML` with in-place append (`+=`), this system starts to demonstrate
some performance benefits since the intial parts of the structure don't need
to be re-parsed.  Only the new stuff has to be created and appended.

