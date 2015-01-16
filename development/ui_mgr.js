/*****************************************************************************
Hz Library UI Manager

*****************************************************************************/

/*----------------------------------------------------------------------------
Hz Library Boilerplate
----------------------------------------------------------------------------*/
var hz = ( function( ns ) { return ns; } )( hz || {} );

/*----------------------------------------------------------------------------
Module Dependencies
----------------------------------------------------------------------------*/
/*?jspp { "include" : { "hz" : [ "doc" ] } } ?*/

/*----------------------------------------------------------------------------
Hz UI Manager Submodule
----------------------------------------------------------------------------*/
hz.ui_mgr = ( function( ns ) {

    /*------------------------------------------------------------------------
    Public Properties
    ------------------------------------------------------------------------*/

    //Expose the UI manager class.
    ns.ui_mgr = ui_mgr;

    /*------------------------------------------------------------------------
    Public Methods
    ------------------------------------------------------------------------*/

    /*------------------------------------------------------------------------
    Classes
    ------------------------------------------------------------------------*/

    /**
     *
     *
     */
    function ui_mgr( container ) {
        this._base   = container;
        this._stack  = [];
        this._next_z = 0;
    }

    ui_mgr.FLG_FOCUS    = 0x0001;
    ui_mgr.FLG_HIDDEN   = 0x0010;

    ui_mgr._FLG_DEFAULT = 0x0000;
    ui_mgr._FLG_MASK    = 0xFFFF;
    ui_mgr._ZBASE       = 100;

    //creates the DOM elements and supporting references for a display frame
    //  note: the created frame is placed under manager control
    ui_mgr.prototype.create_frame = function() {
        var label    = arguments.length > 0 ? arguments[ 0 ] : false;
        var contents = arguments.length > 1 ? arguments[ 1 ] : '';
        var flags    = arguments.length > 2 ? arguments[ 2 ] : 0;
        var frame    = null;
        if( label !== false ) {
            frame = hz.doc.build( [ 'div', [
                [ 'h1', label ],
                [ 'div', contents ]
            ] ] );
        }
        else {
            frame = document.createElement( 'div' );
        }
        this.decorate_frame( frame, flags );
        this._stack.push( frame );
        frame.style.zIndex = ui_mgr._zbase + this._next_z;
        this._next_z += 1;
        return frame;
    };

    //"upgrades" a DOM element into a managed display frame
    //  note: this does NOT place the frame under the control of the manager
    ui_mgr.prototype.decorate_frame = function( frame ) {
        var flags = arguments.length > 1 ? arguments[1] : ui_mgr._FLG_DEFAULT;
        _flag_init( frame );
        frame.flag_set( flags );
    };

    //called when we need to ensure display consistency
    ui_mgr.prototype._redraw = function() {
        var num_frames = this._stack.length;
        this._next_z = 0;
        for( var i = 0; i < num_frames; ++i ) {
            this._stack[ i ].style.zIndex = ui_mgr._ZBASE + i;
            this._next_z = i;
        }
    };

    //called when the container geometry changes (resizes)
    ui_mgr.prototype._update_geometry = function() {
        var vp_rect  = this._base.getBoundingClientRect();
        var abs_rect = null;
        //ZIH
    };


    /*------------------------------------------------------------------------
    Private Properties
    ------------------------------------------------------------------------*/

    /*------------------------------------------------------------------------
    Private Methods
    ------------------------------------------------------------------------*/

    function _flag_init( obj ) {
        obj._flags     = ui_mgr._FLG_DEFAULT;
        obj.flag_clear = flag_clear;
        obj.flag_get   = flag_get;
        obj.flag_set   = flag_set;
    }
    function flag_clear() {
        var flags = arguments.length > 0 ? arguments[ 0 ] : ui_mgr._FLG_MASK;
        //ZIH - perform clearing events here
        this._flags &= ~( flags & ui_mgr._FLG_MASK );
    }
    function flag_get() {
        var flags = arguments.length > 0 ? arguments[ 0 ] : ui_mgr._FLG_MASK;
        return this._flags & ( flags & ui_mgr._FLG_MASK );
    }
    function flag_set() {
        var flags = arguments.length > 0 ? arguments[0] : ui_mgr._FLG_DEFAULT;
        //ZIH - perform setting events here
        this._flags |= ( flags & ui_mgr._FLG_MASK );
    }


    return ns;
} )( hz.ui_mgr || {} );
