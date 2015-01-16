/*****************************************************************************
Hz In-page Navigation Library

*****************************************************************************/

/*----------------------------------------------------------------------------
Hz Library Boilerplate
----------------------------------------------------------------------------*/
var hz = ( function( ns ) { return ns; } )( hz || {} );


/*----------------------------------------------------------------------------
Module Dependencies
----------------------------------------------------------------------------*/
/*?jspp { "include" : { "hz" : [ "util" ] } } ?*/


/*----------------------------------------------------------------------------
Hz In-page Navigation Submodule
----------------------------------------------------------------------------*/
hz.nav = ( function( ns ) {

    /*------------------------------------------------------------------------
    Public Methods
    ------------------------------------------------------------------------*/

    /**
     *  Performs the functional activity of navigating without changing the
     *  browser's history.
     *
     *  @return True if the action was considered successful
     */
    ns.action = function( query ) {
        var allow = false;
        var args = query.split( ':' );
        if( ( query.length > 0 ) && ( args.length > 0 ) ) {
            var key = args.shift();
            if( key in _listeners ) {
                allow = _listeners[ key ].apply( null, args );
            }
            else if( _default != null ) {
                args.unshift( key );
                allow = _default.apply( null, args );
            }
            else {
                var ref = hz.util.oget( window, key );
                if( ref instanceof Function ) {
                    allow = ref.apply( null, args );
                }
                else {
                    throw new Error( 'Requested unknown action: ' + query );
                }
            }
        }
        else if( _default != null ) {
            allow = _default.apply( null, [] );
        }
        else {
            throw new Error(
                'Requested empty action with no default listener.'
            );
        }
        return allow;
    };


    /**
     *  Trigger navigation for the page's current state.
     *
     *  @return True if navigation was considered successful
     */
    ns.navigate = function() {
        var hash = window.location.hash;
        hash = hash.replace( /^#/, '' );
        return ns.action( hash );
    };


    /**
     *  Sets the listener for a particular navigation action key.
     *
     *  @param key
     *  @param callback
     */
    ns.set_listener = function( key, callback ) {
        if( key == null ) {
            _default = callback;
        }
        else {
            _listeners[ key ] = callback;
        }
    };


    /**
     *  Convenience function to put the module into its most useful state.
     *
     *  @param callback
     */
    ns.setup = function( callback ) {
        _default = callback;
        ns.start();
    };


    /**
     *  Initializes the module to begin monitoring history events.
     *
     */
    ns.start = function() {
        window.addEventListener( 'popstate', _history, false );
        ns.navigate();
    };


    /*------------------------------------------------------------------------
    Private Properties
    ------------------------------------------------------------------------*/

    var _default = null;            //default navigation listener
    var _listeners = {};            //sub-action navigation listeners


    /*------------------------------------------------------------------------
    Private Methods
    ------------------------------------------------------------------------*/

    /**
     *  History event listener.
     *
     *  @param event
     */
    function _history( event ) {
        if( ns.navigate() == false ) {
            event.preventDefault();
        }
    }


    return ns;
} )( hz.nav || {} );
