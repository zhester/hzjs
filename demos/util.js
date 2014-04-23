
function main( argv ) {

    console.log( hz.util.slug( 'Hello World' ) );
    console.log( hz.util.slug( ' !12Hello    Wor  ld_-_-  -- ' ) );

    var extr = { 'a' : 1, 'b' : 2, 'c' : 3 };
    var intr = { 'd' : 4, 'e' : 5, 'f' : 6 };
    hz.util.oprx( extr, intr, [ 'e', 'f' ] );
    console.log( 'getting extr[d]: ' + extr[ 'd' ] );
    console.log( 'getting extr[e]: ' + extr.e );
    console.log( 'getting intr[f]: ' + intr.f );
    extr.f = 7;
    console.log( 'setting extr[f]: ' + extr.f );
    console.log( 'getting intr[f]: ' + intr.f );
    console.log( JSON.stringify( extr ) );
}
