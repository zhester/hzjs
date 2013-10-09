/*****************************************************************************
    User Interface Components

    Major Sections
        fill_vertical   Function to max out an element's potential height
        progress        Class to help draw and update CSS+JS progress bars
*****************************************************************************/

/**
 *  UI Namespace Container
 *
 */
var ui = {};


/**
 *  Modifies an element's height to completely fill the remaining vertical
 *  space of a reference element.  If the reference element happens to be the
 *  document element, the target element will fill the remainder of the
 *  viewport.
 *
 *  @param elem         The target element to resize
 *  @param relem        The reference element to attempt to fill
 *  @param bounce       Optional amount of margin below the target element
 *  @return             The height value that was used to resize the element
 */
function fill_vertical( elem, relem ) {

    //check/default the bounce argument
    var bounce = arguments[ 2 ] ? arguments[ 2 ] : 0;

    //retrieve the bounding rectangles of both elements
    var elem_rect  = elem.getBoundingClientRect();
    var relem_rect = relem.getBoundingClientRect();

    //determine the height that will be filled
    var fill_height = relem_rect.height;
    if( relem.clientHeight ) {
        fill_height = relem.clientHeight;
    }

    //get the target element's current style information
    var style = window.getComputedStyle( elem, null );

    //compensate for other styling factors that add padding/borders
    var inner_height = parseInt( style.getPropertyValue( 'height' ) );
    var vertical_padding = elem_rect.height - inner_height;

    //compensate for differences in the tops of both elements
    var vertical_offset = elem_rect.top - relem_rect.top;

    //compute the new height of target element
    var height = fill_height - vertical_offset - vertical_padding - bounce;

    //resize to and report the new height
    elem.style.height = height + 'px';
    return height;
}


/**
 *  Class to augment an indeterminate progress bar so it can be updated to
 *  show computed progress for a task.
 *
 *  @param element      The DOM element for an indeterminate progress bar
 */
ui.progress = function( element ) {

    this.bar = element;

    //this locks the bar's height as it's about to lose all its content
    this.bar.style.height = this.bar.clientHeight + 'px';

    //create a wrapper element that will draw the unfilled area of the bar
    this.wrapper = document.createElement( 'div' );
    this.wrapper.className = 'progress_wrapper';

    //swap the bar node with the wrapper node in the document
    var pnode = this.bar.parentNode;
    pnode.replaceChild( this.wrapper, this.bar );
    this.wrapper.appendChild( this.bar );

    //create a content element to control the bar's contents without being
    //  affected by changes to its width (which indicate progress ratio)
    this.content = document.createElement( 'div' );
    this.content.className = 'progress_content';

    //re-attach the bar's children to the content element
    while( this.bar.childNodes.length > 0 ) {
        this.content.appendChild(
            this.bar.removeChild( this.bar.firstChild )
        );
    }

    //attach the content element to the wrapper
    this.wrapper.appendChild( this.content );
};


/**
 *  Retrieves the outer-most DOM element for this widget.
 *
 *  @return             Reference to outer-most DOM element
 */
ui.progress.prototype.get_container = function() {
    return this.wrapper;
};


/**
 *  Sends updates to the progress bar.
 *
 *  @param ratio        The fill ratio from 0.0 to 1.0.
 */
ui.progress.prototype.update = function( ratio ) {
    this.bar.style.width = ( ratio * 100.0 ) + '%'
};

