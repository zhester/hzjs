/*****************************************************************************
    uhttp

    Micro-sized, asynchronous HTTP client.  This deals with the XMLHttpRequest
    interface, and turns it into a simpler callback function interface.

    Example Usage

        var context = some_object;
        var client = new uhttp(
            (
                function( txt ) {
                    context.show_message( txt );
                }
            ),
            (
                function( txt ) {
                    context.show_error( 'Error: ' + txt );
                }
            ),
            (
                function() {
                    context.show_error( 'Request timed out.' );
                }
            )
        );
        clint.request(
            'GET',
            'remote.php?q=' + encodeURIComponent( 'some query' )
        );

*****************************************************************************/

function uhttp( cbok, cberror, cbtimeout ) {
    this.cbok      = cbok;
    this.cberror   = cberror;
    this.cbtimeout = cbtimeout;
    this.client    = new XMLHttpRequest();
    this.timer     = null;
}

uhttp.prototype.request = function( type, uri ) {
    if( this.timer != null ) { return -1; }
    var context = this;
    this.client.onreadystatechange = ( function() {
        if( context.client.readyState == 4 ) {
            window.clearTimeout( context.timer );
            context.timer = null;
            if( this.status == 200 ) {
                if( this.getResponseHeader( 'Content-Type' ) == 'text/xml' ) {
                    context.cbok( this.responseXML );
                }
                else {
                    context.cbok( this.responseText );
                }
            }
            else {
                context.cberror( this.status );
            }
        }
    } );
    if( type == 'POST' ) {
        var query = arguments[ 2 ] ? arguments[ 2 ] : '';
        var ct = query.charAt( 0 ) == '{'
            ? 'application/json' : (
                query.substring( 0, 4 ) == '<xml'
                ? 'text/xml; charset=utf8'
                : 'application/x-www-form-urlencoded'
            );
        this.client.open( type, uri, true );
        this.client.setRequestHeader( 'Content-Type', ct );
        this.client.setRequestHeader( 'Content-Length', query.length );
        this.client.setRequestHeader( 'Connection', 'close' );
        this.client.send( query );
    }
    else {
        this.client.open( 'GET', uri, true );
        this.client.send( null );
    }
    this.timer = window.setTimeout(
        ( function( e ) {
            window.clearTimeout( context.timer );
            context.timer = null;
            context.onreadystatechange = null;
            context.client.abort();
            context.cbtimeout();
        } ),
        30000
    );
};
