
//demo the hz.lang.interval() utility method
function demo_interval() {

    var report = hz.doc.build(
        [ 'table', [
            [ 'tbody', [
                [ 'tr', [
                    [ 'th', "seconds"  ],
                    [ 'th', "interval" ],
                    [ 'th', "verbose"  ]
                ] ]
            ] ]
        ] ]
    );

    var demos = [ 0, 1, 59, 60, 61, 3599, 3600, 3601, 87654, 408899837, -42 ];
    var ms;

    for( var i = 0; i < demos.length; ++i ) {
        ms = demos[ i ] * 1000;
        report.appendDataRow(
            [
                demos[ i ],
                hz.lang.interval( ms ),
                hz.lang.interval( ms, true )
            ]
        );
    }

    var sheet = hz.util.create_style_sheet();
    sheet.append( {
        'table' : {
            'border-collapse' : 'collapse'
        },
        'th, td' : {
            'padding' : '4px',
            'border' : 'solid 1px #CCCCCC'
        }
    } );

    document.body.append( hz.doc.build( [ 'h1', 'hz.lang.interval()' ] ) );
    document.body.append( report );
}

//run hz.lang demos
function main( argv ) {
    demo_interval();
}

