/****************************************************************************

Notes on working with content scrolling in JavaScript

clientHeight:
Returns the height of the visible area for an object, in pixels. The value
contains the height with the padding, but it does not include the scrollBar,
border, and the margin.

offsetHeight:
Returns the height of the visible area for an object, in pixels. The value
contains the height with the padding, scrollBar, and the border, but does not
include the margin.

****************************************************************************/

content.onscroll = function( event ) {
    var e = event.target;
    //visible height: e.offsetHeight
    //total height: e.scrollHeight
    //position of top of viewable area: e.scrollTop
    if( ( e.scrollHeight - e.scrollTop ) === e.clientHeight ) {
        console.log( 'scrolled to bottom' );
    }
    else {
        console.log( 'not scrolled to bottom' );
    }
    console.log( 'scroll ratio: ' + e.scrollTop + '/' + e.scrollHeight );
};

