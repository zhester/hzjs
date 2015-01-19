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
     * Constructs an English string describing a temporal interval.
     *
     * For reference:
     *    days in a year  == 365.25 == 31+28.25+31+30+31+30+31+31+30+31+30+31
     *    days in a month == 30.44  == 365.25 / 12
     *
     * @param time  The time interval to describe (number of milliseconds)
     * @param exact Set to describe the interval exactly.  The default (false)
     *              describes the interval using the longest temporal unit
     *              possible.
     * @return      An English string describing the temporal interval
     */
    ns.interval = function( time ) {
        var exact = arguments.length > 1 ? arguments[ 1 ] : false;
        var diff  = Math.abs( Math.floor( time / 1000 ) );

        //the last item in the list is a sentinal (it is not used for output)
        var max_index = _tunits.length - 1;

        //boundary check the amount of time we need to describe
        if( diff >= _tunits[ max_index ][ 0 ] ) {
            return 'a very long time';
        }
        else if( diff == 0 ) {
            return '0 ' + _tunits[ 0 ][ 1 ] + 's';
        }

        //temporary values needed to build the string
        var intervals = [], periods, unit;

        //iterate through units of time in reverse
        for( var i = ( max_index - 1 ); i >= 0; --i ) {

            //see if the time remaining has one or more of these units
            if( diff >= _tunits[ i ][ 0 ] ) {

                //construct a string describe the interval for this unit
                periods = Math.floor( diff / _tunits[ i ][ 0 ] );
                unit    = _tunits[ i ][ 1 ];
                intervals.push(
                    periods + ' ' + ( periods != 1 ? unit + 's' : unit )
                );

                //if the user wants a vague description, stop checking units
                if( exact == false ) {
                    break;
                }

                //the user wants an exact description, deduct some time
                else {
                    diff -= periods * _tunits[ i ][ 0 ];
                }
            }
        }

        //produce the final descriptive string
        return intervals.join( ', ' );
    }


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

    /*------------------------------------------------------------------------
    Private Properties
    ------------------------------------------------------------------------*/

    //units of time by number of seconds in each
    var _tunits = [
        [          1, 'second' ],
        [         60, 'minute' ],
        [       3600, 'hour'   ],
        [      86400, 'day'    ],
        [     604800, 'week'   ],
        [    2630016, 'month'  ],
        [   31556600, 'year'   ],
        [ 4294967295, 'epoch'  ]
    ];

    return ns;
} )( hz.lang || {} );
