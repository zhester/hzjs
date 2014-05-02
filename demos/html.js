
function main( argv ) {

    var parent = hz.util.append();

    var ds = new hz.doc.structure(
        'h1,p:a,a,a,a;p:img',
        [
            'Heading', 'Paragraph starts here',
            'anchor a', 'anchor b', 'anchor c', 'anchor d'
        ]
    );

    hz.util.append( parent, ds );

    var obj = {}
    ds.bind_object(
        obj, [ 'h', 'p0', 'a0', 'a1', 'a2', 'a3', 'p1', 'im' ]
    );
    obj.a0.href = 'doc1.html';
    obj.a1.href = '/doc2.html';
    obj.a2.href = 'http://example.com/doc3.html';
    obj.im.src  = '../../hzphp/tools/icon.php?id=check_fill';

    var button = hz.ui.create.button(
        'Iterate URLers',
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
    hz.util.append( null, button );

    button = hz.ui.create.button(
        'Prefix Relative URLs',
        function( event ) {
            var nodes = parent.getURLNodes();
            var n;
            for( var i = 0; i < nodes.length; ++i ) {
                n = nodes[ i ];
//ZIH
                console.log( 'IMPLEMENT ME' );
            }
        }
    );
    hz.util.append( null, button );

}
