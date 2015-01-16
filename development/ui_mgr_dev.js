
var mgr = null;

function create_frame( event ) {
    alert( 'create_frame' );
}

function reset_all( event ) {
}


function ready_main() {

    //initialize manager
    var container = document.createElement( 'div' );
    container.setAttribute(
        'style',
        'border:solid 1px green;width:640px;height:480px;'
    );
    document.body.appendChild( container );
    mgr = new hz.ui_mgr.ui_mgr( container );


    var controls = hz.doc.build(
        [
            'div',
            [
                [
                    'input',
                    {
                        'type' : 'button',
                        'value' : 'Create Frame',
                        'onclick' : create_frame
                    }
                ],
                [
                    'input',
                    {
                        'type' : 'button',
                        'value' : 'Reset All',
                        'onclick' : reset_all
                    }
                ]
            ]
        ]
    );

    document.body.appendChild( controls );
}


function main( argv ) {
    include( [ '../lib/doc.js', 'ui_mgr.js' ], ready_main );
}

