
function main( argv ) {

    var div   = document.body.append( '<div>' );
    var txt   = div.append( '<textarea>' );
    txt.rows  = 10;
    txt.cols  = 60;
    txt.value = '[div,['
              + '[h1,"Heading",{id:"test"}],'
              + '[p,{class:"example"},"para 1"],'
              + '[p,"para 2"]'
              + ']]';
    div = document.body.append( '<div>' );
    var btn     = div.append( '<input>' );
    btn.type    = 'button';
    btn.value   = 'Render';
    btn.onclick = function( event ) {
        var fragment = hz.doc.build( txt.value );
        target.appendChild( fragment );
        var heading = fragment.test;
        console.log( 'Auto-ID\'d element: ' + heading.firstChild.nodeValue );
        console.log( 'textAccess(): ' + fragment.textAccess() );
        console.log( 'textAccess(0): ' + fragment.textAccess( 0 ) );
        console.log( 'textAccess(1): ' + fragment.textAccess( 1 ) );
        console.log( 'textAccess(2): ' + fragment.textAccess( 2 ) );
        fragment.textAccess( 2, 'Paragraph Number Two' );
    };

    btn         = div.append( '<input>' );
    btn.type    = 'button';
    btn.value   = 'DOM Test';
    btn.onclick = function( event ) {
        var domtest = document.createElement( 'p' );
        domtest.appendChild( document.createTextNode( 'bar' ) );
        var fragwithdom = hz.doc.build( [ 'div', [ ['p','foo'], domtest ] ] );
        target.appendChild( fragwithdom );
    };

    btn = div.append( '<input>' );
    btn.type    = 'button';
    btn.value   = 'Clear';
    btn.onclick = function( event ) {
        target.removeChildren();
    };

    var target = document.body.append( '<div>' );
    target.id  = 'target';
    target.style.border = 'dashed 1px green';

}

