/*****************************************************************************
Hz Persistent User Configuration Module

Eliminates the need for server-side storage and/or cookies to store basic
user-defined configuration values.

Includes a feature to track configuration values that must be specified for
the configuration to register as valid.

Note: This requires browser support for long-term storage using the
window.localStorage object.

Example usage:

    var conf = hz.conf.init(
        { 'user' : null, 'theme' : 'blandish', 'font' : 'Arial' },
        [ 'user' ]
    );

    //first time using this module for a given client/site combination
    hz.conf.is_valid();                 //returns false
    hz.conf.is_specified( 'user' );     //returns false
    hz.conf.is_specified( 'theme' );    //returns true

    //at some point...
    hz.conf.set( 'user', 'Homer Simpson' );

    //at any time after that:
    hz.conf.is_valid();                 //returns true
    hz.conf.is_specified( 'user' );     //returns true

    //of course, you can fetch it:
    var user = conf.get( 'user' );

*****************************************************************************/

/*----------------------------------------------------------------------------
Hz Library Boilerplate
----------------------------------------------------------------------------*/
var hz = ( function( ns ) { return ns; } )( hz || {} );


/*----------------------------------------------------------------------------
Hz Configuration Submodule
----------------------------------------------------------------------------*/
hz.conf = ( function( ns ) {

    /*------------------------------------------------------------------------
    Public Properties
    ------------------------------------------------------------------------*/

    /*------------------------------------------------------------------------
    Public Methods
    ------------------------------------------------------------------------*/

    /**
     *  Retrieve a configuration value given the configuration key.
     *
     *  @param key    The configuration key for retrieval
     *  @return       The value of the configuration item
     *  @throws Error Requesting invalid key
     */
    ns.get = function( key ) {
        _check_store();
        if( key in _config.data ) {
            return _config.data[ key ];
        }
        throw new Error( _keyerrmsg + key );
    };


    /**
     *  Retrieve all configuration items as a key-value object.
     *
     *  @return The configuration items as a key-value object
     */
    ns.get_object = function( key ) {
        _check_store();
        return _config.data;
    };


    /**
     *  Initializes the configuration for usage.
     *
     *  @param defaults A key-value object of default configuration data
     *  @param required An optional list of keys that are considered required
     */
    ns.init = function( defaults ) {
        var required = arguments.length > 1 ? arguments[ 1 ] : [];

        //if not initialized, initialize module state from client storage
        _check_store();

        //(re)generate the meta data
        var new_meta = {};
        for( var key in defaults ) {
            new_meta[ key ] = {
                'type'      : typeof defaults[ key ],
                'value'     : defaults[ key ],
                'required'  : ( required.indexOf( key ) != -1 ),
                'specified' : false
            };
        }

        //scan the requested configuration layout
        for( var key in new_meta ) {

            //check for new fields in the requested configuration layout
            if( ( key in _config.meta ) == false ) {

                //load the default value into configured data
                _config.data[ key ] = new_meta[ key ].value;
            }
        }

        //scan the existing configuration layout
        for( var key in _config.meta ) {

            //check for obsolete fields in the stored configuration layout
            if( ( key in new_meta ) == false ) {

                //remove the data item from configured data
                delete _config.data[ key ];
            }

            //key existed in a previous configuration
            else {

                //sanity check value type
                if( new_meta[ key ].type === _config.meta[ key ].type ) {

                    //persist specification state
                    new_meta[ key ].specified = _config.meta[ key ].specified;
                }
            }
        }

        //reassign the meta data
        _config.meta = new_meta;

        //update what's stored in the client
        _update_store();
    };


    /**
     *  Determines if a particular configuration item has been specified.
     *
     *  @param key    The configuration key to check
     *  @return       True if the configuration item has been set before
     *  @throws Error Requesting invalid key
     */
    ns.is_specified = function( key ) {
        _check_store();
        if( key in _config.meta ) {
            return _config.meta[ key ].specified;
        }
        throw new Error( _keyerrmsg + key );
    };


    /**
     *  Determines if the entire configuration is in a valid state.
     *
     *  @return True if all required configuration items have been set before
     */
    ns.is_valid = function() {
        _check_store();
        for( var key in _config.meta ) {
            if( ( _config.meta[ key ].required  == true  )
             && ( _config.meta[ key ].specified == false ) ) {
                return false;
            }
        }
        return true;
    };


    /**
     *  Resets the entire configuration to the default values/states.
     *
     */
    ns.reset = function() {
        _check_store();
        for( var key in _config.meta ) {
            _config.data[ key ] = _config.meta[ key ].value;
            _config.meta[ key ].specified = false;
        }
        _update_store();
    };


    /**
     *  Sets a configuration value given its key.
     *
     *  @param key    The configuration key of the item to set
     *  @param value  The value of the item to store
     *  @throws Error Requesting invalid key
     */
    ns.set = function( key, value ) {
        _check_store();
        if( key in _config.meta ) {
            _config.meta[ key ].specified = true;
            _config.data[ key ] = value;
            _update_store();
        }
        else {
            throw new Error( _keyerrmsg + key );
        }
    };


    /*------------------------------------------------------------------------
    Private Properties
    ------------------------------------------------------------------------*/
    var _config      = { 'version' : 0, 'meta' : {}, 'data' : {} };
    var _initialized = false;
    var _keyerrmsg   = 'Invalid configuration key requested: ';
    var _rootkey     = 'hz.conf';


    /*------------------------------------------------------------------------
    Private Methods
    ------------------------------------------------------------------------*/

    /**
     *  Checks for the presence of configuration in the client.
     *
     */
    function _check_store() {
        //prevent hits to the client if we've already been initialized once
        if( _initialized == false ) {
            //attempt to pull the stored configuration from the client
            var store = window.localStorage.getItem( _rootkey );
            //nothing stored in client before now
            if( store == null ) {
                //store whatever is available in module state
                _update_store();
            }
            //client has the root key in storage
            else {
                //parse the stored data into module state
                _config = JSON.parse( store );
            }
            //put the module in the initialized state
            _initialized = true;
        }
    }


    /**
     *  Updates the data kept in the client's storage.
     *
     */
    function _update_store() {
        //serialize the configuration, and load into storage
        window.localStorage.setItem( _rootkey, JSON.stringify( _config ) );
    }


    return ns;
} )( hz.conf || {} );
