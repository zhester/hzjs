
function main( argv ) {

    var parent = hz.util.append();

    var ds = new hz.doc.structure(
        'h1,p:_text_,a,_text_,a,a',
        [
            'Heading', 'Paragraph starts here',
            ' text ', 'anchor a', ' text ', 'anchor b', 'anchor c'
        ]
    );
    hz.util.append( parent, ds );
    var obj = {}
    ds.bind_object( obj, [ 'h', 'p', 't0', 'a0', 't1', 'a1', 'a2' ] );
    obj.a0.href = 'doc1.html';
    obj.a1.href = '/doc2.html';
    obj.a2.href = 'http://example.com/doc3.html';

    var button = hz.ui.create.button(
        'Fix Links',
        function( event ) {
            hz.doc.pf_rel_url( parent, 'PREFIX|' );
        }
    );
    hz.util.append( null, button );

}
