Canvas-base Chart Plotting
==========================

Requirements/Features
---------------------

Plot data series with arbitrary domains and ranges.

Plot multiple series on the same chart.

- Multiple series shall share domains.
- Multiple series may share or use distinct ranges.
- Multiple series shall be able to be added dynamically.

Range axis shall support logarithmic ranges.

Each series may be uniquely styled for visual differentiation.

Series may be rendered using one of the following styles:

- Direct point-to-point line graphs
- Data-point "scatter" graphs
- Smoothed point-to-point line graphs

The chart shall render auxilliary information:

- Chart title
- Chart description/notes
- Primary domain and range axes
- Alternate range axes
- Major and minor domain and range grids
- Major and minor axes "tick marks"
- Axes labels
- Axes values (can select to mark all major or all minor)

### Live-updating and Streaming

The chart should (at least) plan for the possibility that each series may be
independently modified while the user is viewing the data.  The idea would be
to show a "live" graph from an outside resource, or to stream data from a file
on the server.  The series would become FIFO representations of the data.
Zooming would probably have to be liited when updating like this.

Additionally, a series may represent "framed" data.  Where the entire series
is repeatedly replaced by a new set of data.  This would provide the ability
to display captured data frames, response/time charts, etc.

A far-future extension would be to provide echo-graph "waterfall" charts where
the main chart displays a frequency response, and a section below that
displays a echo-graph with sample intervals on the vertical axis.

### Utilities

It should be possible to "save" or "capture" the view of a chart at a given
state.  Perhaps sending the request to the server to produce a PNG based on a
simple protocol, or rendering the image locally for the user (depending on
JavaScript support).

### Interactivity

The chart viewing area shall be able to scale/zoom each axis independently.

Zooming may be permitted/denied for each axis independently (e.g. locking
zooming on the range, allows the user to "scan" more easily through the domain
for long-duration charts).

The chart viewing area shall be able to pan the extent of each axis.

By default, the mouse cursor will render a "target" pair of light/alpha lines
that display the current values for the primary domain and range.  The values
at that position will be displayed in either a fixed position on the chart, or
a "floating" element that follows the position of the cursor.

### Add-ons

The chart widget may permit the use of simple add-on helper objects that
extend functionality without re-writing the chart's rendering chain.

One such add-on would be a built-in "math" function that can display
additional series based on the results of a function callback or simple
addition/logic operators.

Another add-on would be a chart optimized for displaying digital states, and
possibly interpreting data values based on digitial combinations of states
(e.g. I2C, SPI, UART, etc).

### Implementation Details

The chart itself will be rendered using a stack of HTML canvas elements.  This
would exploit the browser's native alpha blending, and allow fewer updates to
the context(s).

The stack would appear as the following "layers":

- Interactive display elements (e.g. cursor lines, immediate information boxes)
- User elements (e.g. buttons, UI widgets, etc.)
- **One layer per series** (includes its range axis)
- The domain axis, ticks, value labels, etc
- Series legends, descriptions, chart notes, chart title
- Major and minor grid lines
- The background layer (for styling purposes, usually unused)

Each layer may not, necessarily, be the same size and position on the page.
The series layers might benefit from being "inset" within the overall
presentation to make coordinate transforms simpler, and to give the pan/zoom
interaction a cleaner feel.

Each series shall be able to share the "base" series range axis.  But, they
can also provide their own axis.  This includes the start/stop values, major
and minor "ticks" and major and minor value labels.  It may also specify that
the series (and therefore axis rendering) is logarithmic.

The chart area must be independent of the canvas area.  This is necessary for
zooming and panning, as well as giving the necessary margins for rendering
titles, axes, legends, etc.

A series is only aware of the chart area, and it thinks each point is
represented in standard Cartesean coordinates (i.e. (0,0) is the origin, and
the Y axis increases from bottom to top).  The chart renderer will do the
necessary vertical transforms, and adjusting the series data values to the
appropriate positions in the current view configuration of the chart.

### chart.js

struct Limits
    Number l
    Number u

struct Point
    Number x
    Number y

struct Rect
    Int x
    Int y
    Int w
    Int h

interface Drawable
    --------------------------------
    draw( Renderer )

class Chart
    Rect area
    Layer layers[]
    PlotLayer plot_layer
    --------------------------------
    Series create_series( < Array <, Array > > );
    HTMLElement get_element()
    render()

class Dataset
    Number data[]
    Int length
    Number max
    Number min
    Number range
    Int size
    --------------------------------
    append( Number )
    load( Number[] )

class Layer
    Rect area
    Visual visuals[]
    --------------------------------
    Visual create_visual( < Drawable > )
    render()

class PlotLayer( Layer )
    Series series[]
    --------------------------------
    Series create_series( < Array <, Array > > );

class Renderer
    Visual visual
    --------------------------------
    Point tp( Point )

class Series
    Int length
    Int size
    Dataset xs
    Limits ylimits
    Dataset ys
    --------------------------------
    append( Number <, Number > )
    draw( Renderer )
    Point index( Int )

class Visual
    Rect area
    HTMLCanvasElement canvas
    CanvasRenderingContext2D context
    Object target
    --------------------------------
    Visual( Rect <, Object > )
    draw( Renderer )

