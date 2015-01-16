
function main( argv ) {

    //testing string slugification
    console.log( hz.util.slug( 'Hello World' ) );
    console.log( hz.util.slug( ' !12Hello    Wor  ld_-_-  -- ' ) );

    //testing object property proxies
    var extr = { 'a' : 1, 'b' : 2, 'c' : 3 };
    var intr = { 'd' : 4, 'e' : 5, 'f' : 6 };
    //proxy the 'e' and 'f' properties on intr via extr
    hz.util.oprx( extr, intr, [ 'e', 'f' ] );
    //the 'd' property is not proxied (should appear as undefined)
    console.log( 'getting extr[d]: ' + extr[ 'd' ] );
    //the 'e' and 'f' properties are really stored in intr
    console.log( 'getting extr[e]: ' + extr.e );
    console.log( 'getting intr[f]: ' + intr.f );
    //modifying the 'f' property in extr REALLY modifies intr's copy
    extr.f = 7;
    console.log( 'setting extr[f]: ' + extr.f );
    console.log( 'getting intr[f]: ' + intr.f );
    console.log( JSON.stringify( extr ) );

    //testing object cloning
    // var jorus  = { 'a' : 1, 'b' : 2, 'c' : 3 };
    // var joruus = hz.util.clone( jorus );
}
