
function main( argv ) {
    p = hz.util.append();

    hz.ui.add.button(
        p,
        'Show Form',
        function( event ) {
            hz.ui.show_form(
                'Test Form',
                {
                    'Name'  : {},
                    'age'   : { 'label' : 'Age' },
                    'Color' : { 'help' : 'Enter your favorite color.' },
                    'Notes' : { 'type' : 'edit' }
                },
                function( data ) {
                    console.log( JSON.stringify( data ) );
                    //return true to close the form, false to keep it
                    return true;
                },
                'To fill this form out, you must blah blah...'
            );
        }
    );

}
