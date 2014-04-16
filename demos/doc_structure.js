
function main( argv ) {

    p = hz.util.append();

    var ds = new hz.doc.structure(
        'h1,p,p:strong,null;div:div:div;;;',
        [ 'hdg', 'p1', 'before ', 'bold', ' after' ]
    );

    hz.util.append( p, ds );

    var counter = 0;
    window.setInterval(
        function( event ) {
            //ds.set_text( 3, counter );
            ds.set_text( 3, hz.util.rand_id() );
            counter += 1;
        },
        100
    );

}
