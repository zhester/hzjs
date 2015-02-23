/*****************************************************************************
Generic Canvas Management

*****************************************************************************/

/*----------------------------------------------------------------------------
Library Boilerplate
----------------------------------------------------------------------------*/
var hz = ( function( ns ) { return ns; } )( hz || {} );

/*----------------------------------------------------------------------------
Module Dependencies
----------------------------------------------------------------------------*/
/*?jspp { "include" : { "hz" : [] } } ?*/

/*----------------------------------------------------------------------------
Generic Canvas Management Submodule
----------------------------------------------------------------------------*/
hz.canvas = ( function( ns ) {

    /*------------------------------------------------------------------------
    Public Properties
    ------------------------------------------------------------------------*/

    ns.StyleRegistry = StyleRegistry;

    /*------------------------------------------------------------------------
    Public Methods
    ------------------------------------------------------------------------*/

    /*------------------------------------------------------------------------
    Classes
    ------------------------------------------------------------------------*/

    /**
     * Manages styles for a canvas-based module/application.
     *
     * @param styles Auto-load initial styles from object or JSON string
     */
    function StyleRegistry() {
        this.styles = {};
        if( arguments.length > 0 ) {
            this.load_styles( arguments[ 0 ] );
        }
        this.contexts = [];
    }


    /**
     * Maps a style group object onto the context object.
     *
     * @param context The target context to have styles applied
     * @param group   The source style group of style rules
     */
    StyleRegistry.prototype.apply_group = function( context, group ) {

        //apply the styles from the group to the context
        for( var key in group ) {
            if( group.hasOwnProperty( key ) == false ) { continue; }

            //keys that start with "set" are style methods
            if( key.substr( 0, 3 ) == 'set' ) {
                context[ key ]( group[ key ] );
            }

            //normal keys are properties
            else {
                context[ key ] = group[ key ];
            }
        }
    };


    /**
     * Begins the use of a set of style rules given their unique name in the
     * registry.
     *
     * @param context The target canvas' rendering context
     * @param name    The style group's name to begin
     * @throws        ReferenceError if the name is not in the registry
     */
    StyleRegistry.prototype.begin_style = function( context, name ) {

        //make sure we have the requested style group
        if( ( name in this.styles ) == false ) {
            throw new ReferenceError( 'Invalid style group "' + name + '"' );
        }

        //push this context onto the stack of known contexts
        this.contexts.push( context );

        //push the context's state onto its state stack
        context.save();

        //apply the styles to the context
        this.apply_group( context, this.styles[ name ] );
    };


    /**
     * Begins the use of potentially multiple style rule groups given a list
     * of non-critical style group names.
     *
     * @param context The target canvas' rendering context
     * @param groups  The list of style group names to attempt to apply
     */
    StyleRegistry.prototype.begin_style_auto = function( context, groups ) {

        //support objects that define a `style_auto` property
        if( ( typeof groups == 'object' ) && ( 'style_auto' in groups ) ) {
            this.begin_style_auto( context, groups.style_auto );
            return;
        }

        //if the user passes a string, it should be a space-separated list
        if( typeof groups == 'string' ) {
            groups = groups.split( ' ' );
        }

        //push the context onto our context stack
        this.contexts.push( context );

        //push the context's state onto its stack
        context.save();

        //scan the user's list of groups for any known style groups
        for( var i = 0, n = groups.length; i < n; ++i ) {

            //check group name
            if( groups[ i ] in this.styles ) {

                //apply the styles to the context
                this.apply_group( context, this.styles[ groups[ i ] ] );
            }
        }
    };


    /**
     * Ends the last-most style settings, restoring the styling to the state
     * it was in before the last `begin_style()` request.
     *
     * @param
     * @return
     * @throws
     */
    StyleRegistry.prototype.end_style = function() {

        //verify there's something to end
        if( this.contexts.length < 1 ) {
            throw new Error( 'No more style states to end.' );
        }

        //remove the last context from the context stack
        var context = this.contexts.pop();

        //restore its state
        context.restore();
    };


    /**
     * Retrieves a style group from the registry.
     *
     * @param name The name of the style group to retrieve
     * @return     The style group as an object
     * @throws     ReferenceError if the name does not exist in the registry
     */
    StyleRegistry.prototype.get = function( name ) {

        if( ( name in this.styles ) == false ) {
            throw new ReferenceError( 'Invalid style group "' + name + '"' );
        }

        return this.styles[ name ];
    };


    /**
     * Loads style information from an object or JSON string.
     *
     * The style definitions come in the form of name-object mappings.
     * Each name is a unique identifier for the style rule group.  Each object
     * represents a set of style rules that can be applied to a canvas'
     * context.  The name of each property is the same as the context's
     * property name.
     *
     * @param styles The style definitions as an object or JSON string
     */
    StyleRegistry.prototype.load_styles = function( styles ) {
        if( typeof styles == 'string' ) {
            styles = JSON.parse( styles );
        }
        for( var name in styles ) {
            if( styles.hasOwnProperty( name ) == false ) { continue; }
            this.styles[ name ] = styles[ name ];
        }
    };


    /**
     * Adds/updates a style group in the registry.
     *
     * @param name The name of the style group to add or update
     * @param defs An object containing the style definitions
     */
    StyleRegistry.prototype.set = function( name, defs ) {
        this.styles[ name ] = defs;
    };


    /**
     * Provides the standard serialization interface for registry instances.
     *
     * @return A JSON string representing the style rule groups
     */
    StyleRegistry.prototype.toString = function() {
        return JSON.stringify( this.styles );
    };


    /*------------------------------------------------------------------------
    Private Properties
    ------------------------------------------------------------------------*/

    /*------------------------------------------------------------------------
    Private Methods
    ------------------------------------------------------------------------*/


    return ns;
} )( hz.canvas || {} );

