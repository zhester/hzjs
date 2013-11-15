/*****************************************************************************
    User Interface Color Interaction

*****************************************************************************/


function omap( target, source ) {
    for( var key in source ) {
        target[ key ] = source[ key ];
    }
};


function Color( r, g, b ) {
    this._r = r || 0.0;
    this._g = g || 0.0;
    this._b = b || 0.0;
    this._h = 0.0;
    this._s = 0.0;
    this._l = 0.0;
    this._update_hsl();
}
Color.prototype.getHex = function() {
    var r = Math.floor( this._r * 255.0 ).toString( 16 ).toUpperCase();
    var g = Math.floor( this._g * 255.0 ).toString( 16 ).toUpperCase();
    var b = Math.floor( this._b * 255.0 ).toString( 16 ).toUpperCase();
    r = ( '00' + r ).slice( -2 );
    g = ( '00' + g ).slice( -2 );
    b = ( '00' + b ).slice( -2 );
    return '#' + r + g + b;
};
Color.prototype.getHSL = function() {
    var chroma, l, h, h_prime, max, min, s;
    max = Math.max( this._r, this._g, this._b );
    min = Math.min( this._r, this._g, this._b );
    chroma = max - min;
    l = ( max + min ) / 2.0;
    if( chroma == 0.0 ) {
        h_prime = 0.0;
        s = 0.0;
    }
    else {
        switch( max ) {
            case this._r:
                h_prime = ( this._g - this._b ) / chroma;
                if( this._g < this._b ) { h_prime += 6.0; }
                break;
            case this._g:
                h_prime = ( ( this._b - this._r ) / chroma ) + 2.0;
                break;
            case this._b:
                h_prime = ( ( this._r - this._g ) / chroma ) + 4.0;
                break;
            default:
                h_prime = 0.0;
                break;
        }
        s = chroma / ( 1 - Math.abs( ( 2 * l ) - 1 ) );
    }
    h = h_prime * 60.0;
    return [ ( h / 359.999999 ), s, l ];
};
Color.prototype.getHSL2 = function() {
    var alpha, beta, chroma, l, max, min, h, s;
    alpha = ( ( 2 * this._r ) - this._g - this._b ) / 2.0;
    beta  = Math.pow( ( this._g - this._b ), ( 1.0 / 3.0 ) ) / 2.0;
    h = Math.atan2( beta, alpha );
    chroma = Math.sqrt( ( alpha * alpha ) + ( beta * beta ) );
    max = Math.max( this._r, this._g, this._b );
    min = Math.min( this._r, this._g, this._b );
    l = ( max + min ) / 2.0;
    s = chroma / ( 1 - Math.abs( ( 2 * l ) - 1 ) );
    return [ ( h / 359.999999 ), s, l ];
};
Color.prototype.getRGB = function() {
    var b, chroma, g, h_prime, m, r, x;
    chroma = ( 1 - Math.abs( ( 2 * this._l ) - 1 ) ) * this._s;
    h_prime = this._h * 359.999999 / 60.0;
    x = chroma * ( 1 - Math.abs( ( h_prime % 2 ) - 1 ) );
    m = this._l - ( chroma / 2.0 );
    if( m < 0.0 ) { m = 0.0; }
    if( ( h_prime < 0.0 ) || ( h_prime >= 6.0 ) ) {
        r = 0.0; g = 0.0; b = 0.0;
    }
    else if( h_prime < 1.0 ) {
        r = chroma; g = x; b = 0.0;
    }
    else if( h_prime < 2.0 ) {
        r = x; g = chroma; b = 0.0;
    }
    else if( h_prime < 3.0 ) {
        r = 0.0; g = chroma; b = x;
    }
    else if( h_prime < 4.0 ) {
        r = 0.0; g = x; b = chroma;
    }
    else if( h_prime < 5.0 ) {
        r = x; g = 0.0; b = chroma;
    }
    else if( h_prime < 6.0 ) {
        r = chroma; g = 0.0; b = x;
    }
    return [ ( r + m ), ( g + m ), ( b + m ) ];
};
Color.prototype.setBlue = function( b ) {
    this._b = b;
    this._update_hsl();
};
Color.prototype.setGreen = function( g ) {
    this._g = g;
    this._update_hsl();
};
Color.prototype.setHex = function( hex ) {
    hex = hex.replace( /^\s*#|\s+$/, '' );
    this._r = parseInt( hex.substr( 0, 2 ), 16 ) / 255.0;
    this._g = parseInt( hex.substr( 2, 2 ), 16 ) / 255.0;
    this._b = parseInt( hex.substr( 4, 2 ), 16 ) / 255.0;
    this._update_hsl();
};
Color.prototype.setHue = function( h ) {
    this._h = h;
    this._update_rgb();
};
Color.prototype.setHSL = function( h, s, l ) {
    this._h = h;
    this._s = s;
    this._l = l;
    this._update_rgb();
};
Color.prototype.setLightness = function( l ) {
    this._l = l;
    this._update_rgb();
};
Color.prototype.setRed = function( r ) {
    this._r = r;
    this._update_hsl();
};
Color.prototype.setRGB = function( r, g, b ) {
    this._r = r;
    this._g = g;
    this._b = b;
    this._update_hsl();
};
Color.prototype.setSaturation = function( s ) {
    this._s = s;
    this._update_rgb();
};
Color.prototype.toString = function() {
    return this.getHex();
};
Color.prototype._update_hsl = function() {
    [ this._h, this._s, this._l ] = this.getHSL();
};
Color.prototype._update_rgb = function() {
    [ this._r, this._g, this._b ] = this.getRGB();
};


function RangeWidget( label, value, min, max, step ) {

    this._spec = {
        'type'  : 'range',
        'min'   : min   || 0.0,
        'max'   : max   || 1.0,
        'step'  : step  || 0.01,
        'value' : value || 0.0
    };

    this.oninput = function( event ) {};

    this.element = document.createElement( 'label' );
    this.element.className = 'rangewidget';

    var span    = document.createElement( 'span' );
    this._label = document.createTextNode( label || 'X' );
    span.appendChild( this._label );
    this.element.appendChild( span );

    span = document.createElement( 'span' );
    this._range = document.createElement( 'input' );
    omap( this._range, this._spec );
    this._range.style.width = '256px';
    var context = this;
    this._range.oninput = ( function( event ) {
        context._set_display( event.target.value );
        context.oninput( event );
    } );
    span.appendChild( this._range );
    this.element.appendChild( span );

    span       = document.createElement( 'span' );
    var button = document.createElement( 'input' );
    omap( button, { 'type' : 'button', 'value' : '<' } );
    button.onclick = ( function( event ) {
        var v = context.getValue();
        if( v > context._spec.min ) {
            context.setValue( v - context._spec.step );
            context.oninput( event );
        }
    } );
    span.appendChild( button );
    button = document.createElement( 'input' );
    omap( button, { 'type' : 'button', 'value' : '>' } );
    button.onclick = ( function( event ) {
        var v = context.getValue();
        if( v < context._spec.max ) {
            context.setValue( v + context._spec.step );
            context.oninput( event );
        }
    } );
    span.appendChild( button );
    this.element.appendChild( span );

    span          = document.createElement( 'span' );
    this._display = document.createTextNode( '' );
    this._set_display( value );
    span.appendChild( this._display );
    this.element.appendChild( span );
}
RangeWidget.prototype.getLabel = function() {
    return this._label.nodeValue;
};
RangeWidget.prototype.getValue = function() {
    return parseFloat( this._range.value );
};
RangeWidget.prototype.setLabel = function( label ) {
    this._label.nodeValue = label;
};
RangeWidget.prototype.setValue = function( value ) {
    this._range.value = value;
    this._set_display( value );
};
RangeWidget.prototype.update = function() {
    this._set_display( this.getValue() );
};
RangeWidget.prototype._set_display = function( value ) {
    this._display.nodeValue = value;
};


function GradientStop( color, position ) {
    this.color    = color    || 'transparent';
    this.position = position || null;
}
GradientStop.prototype.toString = function() {
    if( this.position != null ) {
        return this.color + ' ' + this.position;
    }
    return this.color.toString();
};


function Gradient() {
    this.stops = arguments.length > 0 ? [].slice.call( arguments ) : [];
}
Gradient.prototype.addStop = function( stop ) {
    this.stops.push( stop );
    return this.stops.length - 1;
};
Gradient.prototype.setStop = function( index, stop ) {
    this.stops[ index ] = stop;
};
Gradient.prototype.toString = function() {
    if( this.stops.length == 0 ) {
        return 'black,white';
    }
    else if( this.stops.length == 1 ) {
        return 'black,' + this.stops[ 0 ];
    }
    return this.stops.join( ',' );
};


function ColorDimensionWidget( label, value ) {
    RangeWidget.call( this, label, value, 0.0, 1.0, 0.0025 );
    this.element.className += ' colordimensionwidget';
    this.gradient = new Gradient();
    var colors = arguments.length > 2 ? [].slice.call( arguments, 2 ) : [];
    for( var i = 0; i < colors.length; ++i ) {
        this.gradient.addStop( new GradientStop( colors[ i ] ) );
    }
    this._rnode = this._range.parentNode;
    omap( this._rnode.style, {
        'backgroundRepeat'   : 'no-repeat',
        'backgroundPosition' : '15px 0',
        'backgroundSize'     : 'calc( 100% - 30px ) 100%'
    } );
    this._set_display = function( value ) {
        value = Math.round( value * 10000.0 ) / 10000.0;
        this._display.nodeValue = value.toFixed( 4 );
        this._rnode.style.backgroundImage = 'linear-gradient( to right, '
          + this.gradient + ')';
    };
    this._set_display( value );
}
ColorDimensionWidget.prototype = new RangeWidget;
ColorDimensionWidget.prototype.addGradientStop = function( color ) {
    this.gradient.addStop( new GradientStop( color ) );
};
ColorDimensionWidget.prototype.setGradientStop = function( index, color ) {
    this.gradient.setStop( index, new GradientStop( color ) );
};


function XYZWidget( x, y, z ) {
    this.x = x || new RangeWidget( 'X' );
    this.y = y || new RangeWidget( 'Y' );
    this.z = z || new RangeWidget( 'Z' );
    this.element = document.createElement( 'div' );
    this.element.className = 'xyzwidget';
    var div = document.createElement( 'div' );
    div.appendChild( this.x.element );
    this.element.appendChild( div );
    div = document.createElement( 'div' );
    div.appendChild( this.y.element );
    this.element.appendChild( div );
    div = document.createElement( 'div' );
    div.appendChild( this.z.element );
    this.element.appendChild( div );
    this.oninput = function( event ) {};
    var context = this;
    this.x.oninput = function( event ) {
        event.range = context.x;
        context.oninput( event );
    };
    this.y.oninput = function( event ) {
        event.range = context.y;
        context.oninput( event );
    };
    this.z.oninput = function( event ) {
        event.range = context.z;
        context.oninput( event );
    };
}
XYZWidget.prototype.getValues = function() {
    return [ this.x.getValue(), this.y.getValue(), this.z.getValue() ];
};
XYZWidget.prototype.setValues = function( x, y, z ) {
    this.x.setValue( x );
    this.y.setValue( y );
    this.z.setValue( z );
};


function RGBWidget( color ) {
    this.color = color || new Color();
    var v = this.color.getRGB();
    var w = [
        new ColorDimensionWidget( 'R', v[ 0 ] ),
        new ColorDimensionWidget( 'G', v[ 1 ] ),
        new ColorDimensionWidget( 'B', v[ 2 ] )
    ];
    XYZWidget.apply( this, w );
    this.element.className += ' rgbwidget';
    this.u = [ this.x, this.y, this.z ];
    this._setup( [ 2, 2, 2 ] );
    var context = this;
    w[ 0 ].oninput = function( event ) {
        context.color.setRed( context.x.getValue() );
        context._update();
        event.range = context.x;
        context.oninput( event );
    };
    w[ 1 ].oninput = function( event ) {
        context.color.setGreen( context.y.getValue() );
        context._update();
        event.range = context.y;
        context.oninput( event );
    };
    w[ 2 ].oninput = function( event ) {
        context.color.setBlue( context.z.getValue() );
        context._update();
        event.range = context.z;
        context.oninput( event );
    };
}
RGBWidget.prototype = new XYZWidget;
RGBWidget.prototype.update = function() {
    this._update();
    var v = this.color.getRGB();
    this.x.setValue( v[ 0 ] );
    this.y.setValue( v[ 1 ] );
    this.z.setValue( v[ 2 ] );
};
RGBWidget.prototype._setup = function( stop_counts ) {
    var values;
    this.c = [];
    for( var i = 0; i < stop_counts.length; ++i ) {
        values = this.color.getHSL();
        this.c[ i ] = [];
        for( var j = 0; j < stop_counts[ i ]; ++j ) {
            values[ i ] = j / ( stop_counts[ i ] - 1 );
            this.c[ i ][ j ] = new Color();
            Color.prototype.setRGB.apply( this.c[ i ][ j ], values );
            this.u[ i ].addGradientStop( this.c[ i ][ j ] );
        }
        this.u[ i ].update();
    }
};
RGBWidget.prototype._update = function() {
    var num_colors, values;
    for( var i = 0; i < this.c.length; ++i ) {
        num_colors = this.c[ i ].length;
        values = this.color.getRGB();
        for( var j = 0; j < num_colors; ++j ) {
            values[ i ] = j / ( num_colors - 1 );
            Color.prototype.setRGB.apply( this.c[ i ][ j ], values );
        }
        this.u[ i ].update();
    }
};


function HSLWidget( color ) {
    this.color = color || new Color();
    var v = this.color.getHSL();
    var w = [
        new ColorDimensionWidget( 'H', v[ 0 ] ),
        new ColorDimensionWidget( 'S', v[ 1 ] ),
        new ColorDimensionWidget( 'L', v[ 2 ] )
    ];
    XYZWidget.apply( this, w );
    this.element.className += ' hslwidget';
    this.u = [ this.x, this.y, this.z ];
    this._setup( [ 7, 3, 3 ] );
    var context = this;
    w[ 0 ].oninput = function( event ) {
        context.color.setHue( context.x.getValue() );
        context._update();
        event.range = context.x;
        context.oninput( event );
    };
    w[ 1 ].oninput = function( event ) {
        context.color.setSaturation( context.y.getValue() );
        context._update();
        event.range = context.y;
        context.oninput( event );
    };
    w[ 2 ].oninput = function( event ) {
        context.color.setLightness( context.z.getValue() );
        context._update();
        event.range = context.z;
        context.oninput( event );
    };
}
HSLWidget.prototype = new XYZWidget;
HSLWidget.prototype.update = function() {
    this._update();
    var v = this.color.getHSL();
    this.x.setValue( v[ 0 ] );
    this.y.setValue( v[ 1 ] );
    this.z.setValue( v[ 2 ] );
};
HSLWidget.prototype._setup = function( stop_counts ) {
    var values;
    this.c = [];
    for( var i = 0; i < stop_counts.length; ++i ) {
        values = this.color.getHSL();
        this.c[ i ] = [];
        for( var j = 0; j < stop_counts[ i ]; ++j ) {
            values[ i ] = j / ( stop_counts[ i ] - 1 );
            this.c[ i ][ j ] = new Color();
            Color.prototype.setHSL.apply( this.c[ i ][ j ], values );
            this.u[ i ].addGradientStop( this.c[ i ][ j ] );
        }
        this.u[ i ].update();
    }
};
HSLWidget.prototype._update = function() {
    var num_stops, values;
    for( var i = 0; i < this.c.length; ++i ) {
        num_colors = this.c[ i ].length;
        values = this.color.getHSL();
        for( var j = 0; j < num_colors; ++j ) {
            values[ i ] = j / ( num_colors - 1 );
            Color.prototype.setHSL.apply( this.c[ i ][ j ], values );
        }
        this.u[ i ].update();
    }
};


function ColorWidget( color ) {
    if( typeof color == 'undefined' ) {
        this.color = new Color();
    }
    else if( typeof color == 'string' ) {
        this.color = new Color();
        this.color.setHex( color );
    }
    else if( typeof color == 'number' ) {
        this.color = new (
            Color.bind.apply( Color, [].slice.call( arguments ) )
        )();
    }
    else {
        this.color = color;
    }
    this.rgb = new RGBWidget( this.color );
    this.hsl = new HSLWidget( this.color );
    var hex = this.color.getHex();
    this.element = document.createElement( 'div' );
    this.element.className = 'colorwidget';
    this.display = document.createElement( 'div' );
    this.display.style.minHeight = '1em';
    this.display.style.backgroundColor = hex;
    this.hex = document.createElement( 'div' );
    this.hex.appendChild( document.createTextNode( hex ) );
    this.element.appendChild( this.display );
    this.element.appendChild( this.hex );
    this.element.appendChild( this.rgb.element );
    this.element.appendChild( this.hsl.element );
    var context = this;
    this.rgb.oninput = ( function( event ) {
        var hex = context.color.getHex();
        context.display.style.backgroundColor = hex;
        context.hex.firstChild.nodeValue = hex;
        context.hsl.update();
    } );
    this.hsl.oninput = ( function( event ) {
        var hex = context.color.getHex();
        context.display.style.backgroundColor = hex;
        context.hex.firstChild.nodeValue = hex;
        context.rgb.update();
    } );
}
ColorWidget.prototype.getValue = function() {
    return this.color.getRGB();
};
ColorWidget.prototype.setValue = function( r, g, b ) {
    this.color.setRGB( r, g, b );
    var hex = this.color.getHex();
    this.display.style.backgroundColor = hex;
    this.hex.firstChild.nodeValue = hex;
    this.hsl.update();
    this.rgb.update();
};
