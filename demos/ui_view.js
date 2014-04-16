
function main( argv ) {

    p = hz.util.append();

    hz.ui.add.button(
        p,
        'View HTML Example',
        function( event ) { hz.ui.view_url( 'testdoc.html' ); }
    );

    hz.ui.add.button(
        p,
        'View Text Example',
        function( event ) {
            hz.ui.view_url( 'testtext.txt', false, true, 'Some Text File' );
        }
    );

}
