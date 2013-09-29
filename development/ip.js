
var ip = {

    getSlash : function( start_addr, end_addr ) {
        var num_addrs = ( end_addr + 1 ) - start_addr;
        return 32 - ( ip.log2( num_addrs ) | 0 );
    },

    log2 : function( value ) {
        return Math.log( value ) / Math.log( 2 );
    },

    addr2str : function( addr ) {
        var octets = [];
        octets[ 0 ] = ( addr >> 24 ) & 0xFF;
        octets[ 1 ] = ( addr >> 16 ) & 0xFF;
        octets[ 2 ] = ( addr >>  8 ) & 0xFF;
        octets[ 3 ] = ( addr >>  0 ) & 0xFF;
        return octets.join( '.' );
    },

    str2addr : function( str ) {
        var octets = str.split( '.' );
        var addr = 0;
        addr |= ( parseInt( octets[ 0 ] ) << 24 );
        addr |= ( parseInt( octets[ 1 ] ) << 16 );
        addr |= ( parseInt( octets[ 2 ] ) <<  8 );
        addr |= ( parseInt( octets[ 3 ] ) <<  0 );
        return addr;
    },

};
