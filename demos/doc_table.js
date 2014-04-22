
function main( argv ) {

    p = hz.util.append();

    var table = hz.doc.create_table(
        [
            [ 'val 00', 'val 01', 'val 02' ],
            [ 'val 10', 'val 11', 'val 12' ],
            [ 'val 20', 'val 21', 'val 22' ]
        ],
        [ 'col 0', 'col 1', 'col 2' ]
    );

    hz.util.append( p, table );

    var table_empty = hz.doc.create_table();

    hz.util.append( p, table_empty );

    table_empty.appendDataRow( [ 'this', 'is', 'a', 'test' ] );
    table_empty.appendDataRow( [ 'this', 'is', 'another', 'test' ] );
    table_empty.appendDataRow( [ 'this', 'is', 'test' ] );
    table_empty.appendDataRow( [ 'this', 'is', 'a', 'bad', 'test' ] );

}
