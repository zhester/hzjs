
function handle_submit( event ) {
    console.log( JSON.stringify( event.target.getData() ) );
}

function main( argv ) {

    p = hz.util.append();

    var form = hz.form.create_form( handle_submit );
    form.setHiddenInput( 'hkey', 'hval' );
    form.appendChild( hz.form.create_field( 'Name' ) );
    form.appendChild( hz.form.create_field( 'Address' ) );
    form.appendChild( hz.form.create_field( 'Favorite Color' ) );
    var btn = hz.ui.add.button(
        form,
        'Submit Button'
    );
    btn.type = 'submit';
    p.appendChild( form );

    p = hz.util.append();
    hz.ui.add.button(
        p,
        'Call Submit',
        function( event ) {
            form.submit();
        }
    );

    var form_building = hz.form.create_form( handle_submit );
    form_building.build(
        {
            'Fruit' : { 'value' : 'banana' },
            'Vegetable' : {},
            'Meat' : {
                'type' : 'select',
                'args' : [ [ 'Beef', 'Pork', 'Insect' ] ]
            }
        },
        'Submit Label'
    );
    hz.util.append( null, form_building );
    form_building.autoFocus();

}
