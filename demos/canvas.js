
function test_style_registry( canvas ) {
    var reg = new hz.canvas.StyleRegistry();

    var styles = {
        'a' : {
            'fillStyle'   : 'orange',
            'strokeStyle' : 'black',
            'lineWidth'   : 4,
            'lineCap'     : 'round', //butt,round,square
            'lineJoin'    : 'round'  //round,bevel,miter
        },
        'b' : {
            'fillStyle'   : 'yellow',
            'strokeStyle' : 'blue',
            'lineWidth'   : 6,
            'lineCap'     : 'butt',
            'lineJoin'    : 'miter',
            'miterLimit'  : 4
        },
        'c' : {
            'fillStyle'      : 'gray',
            'strokeStyle'    : 'purple',
            'lineWidth'      : 5,
            'setLineDash'    : [ 4, 1 ], //on,off
            'lineDashOffset' : 0
        },
        'e' : {
            'fillStyle' : 'red'
        },
        'f' : {
            'lineWidth'   : 3,
            'strokeStyle' : 'green'
        }
    };

    reg.load_styles( styles );

    var ctx = canvas.getContext( '2d' );

    reg.begin_style( ctx, 'a' );
    ctx.fillRect( 10, 10, 50, 50 );
    ctx.strokeRect( 10, 10, 50, 50 );
    reg.end_style();

    reg.begin_style( ctx, 'b' );
    ctx.fillRect( 70, 10, 50, 50 );
    ctx.strokeRect( 70, 10, 50, 50 );
    reg.end_style();

    reg.begin_style( ctx, 'c' );
    ctx.fillRect( 130, 10, 50, 50 );
    ctx.strokeRect( 130, 10, 50, 50 );
    reg.end_style();

    var stylable = { 'style_auto' : 'e f' };
    reg.begin_style_auto( ctx, stylable );
    ctx.fillRect( 190, 10, 50, 50 );
    ctx.strokeRect( 190, 10, 50, 50 );
    reg.end_style();

    var grad0 = ctx.createLinearGradient( 10, 70, 60, 130 );
    grad0.addColorStop( 0.0, 'orange' );
    grad0.addColorStop( 1.0, 'black' );
    var grad1 = ctx.createLinearGradient( 10, 70, 60, 130 );
    grad1.addColorStop( 0.0, 'black' );
    grad1.addColorStop( 1.0, 'orange' );
    reg.set(
        'g', { 'fillStyle' : grad0, 'strokeStyle' : grad1, 'lineWidth' : 4 }
    );
    reg.begin_style( ctx, 'g' );
    ctx.fillRect( 10, 70, 50, 50 );
    ctx.strokeRect( 10, 70, 50, 50 );
    reg.end_style();
}


function main( argv ) {
    var canvas = hz.doc.build(
        [ 'canvas', { 'width' : '480', 'height' : '320' } ]
    );
    document.body.appendChild( canvas );
    test_style_registry( canvas );
}

