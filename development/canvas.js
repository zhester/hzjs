/*----------------------------------------------------------------------------
Experimenting with the HTML5 canvas.
----------------------------------------------------------------------------*/

//map a limited set of SVG path commands to canvas context methods.
var cmds = {
    'm' : 'moveTo',
    'M' : 'moveTo',
    'l' : 'lineTo',
    'L' : 'lineTo'
};

//an example class for managing the canvas
function Example( context ) {

    this.ctx = context;

    this.area = {
        'x' : 0,
        'y' : 0,
        'w' : context.canvas.width,
        'h' : context.canvas.height
    };

    //ZIH - use this once per canvas setup to "unblur" half pixel aliasing
    this.ctx.translate( 0.5, 0.5 );

    this.bg_fill = context.createLinearGradient( 0, 0, 0, this.area.h );
    this.bg_fill.addColorStop( 0.0, '#222222' );
    this.bg_fill.addColorStop( 1.0, '#222230' );

    this.redraw();
}

//draws objects that have a "d" property with an SVG-like path string/array
Example.prototype.draw_object = function( object ) {
    if( 'd' in object ) {
        var shape;
        if( object.d instanceof Array ) {
            shape = object.d;
        }
        else {
            shape = object.d.split( ' ' );
        }
        var num_toks = shape.length;
        var chr, cmd, curr, state = [ 0, 0 ];
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.beginPath();
        for( var i = 0; i < num_toks; i += 3 ) {
            chr = shape[ i ];
            cmd = cmds[ chr ];
            curr = shape.slice( i + 1, i + 3 ).map( parseFloat );
            if( chr == chr.toLowerCase() ) {
                curr[ 0 ] += state[ 0 ];
                curr[ 1 ] += state[ 1 ];
                state = curr;
            }
            this.ctx[ cmd ]( curr[ 0 ], curr[ 1 ] );
            //console.log( cmd + ':' + curr[ 0 ] + ',' + curr[ 1 ] );
        }
        this.ctx.stroke();
    }
};

//initiates a redraw of the canvas
Example.prototype.redraw = function() {

    this.ctx.fillStyle = this.bg_fill;
    this.ctx.fillRect( 0, 0, this.area.w, this.area.h );

    this.draw_object(
        { 'd' : 'm 5 5 l 20 0 l 0 15 l -20 0 l 0 -15' }
    );

    this.draw_object(
        { 'd' : 'M 55 55 L 75 55 L 75 70 L 55 70 L 55 55' }
    );

};


function main( argv ) {
    include(
        [ '../lib/html.js', '../lib/doc.js' ],
        function() {
            var width = 320;
            var height = 240;
            var canvas = hz.doc.build(
                [ 'canvas', { 'width' : width, 'height' : height } ]
            );
            document.body.append( canvas );
            var eg = new Example( canvas.getContext( '2d' ) );
        }
    );
}

