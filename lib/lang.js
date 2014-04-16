/*****************************************************************************
Hz Language Module

*****************************************************************************/

/*----------------------------------------------------------------------------
Hz Library Boilerplate
----------------------------------------------------------------------------*/
var hz = ( function( ns ) { return ns; } )( hz || {} );


/*----------------------------------------------------------------------------
Module Dependencies
----------------------------------------------------------------------------*/
/*?jspp { "include" : { "hz" : [] } } ?*/


/*----------------------------------------------------------------------------
Hz Language Submodule
----------------------------------------------------------------------------*/
hz.lang = ( function( ns ) {

    /*------------------------------------------------------------------------
    Public Properties
    ------------------------------------------------------------------------*/

    ns.noun = noun;                 //expose the noun handling class


    /*------------------------------------------------------------------------
    Public Methods
    ------------------------------------------------------------------------*/

    /**
     *  Convert the first character of all words in the string to upper case.
     *
     *  @param str The string to convert to "title case"
     *  @return    A "title case" version of the string
     */
    ns.title_case = function( str ) {
        return str.replace(
            /\b\w/g,
            function( m ) { return m.toUpperCase(); }
        );
    };


    /*------------------------------------------------------------------------
    Classes
    ------------------------------------------------------------------------*/

    /**
     *  Represents a noun given a common noun specification list.
     *
     *  @param spec The noun specification list
     */
    function noun( spec ) {
        this.vars = spec;
        switch( this.vars.length ) {
            case 0:
                this.vars[ 0 ] = 'thing';
            case 1:
                this.vars[ 1 ] = this.vars[ 0 ] + 's';
            case 2:
                this.vars[ 2 ] = ns.title_case( this.vars[ 0 ] );
            case 3:
                this.vars[ 3 ] = this.vars[ 2 ] + 's';
        }
    }

    /**
     *  Returns the plural form of the noun.
     *
     *  @param title Optionally set to true to request the noun for title case
     *  @return      The noun in its plural form
     */
    noun.prototype.plural = function() {
        var title = arguments.length > 0 ? !!arguments[ 0 ] : 0;
        return this.vars[ ( title * 2 ) + 1 ];
    };

    /**
     *  Returns the singular form of the noun.
     *
     *  @param title Optionally set to true to request the noun for title case
     *  @return      The noun in its singular form
     */
    noun.prototype.singular = function() {
        var title = arguments.length > 0 ? !!arguments[ 0 ] : 0;
        return this.vars[ title * 2 ];
    };


    return ns;
} )( hz.lang || {} );
