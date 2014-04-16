
function main( argv ) {

    p = hz.util.append();

    hz.ui.add.entry(
        p,
        '',
        function( event ) { console.log( event.target.value ); }
    );

    p = hz.util.append();

    hz.ui.add.select(
        p,
        [ 'Option 1', 'Option 2', 'Option 3' ],
        function( event ) {
            var s = event.target;
            console.log( s.options[ s.selectedIndex ].value );
        }
    );

    p = hz.util.append();

    hz.ui.add.edit(
        p,
        '',
        function( event ) { console.log( event.target.value ); }
    );

}
