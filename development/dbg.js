/**
 *  dbg
 *  Debug message printer.  Drop-in debug console.
 *
 *  @param message Message to display in console
 */
function dbg( message ) {
    var ul = document.getElementById( 'message' );
    if( ul == null ) {
        ul = document.createElement( 'ul' );
        ul.id = 'message';
        ul.style.position = 'absolute';
        ul.style.right = '0';
        ul.style.bottom = '0';
        ul.style.maxHeight = '90%';
        ul.style.overflow = 'auto';
        ul.style.margin = '0';
        ul.style.padding = '2px 5px';
        ul.style.border = 'solid 1px #EEEEEE';
        ul.backgroundColor = '#FFFFFF';
        document.getElementsByTagName( 'body' )[ 0 ].appendChild( ul );
    }
    var li = document.createElement( 'li' );
    li.appendChild( document.createTextNode( message ) );
    ul.appendChild( li );
}