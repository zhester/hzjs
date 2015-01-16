
function main( argv ) {

    p = hz.util.append();

    hz.ui.add.check(
        p,
        [ 'Option One', 'Option 2', 'Option 3' ],
        function( event ) {
            console.log( event.target.value, event.target.checked );
        }
    );

    hz.ui.add.check(
        p,
        [ 'Option 1', 'Option 2', 'Option Three' ],
        function( event ) {
            console.log( event.target.value, event.target.checked );
        },
        1,
        2
    );

}
