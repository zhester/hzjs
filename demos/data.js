
function modify_record( r ) {
    var ncol = this.indexes[ 'name' ];
    r[ ncol ] = 'Mr. ' + r[ ncol ];
    return true;
}

function main( argv ) {

    var parent = hz.util.append();

    var entry = hz.ui.add.entry( parent, 'testdata.json' );

    hz.ui.add.button(
        parent,
        'Fetch',
        function( event ) {
            var p = hz.util.append();
            hz.data.append_report_uri( p, entry.value, modify_record );
        }
    );

    hz.ui.add.button(
        parent,
        'Tree',
        function( event ) {
            hz.data.fetch_object(
                entry.value,
                function( data ) {
                    var p = hz.util.append();
                    hz.data.append_tree( p, data );
                }
            )
        }
    );

}
