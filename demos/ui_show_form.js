
function main( argv ) {
    var p = hz.util.append();

    var button = hz.ui.create.button(
        'Show Form',
        function( event ) {
            hz.ui.show_form(
                'Test Form',
                {
                    'Name'  : {},
                    'age'   : { 'label' : 'Age' },
                    'Color' : { 'help' : 'Enter your favorite color.' },
                    'Notes' : { 'type' : 'edit' },
                    'Shhhh' : { 'type' : 'hidden', 'value' : 42 }
                },
                function( event ) {
                    var form = event.target;
                    var data = form.getData();
                    console.log( JSON.stringify( data ) );
                    if( data.Name.length == 0 ) {
                        hz.ui.error(
                            'You must specify a name.',
                            function( click ) {
                                form.elements.Name.focus();
                            }
                        );
                        return false;
                    }
                    return true;
                },
                'To fill this form out, you must blah blah...',
                'Submit Me!'
            );
        }
    );

    p.appendChild( button );

}
