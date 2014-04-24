
function main( argv ) {

    p = hz.util.append();

    var c = hz.ui.create.gauge( 'Gauge Text', 0.6 );
    p.appendChild( c );

    c = hz.ui.create.pulse( 'Pulse Text' );
    p.appendChild( c );

    c = hz.ui.create.progress( 'Progress Text', 0.0, 1 );
    p.appendChild( c );
    var pcent = 0.0;
    window.setInterval(
        function( event ) {
            pcent = pcent > 1.0 ? 0.0 : pcent + 0.05;
            c.hz.set_value( pcent );
        },
        1000
    );

}
