
function main( argv ) {

    var chart = new hz.plot.Chart( 640, 480 );
    document.body.appendChild( chart.get_element() );

    var s0 = [ 6, 7, 3, 4, 9, 5, 1, 0, 1, 5, 3, 4 ];
    var s1 = [ 9, 1, 1, 4, 8, 8, 2, 2, 3, 4, 1, 9 ];

    var srs0t = chart.create_series( s0 );
    var srs0m = chart.create_series( s0 );
    srs0m.plot = 'smooth';

    var n = 12;
    var r = [];
    for( var i = 0; i < n; ++i ) {
        r.push( Math.round( Math.random() * 9 ) );
    }
    var srsrt = chart.create_series( r );
    var srsrm = chart.create_series( r );
    srsrm.plot = 'smooth';

    //var three = chart.create_series( [ 0, 2, 1 ] );
    //three.plot = 'smooth';
    //var four = chart.create_series( [ 0, 3, 1, 2 ] );
    //four.plot = 'smooth';

    var s60 = [];
    for( var i = 0; i < 60; ++i ) {
        s60.push( Math.sin( i / ( 2 * Math.PI ) ) * 60 );
    }
    var srs60 = chart.create_series( s60 );
    srs60.plot = 'points';

    chart.render();

}

