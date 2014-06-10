/*
Goal: Make a new type of HTMLInputElement that can be correctly added to an
HTMLFormElement (still appears in the elements[] collection), and can be
composed of multiple internal inputs.  The end result should be an input
that appears to be one input to the form, but the user is presented with any
number of inputs for interaction.

To support:
    value
    blur()
    click()
    focus()
    select()

Plan:
    Use 'fieldset' container for composite fields.  When our form's "getData"
    gets called, it can then check for fieldset elements, and use its
    extended "value" property (set up as a getter method) that will resolve
    the internal contents of the inputs into a unified value.
    The trick will then be to specify which form elements belong to the
    fieldset so the getData method doesn't traverse those elements.

Issues:
  - breaks users who prefer to access .elements[] directly

Other ideas:
  - create a pseudo-iterable .inputs[] collection (just a plain object) that
    can be used as a proxy for accessing our modified list of elements
      - should be accessed "live" each time to get the list of inputs

If the solution is largely internal notation, and only works with library
methods that are aware of the modified collection, it doesn't really matter
how we organize the internal inputs.
    HzForm.getData()
    HzForm.checkData()
    HzFormInput.checkInput()

Not sure how this could help, but input.type="image" prevents the input from
appearing in the .elements[] collection.

I might just have to "encode" special input names to indicate that they belong
to a container fieldset with a reversable name:
    fieldset.name = "field"
        input.name = "__field_0"
        input.name = "__field__innername"
*/



var form;

window.addEventListener(
    'load',
    function( event ) {

        form = document.createElement( 'form' );
        document.body.appendChild( form );

        console.log( form.elements.length );

        var input = document.createElement( 'input' );
        form.appendChild( input );

        console.log( form.elements.length );

        var fset = document.createElement( 'fieldset' );
        form.appendChild( fset );

        //this gets counted as an element --> 2
        console.log( form.elements.length );

        input = document.createElement( 'input' );
        input.value = 'value 1';
        fset.appendChild( input );
        input = document.createElement( 'input' );
        input.value = 'value 2';
        fset.appendChild( input );
        Object.defineProperty(
            //HTMLFieldSetElement.prototype, //works!
            fset,
            'value',
            {
                'enumerable' : true,
                'get' : function() {
                    return this.elements[ 0 ].value
                        + '|' + this.elements[ 1 ].value;
                },
                'set' : function( value ) {
                    var parts = value.split( '|' );
                    this.elements[ 0 ].value = parts[ 0 ];
                    this.elements[ 1 ].value = parts[ 1 ];
                }
            }
        );

        input = document.createElement( 'input' );
        input.type = 'button';
        input.value = 'Report';
        input.onclick = function( event ) {
            console.log( fset.value );
        };
        fset.appendChild( input );

        input = document.createElement( 'input' );
        input.type = 'button';
        input.value = 'Change';
        input.onclick = function( event ) {
            fset.value = 'test 1|test 2';
        };
        fset.appendChild( input );


        //these are also counted as elements in the parent form --> 4
        console.log( form.elements.length );

        //this tracks just the elements in the fieldset --> 2
        console.log( fset.elements.length );

        //filtering "sub" inputs with DOM "same node" comparison:
        //console.log( form.elements[ 1 ] === fset ); //true
        //console.log( form.elements[ 2 ] === fset.elements[ 0 ] ); //true
        //console.log( form.elements[ 2 ] === fset.elements[ 1 ] ); //false

        input = document.createElement( 'input' );
        input.name = '__test__test';
        form.appendChild( input );
        console.log( form.elements.length );


        fset.focus();
    }
);

