
function main( argv ) {

    var parent = document.body.append( '<div>' );

    var ds = new hz.doc.structure(
        'h1,p:a,a,a,a;p:img',
        [
            'Heading', 'Paragraph starts here',
            'anchor a', 'anchor b', 'anchor c', 'anchor d'
        ]
    );

    parent.append( ds.get_element() );

    var obj = {}
    ds.bind_object(
        obj, [ 'h', 'p0', 'a0', 'a1', 'a2', 'a3', 'p1', 'im' ]
    );
    obj.a0.href = 'doc1.html';
    obj.a1.href = '/doc2.html';
    obj.a2.href = 'http://example.com/doc3.html';
    obj.im.src  = '../../hzphp/tools/icon.php?id=check_fill';

    var p0 = document.body.append( '<div>' );

    //testing HTMLElement.getURLNodes() method
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
    var ds1 = new hz.doc.structure( 'span,_text_,input', [ 'a', 'b', 'c' ] );
    button = hz.ui.create.button(
        'textValue uniform accessor',
        function( event ) {
            console.log( 'span:   ' + ds1.get_node( 0 ).textValue );
            console.log( '_text_: ' + ds1.get_node( 1 ).textValue );
            console.log( 'input:  ' + ds1.get_node( 2 ).textValue );
            ds1.get_node( 0 ).textValue = 'd';
            ds1.get_node( 1 ).textValue = 'e';
            ds1.get_node( 2 ).textValue = 'f';
        }
    );
    p1.append( button );
    p1.append( ds1.get_element() );

    //testing Element.bindElements()
    var p2 = document.body.append( '<div>' );
    var ds2 = new hz.doc.structure( 'span,_text_,span', [ 'a', 'b', 'c' ] );
    ds2.get_node( 0 ).id = 'id_a';
    ds2.get_node( 1 ).id = 'id.b';
    ds2.get_node( 2 ).id = 'id-c';
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
    p2.append( ds2.get_element() );

}
