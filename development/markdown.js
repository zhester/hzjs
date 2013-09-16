/*****************************************************************************

    markdown.js

    This is an experimental exercise in implementing a little markdown parser,
    and possibly a markdown generator for in-client interaction.

    The functions should (initially) look like this:

        //convert markdown (string) to a DOM Element
        elem = md2dom( md )

        //convert a DOM Element to markdown (string)
        md = dom2md( elem )

    I'm sure there will be a lot of edge cases and preferences where I'll need
    to add some optional behavior flags.

    Another design idea would be to avoid re-parsing the whole string each
    time, and pass in adds/updates/deletes for individual lines of the
    original string.

    Syntax based on: http://daringfireball.net/projects/markdown/syntax

*****************************************************************************/

function md2dom( markdown ) {

    var root = document.createElement( 'div' );
    var node = null;

    //ZIH - experiement with /(\s*\n){2,}/
    //  might be able to split with whitespace-only lines
    var blocks = markdown.split( /(\r?\n){2,}/ );

    for( var i = 0; i < blocks.length; ++i ) {
        node = _block2elem( blocks[ i ] );
        if( node != null ) {
            root.appendChild( node );
        }
    }

    return root;
}

function _block2elem( block ) {

    var lines = block.split( /\r?\n/ );

/*
Header
======

Subheader
---------

# H1 #

## H2 ##

### H3 ###

# H1

## H2

### H3

> blockquote line 1
> blockquote line 2
> > nested blockquote

> lazy blockquote
with a few more
lines of text

* unordered
* list
* items
(also: + or -)

1. ordered
2. list
3. items

    int main( int argc, char** argv ) {
        //put code here
        return 0;
    }

Text [link text](http://domain/blah/ "Link Title") more text.

Text [link text][1] more text.

[1]: http://domain/blah/ "Link Title"



*/


    return null;
}
