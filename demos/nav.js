
function main( argv ) {

    var parent = hz.util.append();

    hz.nav.setup(
        function() {
            console.log(
                'Navigating to: '
                + Array.prototype.slice.call( arguments, 0 ).join( ',' )
            );
        }
    );

    hz.ui.add.button(
        parent,
        'Action',
        function( event ) {
            //action without history
            hz.nav.action( 'action:arg1:arg2' );
        }
    );

    hz.ui.add.button(
        parent,
        'Location',
        function( event ) {
            window.location = '#location:arg1:arg2';
        }
    );

    hz.ui.add.button(
        parent,
        'pushState',
        function( event ) {
            window.history.pushState(
                window.location.hash,
                document.title,
                '#pushstate:arg1:arg2'
            );
        }
    );

    var a = document.createElement( 'a' );
    a.setAttribute( 'href', '#anchor:arg1:arg2' );
    a.appendChild( document.createTextNode( 'Anchor' ) );
    hz.util.append( parent, a );

}
