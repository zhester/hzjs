/*----------------------------------------------------------------------------
Exploring Using Dynamically-generate SVG Images as Backgrounds
----------------------------------------------------------------------------*/

/**
 * Encodes a string for insertion into an HTML data URI attribute.
 */
function data_enc( string ) {

    //ZIH - works, seems to be the fastest, and doesn't bloat too bad
    return 'utf8,' + string
        .replace( /%/g, '%25' )
        .replace( /&/g, '%26' )
        .replace( /#/g, '%23' )
        //.replace( /"/g, '%22' )
        .replace( /'/g, '%27' );

    //ZIH - works, but it's bloaty
    //return 'utf8,' + encodeURIComponent( string );

    //ZIH - works, but it's laggy
    //return 'base64,' + window.btoa( string );
}

/**
 * Generates an SVG image using proper XML.
 * The limitation is that when serializing via .outerHTML, the namespace is
 * lost.
 */
function make_svg_ns() {
    var svgns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS( svgns, 'svg' );
    svg.setAttributeNS( null, 'version', '1.1' );
    svg.setAttributeNS( null, 'width', '128' );
    svg.setAttributeNS( null, 'height', '128' );
    var line = document.createElementNS( svgns, 'line' );
    line.setAttributeNS( null, 'x1', '0' );
    line.setAttributeNS( null, 'y1', '0' );
    line.setAttributeNS( null, 'x2', '100%' );
    line.setAttributeNS( null, 'y2', '100%' );
    line.setAttributeNS( null, 'stroke', '#0060FF' );
    line.setAttributeNS( null, 'stroke-width', '12' );
    svg.appendChild( line );
    line = document.createElementNS( svgns, 'line' );
    line.setAttributeNS( null, 'x1', '100%' );
    line.setAttributeNS( null, 'y1', '0' );
    line.setAttributeNS( null, 'x2', '0' );
    line.setAttributeNS( null, 'y2', '100%' );
    line.setAttributeNS( null, 'stroke', '#0060FF' );
    line.setAttributeNS( null, 'stroke-width', '12' );
    svg.appendChild( line );
    return svg;
}

/**
 * Generates an SVG image using the host document's namespace.
 * Here, serializing works since it's functionally HTML.
 */
function make_svg() {
    var svg = document.createElement( 'svg' );
    svg.setAttribute( 'xmlns', 'http://www.w3.org/2000/svg' );
    svg.setAttribute( 'version', '1.1' );
    svg.setAttribute( 'width', '128' );
    svg.setAttribute( 'height', '128' );
    var line = document.createElement( 'line' );
    line.setAttribute( 'x1', '0' );
    line.setAttribute( 'y1', '0' );
    line.setAttribute( 'x2', '100%' );
    line.setAttribute( 'y2', '100%' );
    line.setAttribute( 'stroke', '#FF6000' );
    line.setAttribute( 'stroke-width', '12' );
    svg.appendChild( line );
    line = document.createElement( 'line' );
    line.setAttribute( 'x1', '100%' );
    line.setAttribute( 'y1', '0' );
    line.setAttribute( 'x2', '0' );
    line.setAttribute( 'y2', '100%' );
    line.setAttribute( 'stroke', '#FF6000' );
    line.setAttribute( 'stroke-width', '12' );
    svg.appendChild( line );
    return svg;
}

/**
 * Script entry point.
 */
function main( argv ) {

    //list of backgrounds to display
    var bgstyles = [];

    /*------------------------------------------------------------------------
    Example 1: SVG in the host document
    ------------------------------------------------------------------------*/

    //dynamically create an SVG image as a part of the HTML document
    var svg = make_svg();

    //serialize into markup
    var svgs = svg.outerHTML;

    //create a data URI containing the SVG markup
    var bg = "url('data:image/svg+xml;" + data_enc( svgs ) + "')";
    bgstyles.push( bg + ' no-repeat left top' );

    /*------------------------------------------------------------------------
    Example 2: SVG in its own namespace in the host document
    ------------------------------------------------------------------------*/

    //dynamically create an SVG image the correct way
    svg = make_svg_ns();

    //use the XML serializer
    //  this is a LOT better since it's really XML (empty tags are properly
    //  serialized with </>, and the namespace is preserved without hacks)
    svgs = ( new XMLSerializer() ).serializeToString( svg );
    bg = "url('data:image/svg+xml;" + data_enc( svgs ) + "')";
    bgstyles.push( bg + ' no-repeat right top' );

    /*------------------------------------------------------------------------
    Analysis
    ------------------------------------------------------------------------*/

    //test sizes of things...
    //  ZIH - it's worth noting that base64-ing will also incur
    //  un-base64-ing before the browser's parser gets a whack at the
    //  gooey XML stuff inside.
    //  ZIH - both techniques seem super-hack-ish, though since the browser
    //  shouldn't be parsing something i asked it to programmatically
    //  construct a few microseconds ago.  i'd like to explore a general-
    //  purpose method of just layering the in-document SVG element as a
    //  "fake" background of any given element.
    var utf8_size   = data_enc( svgs ).length;
    var base64_size = data_enc( window.btoa( svgs ) ).length;
    console.log(
        'utf8: ' + utf8_size + ', ' + 'base64: ' + base64_size
        + '; ' + ( ( utf8_size / base64_size ) * 100 ) + '%'
    );

    /*------------------------------------------------------------------------
    Rendering
    ------------------------------------------------------------------------*/

    //put some text in the document for proof that it's really a background
    var h1 = document.createElement( 'h1' );
    h1.appendChild( document.createTextNode( 'Dynamic Backgrounds' ) );
    document.body.appendChild( h1 );

    //set the CSS to style the background
    document.body.style.background = bgstyles.join( ',' );

}

