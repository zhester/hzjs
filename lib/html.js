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
 *  Attempts to append almost anything to the element.
 *
 *  @param child The child element, string, object, etc to append
 *  @return      The DOM element that was appended.  If a collection of
 *               elements was appended, the element's childNodes collection
 *               is returned.
 */
Element.prototype.append = function() {

    var match;                      //expression match object
    var node;                       //the node to append to the DOM

    //protect against messing up the DOM
    if( hz.html.is_terminal( this ) == true ) {
        return null;
    }

    //set the child thing that will be appended
    var child = arguments.length > 0 ? arguments[ 0 ] : null;

    //check for null or nothing passed as thing to append
    if( child === null ) {

        //just create an empty text node
        node = document.createTextNode( '' );
    }

    //object passed, play duck-duck-goose until we find something useful
    else if( typeof child === 'object' ) {

        //if the object appears to be a DOM node, use it directly
        if( ( 'nodeType' in child )
         && ( ( child.nodeType == 1 ) || ( child.nodeType == 3 ) ) ) {
            node = child;
        }

        //if the object appears to be a collection of nodes, append them
        else if( ( 'length' in child ) && ( 'item' in child ) ) {
            this.appendCollection( child );
            return this.childNodes;
        }

        //if the object can be safely converted to a string, do it
        else if( 'toString' in child ) {
            return this.append( child.toString() );
        }

        //the object is stubborn, inform the developer of a problem
        else {
            throw new Error( 'Attempted to append invalid object.' );
        }
    }

    //function passed, attempt to append whatever it returns
    else if( typeof child === 'function' ) {
        return this.append( child() );
    }

    //this is a convenience feature for quickly appending by tag name
    else if( ( match = child.match( /^<([^>]+)>$/ ) ) !== null ) {
        node = document.createElement( match[ 1 ] );
    }

    //this is (hopefully) a primitive type that we can treat as plain text
    else {
        node = document.createTextNode( child );
    }

    //append what we created
    this.appendChild( node );

    //return what we created
    return node;
};


/**
 *  Appends an HTMLCollection (interface) to a DOM Element.
 *
 *  @param collection The HTMLCollection to append to the element
 */
Element.prototype.appendCollection = function( collection ) {
    var num = collection.length;
    for( var i = ( num - 1 ); i >= 0; --i ) {
        this.insertBefore( collection.item( i ), this.firstChild );
    }
};


/**
 *  Binds direct references to descendent elements that have a defined ID to
 *  the element as simple properties of the element's object.
 *
 *  @param obj Optionally specify an alternative target object to bind
 *  @param ids Optionally specify only the IDs of interest
 */
Element.prototype.bindElements = function() {
    function sid( id ) { return id.replace( /[.-]+/g, '_' ); };
    var obj = arguments.length > 0 ? arguments[ 0 ] : this;
    //limited ID list specified
    if( arguments.length > 1 ) {
        var ids = ( arguments[ 1 ] instanceof Array ) ? ids : [ ids ];
        for( var i = 0; i < ids.length; ++i ) {
            obj[ sid( ids[ i ] ) ] = document.getElementById( ids[ i ] );
        }
    }
    //all descendents with IDs implied
    else {
        var cn;
        var num = this.childNodes.length;
        //scan all direct descendents for specified ID values
        for( var i = 0; i < num; ++i ) {
            cn = this.childNodes[ i ];
            //see if this node can be bound
            if( ( 'id' in cn ) && ( cn.id.length > 0 ) ) {
                obj[ sid( cn.id ) ] = cn;
            }
            //attempt to bind all descendents of this node
            if( 'bindElements' in cn ) {
                cn.bindElements( obj );
            }
        }
    }
};


/**
 *  Convenience method to remove all children from an element.
 *
 */
Element.prototype.removeChildren = function() {
    while( this.firstChild != null ) {
        this.removeChild( this.firstChild );
    }
};


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


/**
 *  Adds a uniform text data accessor property for all Nodes.
 *
 */
Object.defineProperty(
    Node.prototype,
    'textValue',
    {
        'enumerable' : true,
        'get' : function() {
            if( this.nodeType == 3 ) { return this.nodeValue; }
        },
        'set' : function( value ) {
            if( this.nodeType == 3 ) { this.nodeValue = value; }
            return null;
        }
    }
);


/**
 *  Adds a uniform text data accessor property for all Elements.
 *
 */
Object.defineProperty(
    Element.prototype,
    'textValue',
    {
        'enumerable' : true,
        'get' : function() {
            if( ( this.firstChild !== null      )
             && ( this.firstChild.nodeType == 3 ) ) {
                return this.firstChild.nodeValue;
            }
            return null;
        },
        'set' : function( value ) {
            if( this.firstChild === null ) {
                this.appendChild( document.createTextNode( value ) );
            }
            else if( this.firstChild.nodeType == 3 ) {
                this.firstChild.nodeValue = value;
            }
        }
    }
);


/**
 *  Adds a uniform text data accessor property for all input elements.
 *
 */
Object.defineProperty(
    HTMLInputElement.prototype,
    'textValue',
    {
        'enumerable' : true,
        'get' : function() { return this.value; },
        'set' : function( value ) { this.value = value; }
    }
);


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
