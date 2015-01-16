/*****************************************************************************
Hz Math Library

Various math-related utilities are kept here.

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
Hz Math Submodule
----------------------------------------------------------------------------*/
hz.math = ( function( ns ) {

    /*------------------------------------------------------------------------
    Public Properties
    ------------------------------------------------------------------------*/

    /*------------------------------------------------------------------------
    Public Methods
    ------------------------------------------------------------------------*/


    /**
     *  Static methods for dealing with IPv4 addresses and network ranges.
     *
     */
    ns.ipv4 = {


        /**
         *  Converts an IP address value to a dotted-decimal string.
         *
         *  @param addr The address to convert
         *  @param      The address as a dotted-decimal string
         */
        'addr2str' : function( addr ) {
            return [
                ( ( addr >> 24 ) & 0xFF ),
                ( ( addr >> 16 ) & 0xFF ),
                ( ( addr >>  8 ) & 0xFF ),
                ( ( addr >>  0 ) & 0xFF )
            ].join( '.' );
        },


        /**
         *  Gets a network range's number of masked bits.
         *
         *  @param start_addr The start address of the range
         *  @param end_addr   The end address of the range
         *  @return           The number of masked bits for the range
         */
        'get_slash' : function( start_addr, end_addr ) {
            var num_addrs = ( end_addr + 1 ) - start_addr;
            //OR-ing with 0 truncates the value to an integer
            return 32 - ( ns.log2( num_addrs ) | 0 );
        },


        /**
         *  Converts some range strings to a mask-style network range string.
         *  This is intended to work with the results of WHOIS queries that
         *  use "<start> - <end>" to describe ranges.
         *
         *  @param str A string describing a range of addresses
         *  @return    A string describeing the range as start/masked
         */
        'parse_range' : function( str ) {
            var strs = str.split( '-' );
            if( strs.length >=2 ) {
                var masked = ns.ipv4.get_slash(
                    ns.ipv4.str2addr( strs[ 0 ] ),
                    ns.ipv4.str2addr( strs[ 1 ] )
                );
                return strs[ 0 ].trim() + '/' + masked;
            }
            throw new Error( 'Unknown IP range format specified.' );
        },


        /**
         *  Converts a dotted-decimal string to an IP address value.
         *
         *  @param str The address as a dotted-decimal string
         *  @return    The value of the IP address
         */
        'str2addr' : function( str ) {
            var octets = str.trim().split( '.' );
            var addr = 0;
            addr |= ( parseInt( octets[ 0 ] ) << 24 );
            addr |= ( parseInt( octets[ 1 ] ) << 16 );
            addr |= ( parseInt( octets[ 2 ] ) <<  8 );
            addr |= ( parseInt( octets[ 3 ] ) <<  0 );
            return addr;
        }


    };  //ipv4


    /**
     *  Base-2 Logarithm
     *
     *  @param value The value for which to compute the base-2 logarithm
     *  @return      The base-2 logarithm of the given value
     */
    ns.log2 = function( value ) {
        return Math.log( value ) / Math.log( 2 );
    };


    /*------------------------------------------------------------------------
    Private Properties
    ------------------------------------------------------------------------*/

    /*------------------------------------------------------------------------
    Private Methods
    ------------------------------------------------------------------------*/


    return ns;
} )( hz.math || {} );
