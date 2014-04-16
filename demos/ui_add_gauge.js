
function main( argv ) {

    p = hz.util.append();

    hz.ui.add.gauge( p, 'Gauge Text', 0.6 );

    hz.ui.add.pulse( p, 'Pulse Text' );

    var pnode = hz.ui.add.progress( p, 'Progress Text', 0.0, 1 );
    var pcent = 0.0;
    window.setInterval(
        function( event ) {
            pcent = pcent > 1.0 ? 0.0 : pcent + 0.05;
            pnode.hz.set_value( pcent );
        },
        1000
    );

}
