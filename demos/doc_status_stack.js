
function main( argv ) {

    hz.util.set_default_transition();

    var parent = hz.util.append();

    var ss = new hz.doc.status_stack( parent );

    parent = hz.util.append();

    hz.ui.add.button(
        parent,
        'Test Message',
        function( event ) {
            ss.message( 'Testing status stack...' );
        }
    );

}
