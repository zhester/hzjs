
function reset() {
    hz.conf.reset();
}
function show() {
    if( hz.conf.is_valid() == true ) {
        hz.ui.view( JSON.stringify( hz.conf.get_object() ) );
    }
    else {
        hz.ui.view( 'Configuration is invalid!' );
    }
}
function setup() {
    var conf_items = {
        'name' : null, 'color' : 'green', 'font' : 'Source Sans Pro'
    };
    var required_items = [ 'name' ];
    hz.conf.init( conf_items, required_items );
    if( hz.conf.is_specified( 'name' ) == false ) {
        hz.ui.prompt(
            'Please specify a name.',
            function( value ) {
                if( value == false ) {
                    hz.ui.error( 'Sorry, I need a specified name.' );
                }
                else {
                    hz.conf.set( 'name', value );
                }
                show();
            },
            'First-time Setup'
        );
    }
}

function main( argv ) {

    var parent = hz.util.append();
    hz.ui.add.button( parent, 'Setup', setup );
    hz.ui.add.button( parent, 'Reset', reset );
    hz.ui.add.button( parent, 'Show',  show  );

}
