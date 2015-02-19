
function main( argv ) {

    var parent = document.body.append( '<div>' );

    parent.append( hz.doc.build(
        [ 'div', [
            [ 'h1', 'Heading' ],
            [ 'p', 'Paragraph starts here', [
                [ 'a', 'anchor a', { 'href' : 'doc1.html' } ],
                [ 'a', 'anchor b', { 'href' : '/doc2.html' } ],
                [ 'a', 'anchor c', { 'href' : 'http://eg.com/doc3.html' } ],
                [ 'a', 'anchor d' ]
            ] ],
            [ 'p', [
                [ 'img', { 'src' : '../../hzphp/tools/icon.php?id=check_fill' } ]
            ] ]
        ] ]
    ) );

    //testing HTMLElement.getURLNodes() method
    var p0 = document.body.append( '<div>' );
    var button = hz.ui.create.button(
        'HTMLElement.getURLNodes()',
        function( event ) {
            var nodes = parent.getURLNodes();
            var n;
            for( var i = 0; i < nodes.length; ++i ) {
                n = nodes[ i ];
                console.log( i + ': ' + n.tagName + '.'
                    + n.urlAttribute + ' = ' + nodes[ i ].url );
            }
        }
    );
    p0.append( button );

    //testing textValue accessor property
    var p1 = document.body.append( '<div>' );
    var ds1 = hz.doc.build(
        [ 'div', [
            [ 'span', 'a' ],
            'b',
            [ 'input', { 'value' : 'c' } ]
        ] ]
    );
    button = hz.ui.create.button(
        'textValue uniform accessor',
        function( event ) {
            console.log( 'span:     ' + ds1.childNodes[ 0 ].textValue );
            console.log( 'textNode: ' + ds1.childNodes[ 1 ].textValue );
            console.log( 'input:    ' + ds1.childNodes[ 2 ].textValue );
            ds1.childNodes[ 0 ].textValue = 'd';
            ds1.childNodes[ 1 ].textValue = 'e';
            ds1.childNodes[ 2 ].textValue = 'f';
        }
    );
    p1.append( button );
    p1.append( ds1 );

    //testing Element.bindElements()
    var p2 = document.body.append( '<div>' );
    var ds2 = hz.doc.build(
        [ 'div', [
            [ 'span', 'a', { 'id' : 'id_a' } ],
            'b',
            [ 'span', 'c', { 'id' : 'id-c' } ]
        ] ]
    );
    button = hz.ui.create.button(
        'Element.bindElements()',
        function( event ) {
            p2.bindElements();
            for( var prop in p2 ) {
                if( prop.substring( 0, 2 ) == 'id' ) {
                    console.log( prop + ': ' + p2[ prop ].nodeType );
                }
            }
        }
    );
    p2.append( button );
    p2.append( ds2 );

}
