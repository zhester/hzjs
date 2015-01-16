
function main( argv ) {

    hz.util.set_default_transition();

    var p = hz.util.append();

    hz.ui.add.button(
        p,
        'Alert!',
        function( event ) {
            hz.ui.alert( 'Alert message.', null, 'Alert Title' );
        }
    );

    hz.ui.add.button(
        p,
        'Error!',
        function( event ) {
            hz.ui.error( 'Error message!', null, 'Error Title' );
        }
    );

    hz.ui.add.button(
        p,
        'Confirm!',
        function( event ) {
            hz.ui.confirm(
                'Confirm question?',
                function( answer ) { console.log( answer ); },
                'Confirm Title'
            );
        }
    );

    hz.ui.add.button(
        p,
        'Prompt!',
        function( event ) {
            hz.ui.prompt(
                'Prompt question?',
                function( answer ) { console.log( answer ); },
                'Prompt Title',
                'Prompt Default'
            );
        }
    );

}
