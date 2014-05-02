/*****************************************************************************
Hz HTML Information Module

*****************************************************************************/

/*----------------------------------------------------------------------------
Hz Library Boilerplate
----------------------------------------------------------------------------*/
var hz = ( function( ns ) { return ns; } )( hz || {} );

/*----------------------------------------------------------------------------
Module Dependencies
----------------------------------------------------------------------------*/
/*?jspp { "include" : { "hz" : [ "util" ] } } ?*/

/*----------------------------------------------------------------------------
Additions to Base Types
----------------------------------------------------------------------------*/

/**
 *  Returns an object that adheres to the HTMLCollection interface containing
 *  all descendent elements that may contain a URL.  Each element in the
 *  collection is also "upgraded" with a generic url property that can be
 *  used to get or set its URL (regardless of the attribute in which it is
 *  needed).
 *
 *  @return An icollection instance containing elements that may have URLs
 */
HTMLElement.prototype.getURLNodes = function() {

    //local variables to keep code/lookups minimal
    var e, es;

    //create a new icollection to contain the discovered nodes
    var nodes = new hz.util.icollection();

    //shortcut to the list of tags with URL attributes
    var tags = hz.html.has_url;

    //search for occurrances of tags with URL attributes
    for( var i = 0; i < tags.length; ++i ) {
        es = this.getElementsByTagName( tags[ i ] );
        for( var j = 0; j < es.length; ++j ) {

            //upgrade the element's object to support the url property
            e = es[ j ];
            e.urlAttribute = hz.html.has_url_att[ i ];
            Object.defineProperty( e, 'url', hz.html.url_descr );

            //add the element to the collection
            nodes._add( e );
        }
    }

    //return the populated collection
    return nodes;
};


/*----------------------------------------------------------------------------
Hz HTML Submodule
----------------------------------------------------------------------------*/
hz.html = ( function( ns ) {

    /*------------------------------------------------------------------------
    Public Properties
    ------------------------------------------------------------------------*/

    //list of HTML elements that may contain a URL/URI
    ns.has_url = [ 'a', 'audio', 'base', 'form', 'iframe', 'img',
        'input', 'link', 'object', 'script', 'source', 'video' ];

    //the attributes of the elements in the previous list that specify a URL
    ns.has_url_att = [ 'href', 'src', 'href', 'action', 'src', 'src',
        'formaction', 'href', 'data', 'src', 'src', 'src' ];

    //list of HTML elements that should not have children
    ns.self_closing = [ 'area', 'br', 'col', 'embed', 'hr',
        'img', 'input', 'link', 'meta', 'param' ];

    //URL property descriptor
    ns.url_descr = {
        'enumerable' : true,
        'get' : function() {
            return this.getAttribute( this.urlAttribute );
        },
        'set' : function( value ) {
            this.setAttribute( this.urlAttribute, value );
        }
    };

    /*------------------------------------------------------------------------
    Public Methods
    ------------------------------------------------------------------------*/

    /**
     *  Determines if a given element should be a terminal tag.  This does not
     *  test the document to see if it really is terminal in the tree.
     *
     *  @param element The element to test
     *  @return True if the element is termina, false if not
     */
    ns.is_terminal = function( element ) {
        return ns.self_closing.indexOf( element.tagName.toLowerCase() ) != -1;
    };


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
} )( hz.html || {} );
