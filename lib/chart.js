/*****************************************************************************
hzjs Chart Plotting System and Utilities

*****************************************************************************/

/*----------------------------------------------------------------------------
Library Boilerplate
----------------------------------------------------------------------------*/
var hz = ( function( ns ) { return ns; } )( hz || {} );

/*----------------------------------------------------------------------------
Module Dependencies
----------------------------------------------------------------------------*/
/*?jspp { "include" : { "hz" : [ 'doc', 'ui', 'util' ] } } ?*/

/*----------------------------------------------------------------------------
hzjs Chart Plotting System and Utilities Submodule
----------------------------------------------------------------------------*/
hz.plot = ( function( ns ) {

    /*------------------------------------------------------------------------
    Public Properties
    ------------------------------------------------------------------------*/

    //expose chart class
    ns.Chart = Chart;

    /*------------------------------------------------------------------------
    Public Methods
    ------------------------------------------------------------------------*/

    /*------------------------------------------------------------------------
    Classes
    ------------------------------------------------------------------------*/

    /*========================================================================
    Structured objects for organizing internal information.
    ========================================================================*/

    //lower and upper numerical limits
    ns.Limits = make_sequence( 'l u' );

    //a point on a Cartesian plane
    ns.Point = make_sequence( 'x y' );

    //rectangular dimensions
    ns.Rect = make_sequence( 'x y w h' );


    /*========================================================================
    Chart
    ========================================================================*/

    /**
     * Class to create and manipulate a visual representation of data.
     *
     * @param width  The desired width of the chart container element
     * @param height The desired height of the chart container element
     */
    function Chart( width, height ) {

        //this is the vertical inset of the plotting area
        var yinset = 48;

        //the plotting area's position and dimensions
        var plot_rect = new ns.Rect(
            0, yinset, width, ( height - ( 2 * yinset ) )
        );

        //root DOM element of the presentation
        this.root = hz.doc.build(
            [ 'div', { 'class' : 'plot_chart' } ]
        );
        hz.util.omap(
            this.root.style,
            {
                'height'   : height + 'px',
                'left'     : '0px',
                'position' : 'relative',
                'top'      : '0px',
                'width'    : width + 'px',
            }
        );

        //total physical dimensions of the presentation
        this.area = new ns.Rect( 0, 0, width, height );

        //the plot layer instance
        this.plot_layer = new PlotLayer( plot_rect );

        //generate the layer stack and a by-name lookup table
        this.layers = [];
        this.layer_refs = {};
        var layer_ref;

        //initialize the layer stack (from private properties below)
        //ZIH - fancy loop is overkill.  simpler to spec each layer here.
        for( var i = 0; i < layers.length; ++i ) {

            //this literal is for the PlotLayer in the chart
            if( layers[ i ][ 1 ] == 'PlotLayer' ) {
                layer_ref = this.plot_layer;
            }

            //see if the literal needs a layer and visual object
            else if( layers[ i ][ 1 ] != null ) {
                layer_ref = new Layer( this.area );
                layer_ref.create_visual( layers[ i ][ 1 ] );
            }

            //set the name of the layer in the lookup table
            this.layer_refs[ layers[ i ][ 0 ] ] = layer_ref;

            //add the layer to the layer rendering stack
            this.layers.push( layer_ref );

            //append layer element to chart element
            this.root.appendChild( layer_ref.get_element() );
        }
    }


    /**
     * Create a new data series in the Chart.
     *
     * @param ydata
     * @param xdata
     * @return
     */
    Chart.prototype.create_series = function() {
        return PlotLayer.prototype.create_series.apply(
            this.plot_layer, arguments
        );
    };


    /**
     * Provides support for the DOM provider interface.
     *
     * @return
     */
    Chart.prototype.get_element = function() {
        return this.root;
    };


    /**
     * Initiates chart renderering.
     *
     */
    Chart.prototype.render = function() {
        var num_layers = this.layers.length;
        for( var i = 0; i < num_layers; ++i ) {
            this.layers[ i ].render();
        }
    };


    /*========================================================================
    Dataset
    ========================================================================*/

    /**
     * Class to manage a set of numerical values.
     *
     * @param values
     */
    function Dataset() {
        this.data  = [];
        this.max   = 0;
        this.min   = 0;
        this.range = 0;
        this.size  = 0;
        Object.defineProperty(
            this,
            'length',
            { get: function() { return this.data.length; } }
        );
        if( ( arguments.length > 0 ) && ( arguments[ 0 ] instanceof Array ) ) {
            this.load( arguments[ 0 ] );
        }
    }


    /**
     * Appends a new value to the Dataset.
     *
     * @param value
     */
    Dataset.prototype.append = function( value ) {
        if( value > this.max ) { this.max = value; }
        if( value < this.min ) { this.min = value; }
        this.range = this.max - this.min;
        this.data.push( value );
        this.size += 1;
    };


    /**
     * Loads an array of values onto the end of the Dataset.
     *
     * @param data
     */
    Dataset.prototype.load = function( data ) {
        var max = Math.max.apply( null, data );
        var min = Math.min.apply( null, data );
        if( this.max < max ) { this.max = max; }
        if( this.min > min ) { this.min = min; }
        this.range = this.max - this.min;
        this.data  = this.data.concat( data );
        this.size  = this.data.length;
    };


    /*========================================================================
    Layer
    ========================================================================*/

    /**
     * Class to manage a rendering layer in the chart.
     *
     * @param area The area rectangle of the layer in the presentation
     */
    function Layer( area ) {

        //the area where this Layer exists in the presentation
        this.area = area;

        //container for the layer's canvases
        this.root = hz.doc.build( [ 'div' ] );
        hz.util.omap(
            this.root.style,
            {
                'left'     : area.x + 'px',
                'position' : 'absolute',
                'height'   : area.h + 'px',
                'top'      : area.y + 'px',
                'width'    : area.w + 'px'
            }
        );

        //defining this allows us to use the Layer as a Renderer
        this.visual = null;

        //set of all visual objects in this Layer
        this.visuals = [];
    }


    /**
     * Properly creates new visual objects within the layer.
     *
     * @param target The target Drawable object for the visual
     * @return       The created Visual object
     */
    Layer.prototype.create_visual = function( target ) {
        var area = new ns.Rect( 0, 0, this.area.w, this.area.h );
        var visual;

        //check for custom visual
        if( target == 'VisualImmediate' ) {
            visual = new VisualImmediate( area );
        }

        //create a base visual object
        else {
            visual = new Visual( area, target );
        }

        this.visuals.push( visual );
        this.root.appendChild( visual.get_element() );
        return visual;
    };


    /**
     * Provides support for DOM element extraction interface.
     *
     * @return The DOM element for this object
     */
    Layer.prototype.get_element = function() {
        return this.root;
    };


    /**
     * Supports the Renderable interface for the Layer class.
     *
     */
    Layer.prototype.render = function() {
        var num_visuals = this.visuals.length;
        for( var i = 0; i < num_visuals; ++i ) {
            this.visual = this.visuals[ i ];
            this.visuals[ i ].draw( this );
        }
    };


    /**
     * Translates a Point from Cartesian to Layer coordinates.
     *
     * @param p
     * @return
     */
    Layer.prototype.tp = function( p ) {
        return new ns.Point( p.x, ( this.area.h - p.y ) );
    };


    /*========================================================================
    PlotLayer
    ========================================================================*/

    /**
     * A specialized Layer class for handling the data series plots.
     *
     * @param area
     */
    function PlotLayer( area ) {

        //initialize the base Layer state
        Layer.call( this, area );

        //the list of data series in the chart
        this.series = [];
    }
    for( var name in Layer.prototype ) {
        PlotLayer.prototype[ name ] = Layer.prototype[ name ];
    }


    /**
     * Create a new data series in the PlotLayer.
     *
     * @param ydata
     * @param xdata
     * @return
     */
    PlotLayer.prototype.create_series = function() {
        var series;

        //see if this series specifies its own domain
        if( arguments.length > 1 ) {
            series = new Series(
                new Dataset( arguments[ 0 ] ),
                new Dataset( arguments[ 1 ] )
            );
        }

        //see if the user has, at least, given us data points
        else if( arguments.length > 0 ) {
            series = new Series( new Dataset( arguments[ 0 ] ) );
        }

        //create an empty series
        else {
            series = new Series();
        }

        //create the visual object that will display the series plot
        this.create_visual( series );

        //add the series to the chart
        this.series.push( series );

        //return the new series
        return series;
    };


    /**
     * Renders the PlotLayer in the chart.
     *
     */
    PlotLayer.prototype.render = function() {
        var num_series = this.series.length;
        //ZIH - ...
        //1. scan all series for their min/max X/Y
        //2. calculate auto-scaling coefficents for the entire chart
        //3. generate a renderer with transforms that can locally scale
        //   the series data points
        //4. determine the range's zero-point relative the chart area
        //5. draw a range axis local to each series
        // ... below is some functioning, but awful code
        //ZIH - note: all series are independently scaled here.  this needs
        //      to scale to a global plane first, and adjust the series to
        //      their own scaling factor by user intervention.
        //ZIH - note: negative translations are not implemented correctly
        var rndr, xsfun, ysfun;
        var make_scale_fun = function( in_min, in_max, out_min, out_max ) {
            return function( x ) {
                var m = ( out_max - out_min ) / ( in_max - in_min );
                var b = out_min - ( m * in_min );
                return ( m * x ) + b;
            };
        }
        for( var i = 0; i < num_series; ++i ) {
            if( this.series[ i ].xs != null ) {
                xsfun = make_scale_fun(
                    0,
                    this.series[ i ].xs.max,
                    1,
                    ( this.area.w - 1 )
                );
            }
            else {
                xsfun = make_scale_fun(
                    0,
                    ( this.series[ i ].length - 1 ),
                    1,
                    ( this.area.w - 1 )
                );
            }
            ysfun = make_scale_fun(
                this.series[ i ].ylimits.l,
                this.series[ i ].ylimits.u,
                ( this.area.h - 1 ),
                1
            );

            //create the custom renderer for the series
            rndr = {
                'visual' : this.visuals[ i ],
                'tp' : ( function( xs, ys ) { return function( p ) {
                    return new ns.Point( xs( p.x ), ys( p.y ) );
                } } )( xsfun, ysfun )
            };

            //ZIH - temp style code
            rndr.visual.context.strokeStyle =
                auto_colors[ i % auto_colors.length ];
            rndr.visual.context.lineWidth = 3;
            rndr.visual.context.lineCap   = 'round';
            rndr.visual.context.lineJoin  = 'round';

            //call the draw function for the visual representing the series
            this.visuals[ i ].draw( rndr );
        }
    };


    /*========================================================================
    Series
    ========================================================================*/

    /**
     * Class to manage a data series in a chart.
     *
     * @param ys An array of Y values to use as data points in the series
     * @param xs An array of X values to optionally allow irregular domains
     */
    function Series() {
        this.ys      = arguments.length > 0 ? arguments[ 0 ] : new Dataset();
        this.xs      = arguments.length > 1 ? arguments[ 1 ] : null;
        this.size    = this.ys.size;
        this.plot    = 'straight';
        this.ylimits = new ns.Limits( 0, 0 );
        Object.defineProperty(
            this,
            'length',
            { 'get' : function() { return this.ys.length; } }
        );
        this._update();
    }


    /**
     * Appends a new value to the series.
     *
     * @param value The numeric value to add to the end of the series
     * @param x     Optional X value where this Y value occurs
     */
    Series.prototype.append = function( value ) {
        if( ( this.xs != null ) && ( arguments.length > 1 ) ) {
            this.xs.append( arguments[ 1 ] );
        }
        this.ys.append( value );
        this.size += 1;
        this._update();
    };


    /**
     * Supports the Drawable interface for the series.
     *
     * @param rndr The Renderer responsible for rendering the object
     */
    Series.prototype.draw = function( rndr ) {
        var plotter = 'draw_' + this.plot;
        if( ( plotter in this ) == false ) {
            throw new Error( 'Invalid plot type "' + this.plot + '" set.' );
        }
        this[ plotter ]( rndr );
    };


    /**
     * Plots the series a points.
     *
     * @param rndr
     */
    Series.prototype.draw_points = function( rndr ) {

        //shortcut to the canvas' drawing context
        var ctx = rndr.visual.context;

        //ZIH - steal the stroke style for our fill style
        //    - will need to allow shape stroking later!
        ctx.fillStyle = ctx.strokeStyle;

        //for now, draw rectangles with this dimension
        var rdim = ctx.lineWidth * 1.5;
        var roff = rdim / 2;

        //refer to points in the series
        var p;

        //draw each point as a filled shape
        for( var i = 0; i < this.size; ++i ) {

            //translate the current point in the series
            p = rndr.tp( this.index( i ) );

            //draw a filled shape at this point
            ctx.fillRect( ( p.x - roff ), ( p.y - roff ), rdim, rdim );
        }
    };


    /**
     * Draws smoothed plots of the series.
     *
     * @param rndr
     */
    Series.prototype.draw_smooth = function( rndr ) {

        //if there are only two points, there's no smoothing to do
        if( this.size <= 2 ) {
            this.draw_straight( rndr );
            return;
        }

        //enable/disable some visual debugging
        var debug = false;

        //In/out slope compensation.  This technique relies on using
        //  information from the neighboring two points of a given data point.
        //  For the terminal points, however, a direct slope is calculated.
        //  But, rather than follow that slope directly, this makes the slope
        //  shallower by multiplying it with the point-to-point slope.  1.0
        //  sets the slope to the real slope between the terminal point and
        //  its immediate neighbor.  0.0 makes the slope flat with respect to
        //  the range.
        var inout_slope_mod = 0.5;

        //Similar to the in/out compensation, this modifies the slope between
        //  control points through a data point.  1.0 is no change.  0.0 makes
        //  all slopes flat with respect to the range.
        var data_slope_mod = 0.75;

        //The interval divisor for placing control points on the domain.
        //  this can make some series smoother at the expense of more
        //  overshoot.  This divides the domain interval between data points.
        //  the result is used to place the control points after the source
        //  point and before the target point in the curve.  Larger divisors
        //  (smaller divisions) will make the curve less smooth or more like a
        //  non-smoothed plot.  Smaller divisors (larger divisions) will
        //  increase the smoothness, but will start to misrepresent the data
        //  with a lot of false overshoot between points.
        var intrvl_div = 3;

        //the control point domain offset
        var cp_offset;

        //next point, previous and current slopes across the data point
        var np, pm, cm;

        //set up some points for calculating the control points in the curve
        var cp1 = new ns.Point( 0, 0 );
        var cp2 = new ns.Point( 0, 0 );

        //shortcut to the canvas' drawing context
        var ctx = rndr.visual.context;

        //fetch the first point in the series as the "previous" point
        var pp = rndr.tp( this.index( 0 ) );

        //fetch the second point in the series as the "current" point
        var cp = rndr.tp( this.index( 1 ) );

        //calculate the initial slope between data points
        pm = ( pp.y - cp.y ) / ( pp.x - cp.x ) * inout_slope_mod;

        //start drawing a path for the series
        ctx.beginPath();

        //move to the initial point in the series
        ctx.moveTo( pp.x, pp.y );

        //debugging variables (point marker dimensions)
        if( debug ) {
            var cpmd = ctx.lineWidth + 2;
            var cpmo = cpmd / 2;
            var pmd  = ctx.lineWidth + 4;
            var pmo  = pmd / 2;
            ctx.fillStyle = ctx.strokeStyle;
            ctx.fillRect( pp.x - pmo, pp.y - pmo, pmd, pmd );
        }

        //connect each point with a curved line segment
        for( var i = 2; i < this.size; ++i ) {

            //set the domain values of the control points to be between the
            //previous and current data points
            cp_offset = ( ( cp.x - pp.x ) / intrvl_div );
            cp1.x = pp.x + cp_offset;
            cp2.x = cp.x - cp_offset;

            //fetch the next point in the series
            np = rndr.tp( this.index( i ) );

            //calculate the slope between the two neighboring (prevous and
            //next) points
            cm = ( np.y - pp.y ) / ( np.x - pp.x ) * data_slope_mod;

            //calculate the range values of the control points to mirror the
            //previous and current slope through each data point
            //  y = mx + b; where b = y' - mx'
            cp1.y = ( pm * cp1.x ) + ( pp.y - ( pm * pp.x ) );
            cp2.y = ( cm * cp2.x ) + ( cp.y - ( cm * cp.x ) );

            //debugging: draw the point and control points
            if( debug ) {
                ctx.fillRect( cp.x - pmo, cp.y - pmo, pmd, pmd );
                ctx.fillRect( cp1.x - cpmo, cp1.y - cpmo, cpmd, cpmd );
                ctx.fillRect( cp2.x - cpmo, cp2.y - cpmo, cpmd, cpmd );
                ctx.moveTo( pp.x, pp.y );
                ctx.lineTo( cp1.x, cp1.y );
                ctx.moveTo( cp2.x, cp2.y );
                ctx.lineTo( cp.x, cp.y );
                ctx.moveTo( pp.x, pp.y );
            }

            //construct the necessary line segment between the previous
            //  and the current point
            ctx.bezierCurveTo( cp1.x, cp1.y, cp2.x, cp2.y, cp.x, cp.y );

            //update the previous and current point references
            pp = cp;
            cp = np;
            pm = cm;
        }

        //determine a reasonable final slope between points
        cm = ( cp.y - pp.y ) / ( cp.x - pp.x ) * inout_slope_mod;

        //set the control points
        cp_offset = ( ( cp.x - pp.x ) / intrvl_div );
        cp1.x = pp.x + cp_offset;
        cp2.x = cp.x - cp_offset;
        cp1.y = ( pm * cp1.x ) + ( pp.y - ( pm * pp.x ) );
        cp2.y = ( cm * cp2.x ) + ( cp.y - ( cm * cp.x ) );

        //debugging: draw the point and control points
        if( debug ) {
            ctx.fillStyle = ctx.strokeStyle;
            ctx.fillRect( np.x - pmo, np.y - pmo, pmd, pmd );
            ctx.fillRect( cp1.x - cpmo, cp1.y - cpmo, cpmd, cpmd );
            ctx.fillRect( cp2.x - cpmo, cp2.y - cpmo, cpmd, cpmd );
            ctx.lineTo( cp1.x, cp1.y );
            ctx.moveTo( cp2.x, cp2.y );
            ctx.lineTo( cp.x, cp.y );
            ctx.moveTo( pp.x, pp.y );
        }

        //construct the final line segment
        ctx.bezierCurveTo( cp1.x, cp1.y, cp2.x, cp2.y, cp.x, cp.y );

        //finish the path by stroking it
        ctx.stroke();
    };


    /**
     * Draws straight-line plots of the series.
     *
     * @param rndr
     */
    Series.prototype.draw_straight = function( rndr ) {

        //shortcut to the canvas' drawing context
        var ctx = rndr.visual.context;

        //get and translate the first point in the series
        var p = rndr.tp( this.index( 0 ) );

        //start drawing a path for the series
        ctx.beginPath();

        //move to the initial point in the series
        ctx.moveTo( p.x, p.y );

        //connect each point with a line segment
        for( var i = 1; i < this.size; ++i ) {

            //translate the current point in the series
            p = rndr.tp( this.index( i ) );

            //construct the necessary line segment
            ctx.lineTo( p.x, p.y );
        }

        //finish the path by stroking it
        ctx.stroke();
    };


    /**
     * Allows iterative access to each data element in the series.
     *
     * @param index The index of the value to retrieve from the series
     * @return      The Point representing this element in the series
     */
    Series.prototype.index = function( index ) {
        if( index >= this.size ) {
            throw new Error( 'Invalid index (' + index + ') in series.' );
        }
        else if( index < 0 ) {
            return this.index( this.size + index );
        }
        if( this.xs != null ) {
            return new ns.Point(
                this.xs.data[ index ],
                this.ys.data[ index ]
            );
        }
        return new ns.Point( index, this.ys.data[ index ] );
    };


    /**
     * Updates internal metrics of the series.
     *
     */
    Series.prototype._update = function() {
        var margin = this.ys.range * 0.1;
        this.ylimits.l = this.ys.min - margin;
        this.ylimits.u = this.ys.max + margin;
    };


    /*========================================================================
    Visual
    ========================================================================*/

    /**
     * Class to manage any visual element within a layer.
     *
     * @param area The visual area within the layer
     */
    function Visual( area ) {
        this.area    = area;
        this.canvas  = make_canvas( this.area );
        this.context = this.canvas.getContext( '2d' );
        this.target  = arguments.length > 1 ? arguments[ 1 ] : null;
    }


    /**
     * Clears the visual drawing area (convenience method).
     *
     * @param rect Optionally clear a rectangular are using a Rect object
     */
    Visual.prototype.clear = function() {
        if( arguments.length > 0 ) {
            var rect = arguments[ 0 ];
            this.context.clearRect( rect.x, rect.y, rect.w, rect.h );
        }
        else {
            this.context.clearRect( 0, 0, this.area.w, this.area.h );
        }
    };


    /**
     * Supports the Drawable interface for Visual objects.
     *
     */
    Visual.prototype.draw = function( rndr ) {
        if( ( this.target != null ) && ( 'draw' in this.target ) ) {
            this.target.draw( rndr );
        }
    };


    /**
     * Provides support for DOM element extraction interface.
     *
     * @return The DOM element for this object
     */
    Visual.prototype.get_element = function() {
        return this.canvas;
    };



    /*========================================================================
    Specialized Visuals
    ========================================================================*/

    /**
     * Class to manage the "immediate" layer's visual rendering.
     *
     * ZIH - implement a drawing style manager so we can re-style things
     *       per Chart instance (easily)
     * ZIH - implement a way to ask the "series" layer for the user's
     *       current coordinate system, then translate canvas pixels to plot
     *       coordinates in the text output
     */
    function VisualImmediate( area ) {
        Visual.call( this, area );
        this.init_events();
    }
    for( var name in Visual.prototype ) {
        VisualImmediate.prototype[ name ] = Visual.prototype[ name ];
    }


    /**
     * Draws a pair of lines that "aim" at a point on the canvas.
     *
     * @param x
     * @param y
     */
    VisualImmediate.prototype.aim = function( x, y ) {
        this.context.strokeStyle = 'rgba(0,0,0,0.2)';
        this.context.lineWidth = 0.5;
        this.context.beginPath();
        this.context.moveTo( x, 0 );
        this.context.lineTo( x, this.area.h );
        this.context.moveTo( 0, y );
        this.context.lineTo( this.area.w, y );
        this.context.stroke();
    };


    /**
     * Supports the Drawable interface to the visual.
     *
     * @param rndr
     */
    VisualImmediate.prototype.draw = function( rndr ) {
        this.print( 'coords' );
    };


    /**
     * Prints a small amount of text on the canvas.
     *
     * @param message
     */
    VisualImmediate.prototype.print = function( message ) {
        //ZIH - hard-coded styles
        this.context.font = "14pt 'Source Sans Pro', Consolas, monospace";
        this.context.fillStyle = '#888888';
        var temp = this.context.measureText( message );
        //ZIH - hard-coded margins
        this.context.fillText(
            message,
            ( this.area.w - temp.width - 10 ),
            ( this.area.h - 16 )
        );
    };


    /**
     * Initializes the event handling for the canvas.
     *
     */
    VisualImmediate.prototype.init_events = function() {

        //handle mouse movement over the canvas element
        var move_handler = ( function( inst ) { return function( event ) {
            var rect = this.getBoundingClientRect();
            var x = event.clientX - rect.left;
            var y = event.clientY - rect.top;
            var c = x + ',' + ( inst.area.h - y );
            inst.clear();
            inst.print( c );
            inst.aim( x, y );
            inst.tip( x, y, c );
        }; } )( this );

        //handle mouse cursor entering the canvas area
        var over_handler = ( function( inst ) { return function( event ) {
            inst.canvas.addEventListener( 'mousemove', move_handler, false );
        }; } )( this );

        //handle mouse curosr leaving the canvas area
        var out_handler = ( function( inst ) { return function( event ) {
            inst.clear();
            inst.canvas.removeEventListener( 'mousemove', move_handler, false );
        }; } )( this );

        //assign the entering/leaving event handlers
        this.canvas.addEventListener( 'mouseover', over_handler, false );
        this.canvas.addEventListener( 'mouseout', out_handler, false );
    };


    /**
     * Displays a small box of text near the requested position.
     * Note: The box may not appear exactly where requested due to how it
     * decides to avoid clipping behind the edges of the canvas and the mouse
     * cursor.
     *
     * @param x    The requested horizontal position
     * @param y    The requested vertical position
     * @param text The text to display in the box
     */
    VisualImmediate.prototype.tip = function( x, y, text ) {
        //ZIH - hard-coded styles
        var fsize = 12;
        this.context.font = fsize + "px 'Source Sans Pro', Consolas, monospace";
        this.context.fillStyle = 'rgba(255,255,255,0.8)';
        var fmet = this.context.measureText( text );
        var mrg = 4;
        var pad = 4;
        //ZIH - need to detect "collision" with edge of canvas, and reposition
        var rect = new ns.Rect(
            ( x + mrg ), ( y - fsize - pad - mrg ),
            //note: text width measurement seems narrow, double padding
            ( fmet.width + ( pad << 1 ) ), ( fsize + pad )
        );
        this.context.save();
        this.context.fillStyle = 'rgba(0,0,0,0.4)';
        this.context.strokeStyle = 'rgba(0,0,0,0.6)';
        this.context.fillRect( rect.x, rect.y, rect.w, rect.h );
        this.context.strokeRect( rect.x, rect.y, rect.w, rect.h );
        this.context.restore();
        this.context.fillText( text, ( x + pad + mrg ), ( y - ( pad + mrg ) ) );
    };


    /*------------------------------------------------------------------------
    Private Properties
    ------------------------------------------------------------------------*/

    //some automatic coloring colors
    var auto_colors = [
        '#268BD2', '#CB4B16', '#B58900', '#348C28',
        '#D33682', '#DC322F', '#2AA198', '#6C71C4'
    ];

    //chart rendering layers
    //  elements: name, Drawable
    //ZIH - refactor this to simpler creation calls in the Chart constructor
    var layers = [

        //style-able background canvas
        [ 'background', { draw : function( r ) {} } ],

        //X grid lines and chart axis
        [ 'domain', { draw : function( r ) {} } ],

        //data series plot(s)
        [ 'series', 'PlotLayer' ],

        //user interface widgets
        [ 'interface', { draw : function( r ) {} } ],

        //immediate information
        [ 'immediate', 'VisualImmediate' ]

    ];


    /*------------------------------------------------------------------------
    Private Methods
    ------------------------------------------------------------------------*/

    /**
     * Centralizes construction of new canvas document elements.
     *
     * @param area The rectangular area of the canvas
     * @return     The DOM element for the canvas
     */
    function make_canvas( area ) {
        var canvas = hz.doc.build(
            [ 'canvas', { 'width' : area.w, 'height' : area.h } ]
        );
        hz.util.omap(
            canvas.style,
            {
                'position' : 'absolute',
                'left'     : area.x + 'px',
                'top'      : area.y + 'px'
            }
        );
        return canvas;
    };


    /**
     * Makes simple Drawable-supporting objects for testing/debugging.
     *
     * @return A new object that supports the Drawable interface
     */
    function make_drawable() {
        return {
            'draw' : function( rndr ) {
                //references to the visual area and canvas' context
                var area = rndr.visual.area;
                var ctx = rndr.visual.context;
                //random dimension between 50 and 99
                var dim = Math.random() * 50 + 50;
                //random x between 0 and the right edge
                var x = Math.random() * ( area.w - dim );
                //random y between 0 and the bottom edge
                var y = Math.random() * ( area.h - dim );
                //draw a randomly-place/sized square
                ctx.fillRect( x, y, dim, dim );
            }
        };
    }


    /**
     * Object generator for making small sequences easier to document.
     *
     * @param properties The list of properties for the new object
     * @return           An object constructor function for the sequence
     */
    function make_sequence( properties ) {
        var props = properties instanceof Array
            ? properties : properties.split( ' ' );
        var num_props = props.length;
        var sequence = function() {
            if( arguments.length != num_props ) {
                throw new Error( 'Invalid number of elements for sequence.' );
            }
            this.data = Array.prototype.slice.call( arguments );
        };
        for( var i = 0; i < num_props; ++i ) {
            Object.defineProperty(
                sequence.prototype,
                props[ i ],
                make_sequence_conf( i )
            );
        }
        return sequence;
    }


    /**
     * Generate a property configuration for a sequence property.
     *
     * @param index The index into the property list for this property
     * @return      A property configuration object
     */
    function make_sequence_conf( index ) {
        return {
            'enumerable' : true,
            'get'        : function() { return this.data[ index ]; },
            'set'        : function( value ) { this.data[ index ] = value; }
        };
    }


    return ns;
} )( hz.plot || {} );

