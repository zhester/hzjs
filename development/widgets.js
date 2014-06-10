
ui = {};

ui.widget_types = {
    'color' : [ 'ColorWidget', [ 'parseFloat', 'parseFloat', 'parseFloat' ] ]
};

ui.makeWidgets = function( element ) {
    element = element || document.getElementsByTagName( 'body' ).item( 0 );
    var inputs = element.getElementsByTagName( 'input' );
    var num_inputs = inputs.length;
    var args, cls, pnode, type, widget, wspec;
    for( var i = 0; i < num_inputs; ++i ) {
        if( inputs[ i ].hasAttribute( 'data-type' ) ) {
            type = inputs[ i ].getAttribute( 'data-type' );
            if( type in ui.widget_types ) {
                wspec = ui.widget_types[ type ];
                cls = window[ wspec[ 0 ] ];
                args = [];
                if( inputs[ i ].hasAttribute( 'data-args' ) ) {
                    args = inputs[ i ].getAttribute( 'data-args' ).split( ',' );
                    for( var j = 0; j < args.length; ++j ) {
                        args[ j ] = window[ wspec[ 1 ][ j ] ]( args[ j ] );
                    }
                    widget = new ( cls.bind.apply( cls, args ) )();
                }
                else {
                    widget = new cls( inputs[ i ].value );
                }
                pnode = inputs[ i ].parentNode;
                pnode.replaceChild( widget.element, inputs[ i ] );
            }
        }
    }
};
