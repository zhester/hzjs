/*****************************************************************************
Hz Data Interaction Module

This module combines consistent data protocols with element generation for the
purpose of displaying for and interacting with the user.

*****************************************************************************/

/*----------------------------------------------------------------------------
Hz Library Boilerplate
----------------------------------------------------------------------------*/
var hz = ( function( ns ) { return ns; } )( hz || {} );


/*----------------------------------------------------------------------------
Module Dependencies
----------------------------------------------------------------------------*/
/*?jspp { "include" : { "hz" : [ "lang", "util" ] } } ?*/


/*----------------------------------------------------------------------------
Hz Data Interaction Submodule
----------------------------------------------------------------------------*/
hz.data = ( function( ns ) {

    /*------------------------------------------------------------------------
    Public Properties
    ------------------------------------------------------------------------*/

    ns.record_map = record_map;     //expose the record_map class
    ns.record_set = record_set;     //expose the record_set class
    ns.report     = report;         //expose the report class

    /*------------------------------------------------------------------------
    Public Methods
    ------------------------------------------------------------------------*/

    /**
     *  Creates and appends a report table to the given element.
     *
     *  @param parent The parent element to which the report is appended
     *  @param data   The 'payload' of the data to use for the report
     *  @param map    Optional record mapping/modifying function
     *  @return       The report manager object that was created
     */
    ns.append_report = function( parent, data ) {
        var map = arguments.length > 2 ? arguments[ 2 ] : null;
        var r = new report( data, map );
        hz.util.append( parent, r.table );
        return r;
    };


    /**
     *  Creates and appends a report table to the given element.  The report
     *  data is requested over HTTP.
     *
     *  @param parent   The parent element to which the report is appended
     *  @param uri      The URI to request for a record set response
     *  @param map      Optional record mapping/modifying function
     *  @param callback Optional callback after the report is generated
     */
    ns.append_report_uri = function( parent, uri ) {
        var map      = arguments.length > 2 ? arguments[ 2 ] : null;
        var callback = arguments.length > 3 ? arguments[ 3 ] : null;
        ns.fetch_object(
            uri,
            function( data ) {
                if( data.status == 0 ) {
                    ns.append_report( parent, data.payload, map );
                }
                else {
                    var p = document.createElement( 'p' );
                    p.className = 'data_error';
                    p.appendChild(
                        document.createTextNode( 'Error: ' + data.message )
                    );
                    parent.appendChild( p );
                }
                if( callback != null ) {
                    callback( data );
                }
            }
        );
    };


    /**
     *  Create and append a tree-like sequence of lists to the given element.
     *
     *  @param parent The parent element to which the tree is appended
     *  @param data   The data to represent as a tree
     *  @param depth  Optional tree depth (not for outside usage)
     *  @return       The element that was appended to the parent
     */
    ns.append_tree = function( parent, data ) {
        var depth = arguments.length > 2 ? arguments[ 2 ] : 0;
        var recrs = depth < 20 ? true : false;
        depth += 1;
        var list, item, label;
        //ordered list of data
        if( data instanceof Array ) {
            list = document.createElement( 'ol' );
            if( depth == 1 ) { list.className = 'tree'; }
            for( var i = 0; i < data.length; ++i ) {
                item = document.createElement( 'li' );
                ns.append_tree( item, data[ i ], depth );
                list.appendChild( item );
            }
            parent.appendChild( list );
            return list;
        }
        //key-value dictionary of data
        else if( typeof data === 'object' ) {
            list = document.createElement( 'ul' );
            if( depth == 1 ) { list.className = 'tree'; }
            for( var key in data ) {
                item = document.createElement( 'li' );
                label = document.createElement( 'span' );
                label.appendChild( document.createTextNode( key + ' : ' ) );
                item.appendChild( label );
                ns.append_tree( item, data[ key ], depth );
                list.appendChild( item );
            }
            parent.appendChild( list );
            return list;
        }
        //assume data is something else that can be appended
        else {
            return hz.util.append( parent, data );
        }
    };


    /**
     *  Fetch a standard data object from a remote host.
     *
     *  @param uri     The URI to request for data
     *  @param handler The handler to call with the data
     */
    ns.fetch_object = function( uri, handler ) {
        var xhr = _create_json_request( handler );
        xhr.open( 'GET', uri, true );
        xhr.timeout = 60 * 1000;
        xhr.setRequestHeader( 'Accept', _http_accept );
        xhr.send( null );
    };


    /**
     *  Re-usable XHR response handler builder for JDI responses.
     *  To use this, assign the return value as the event handler.
     *  Use this when you don't necessarily trust the host, and want a lot of
     *  useful validation on the response.
     *
     *  Example:
     *      var xhr = new XMLHttpRequest();
     *      xhr.addEventListener(
     *          'load',
     *          hz.data.make_jdi_handler(
     *              function( data ) {
     *                  console.log( JSON.stringify( data ) );
     *              }
     *          )
     *      );
     *
     *  @param callback The function to call with the parsed response.
     *                  This function will receive an object containing the
     *                  complete JDI response as its only argument.
     */
    ns.make_jdi_handler = function( callback ) {
        return function( event ) {
            var rctype = this.getResponseHeader( 'content-type' )
            rctype = hz.util.base_ctype( rctype );
            switch( rctype ) {
                case 'application/json':
                    try {
                        var data = JSON.parse( this.responseText );
                    }
                    catch( error ) {
                        var text = this.responseText;
                        if( text.length > 256 ) {
                            text = text.substring( 0, 256 ) + '...';
                        }
                        throw new Error(
                            'Unable to parse JSON response: ' + text
                        );
                    }
                    break;
                case 'text/html':
                case 'text/plain':
                    data = {
                        'status'  : 199,
                        'message' : 'Unexpected document in response.',
                        'payload' : this.responseText
                    };
                    break;
                default:
                    throw new Error(
                        'Unexpected content type in response ('+rctype+').'
                    );
                    break;
            }
            callback( data );
        };
    };


    /**
     *  Performs a POST request containing a JSON-encoded object.
     *
     *  @param uri     The URI to which the request is sent
     *  @param data    The data to send in the request body
     *  @param handler The handler to call with the response
     */
    ns.send_object = function( uri, data, handler ) {
        var xhr = _create_json_request( handler );
        xhr.open( 'POST', uri, true );
        xhr.timeout = 60 * 1000;
        xhr.setRequestHeader( 'Accept', _http_accept );
        xhr.setRequestHeader( 'Content-Type', 'application/json' );
        xhr.send( JSON.stringify( data ) );
    };


    /*------------------------------------------------------------------------
    Classes
    ------------------------------------------------------------------------*/

    /**
     *  Provides convenience methods for managing a structured record set (the
     *  'payload' used by this module).  This object can be substituted in
     *  any situation where the data-only object can be used.
     *
     *  @param data The record set data payload
     */
    function record_set( data ) {
        this.ASCEND  = false;
        this.DESCEND = true;
        this._sorts  = new Array( data.fields.length );
        for( var key in data ) {
            this[ key ] = data[ key ];
        }
    }

    /**
     *  Determines the type of data stored in a particular field.
     *
     *  @param field The field index or name to interrogate
     *  @return      The ECMA-style type string (e.g. typeof variable)
     */
    record_set.prototype.field_type = function( field ) {
        var check = this._field_index( field );
        if( check == -1 ) { return 'undefined'; }
        for( var i = 0; i < this.records.length; ++i ) {
            if( this.records[ i ][ check ] !== null ) {
                return typeof this.records[ i ][ check ];
            }
        }
        return 'undefined';
    };

    /**
     *  Inserts the given field into the record set.
     *
     *  @param name     The display name of the field to insert
     *  @param position The position in the field list to insert
     *  @param value    The default value of the new field in the records
     */
    record_set.prototype.insert_field = function( name ) {
        var position = arguments.length > 1
            ? arguments[ 1 ] : this.fields.length;
        var value = arguments.length > 2 ? arguments[ 2 ] : null;
        this.fields.splice( position, 0, name );
        this._sorts.splice( position, 0, undefined );
        for( var i = 0; i < this.records.length; ++i ) {
            this.records[ i ].splice( position, 0, value );
        }
    };

    /**
     *  Removes a given field from the record set.
     *
     *  @param field The position or name of the field to remove
     */
    record_set.prototype.remove_field = function( field ) {
        var remove = this._field_index( field );
        if( remove == -1 ) { return; }
        this.fields.splice( remove, 1 );
        this._sorts.splice( remove, 1 );
        for( var i = 0; i < this.records.length; ++i ) {
            this.records[ i ].splice( remove, 1 );
        }
    };

    /**
     *  Record sorting.
     *
     *  Note: It's best to sort the records on the host, but this can help in
     *  some use cases.
     *
     *  @param field The field upon which to sort the records
     *  @param desc  True to set descending order for the given field,
     *               false to set ascending order, null or unspecified will
     *               enable sorting (ascending) if not previously enabled,
     *               otherwise, it will toggle the current sorting
     */
    record_set.prototype.sort = function( field ) {
        var desc = arguments.length > 1 ? arguments[ 1 ] : null;
        var fi   = this._field_index( field );
        if( fi == -1 ) { return; }
        //check to see if this field has ever been sorted before
        if( ( typeof this._sorts[ fi ] === 'undefined' )
         || ( this._sorts[ fi ] === null               ) ) {
            //sort as requested, if not given, set ascending order
            this._sorts[ fi ] = desc !== null ? desc : this.ASCEND;
        }
        //this field has been sorted before
        else {
            //sort as requested, if not given, toggle sort order
            this._sorts[ fi ] = desc !== null ? desc : !this._sorts[ fi ];
        }
        //determine the sorting comparison function
        var sort_type = this.field_type( fi );
        var sort_dir  = this._sorts[ fi ] == true ? '_dsc' : '_asc';
        var sort_fun  = '_sort_' + sort_type + sort_dir;
        if( sort_fun in this ) {
            this.records.sort( this[ sort_fun ]( fi ) );
        }
    };

    /**
     *  Determines the position in a record array of a given field.  Allows
     *  the flexibility to pass in the position value (when the user already
     *  has it), and still remain useful.  It will also bounds check the
     *  index.
     *
     *  @param field The field name or index number
     *  @return      The field's index number, or -1 if the field isn't found
     */
    record_set.prototype._field_index = function( field ) {
        var index;
        if( typeof field === 'number' ) {
            index = field;
        }
        else {
            index = this.fields.indexOf( field );
        }
        if( ( index >= 0 ) && ( index < this.fields.length ) ) {
            return index;
        }
        return -1;
    };

    /**
     *  Generates the comparison function used to sort numeric values in
     *  ascending order.
     *
     *  @param i The field index upon which to sort
     *  @return  The comparison function used in an array sort
     */
    record_set.prototype._sort_number_asc = function( i ) {
        return function( a, b ) { return a[ i ] - b[ i ]; };
    };

    /**
     *  Generates the comparison function used to sort numeric values in
     *  descending order.
     *
     *  @param i The field index upon which to sort
     *  @return  The comparison function used in an array sort
     */
    record_set.prototype._sort_number_dsc = function( i ) {
        return function( a, b ) { return b[ i ] - a[ i ]; };
    };

    /**
     *  Generates the comparison function used to sort string values in
     *  ascending order.
     *  Note: This also protects against null values which have a hard time
     *        being compared to strings.
     *
     *  @param i The field index upon which to sort
     *  @return  The comparison function used in an array sort
     */
    record_set.prototype._sort_string_asc = function( i ) {
        return function( a, b ) {
            var c = a[ i ] === null ? '' : a[ i ];
            var d = b[ i ] === null ? '' : b[ i ];
            return c.localeCompare( d );
        };
    };

    /**
     *  Generates the comparison function used to sort string values in
     *  descending order.
     *  Note: This also protects against null values which have a hard time
     *        being compared to strings.
     *
     *  @param i The field index upon which to sort
     *  @return  The comparison function used in an array sort
     */
    record_set.prototype._sort_string_dsc = function( i ) {
        return function( a, b ) {
            var c = a[ i ] === null ? '' : a[ i ];
            var d = b[ i ] === null ? '' : b[ i ];
            return d.localeCompare( c );
        };
    };


    /**
     *  Attempts to pretty up field names.
     *
     */
    record_set.prototype.title_fields = function() {
        var id_fields = [ 'id', 'pid', 'etid', 'sid' ];
        this.fields.transform(
            function( f ) {
                if( id_fields.indexOf( f ) != -1 ) {
                    return f.toUpperCase();
                }
                return hz.lang.title_case( f );
            }
        );
    };


    /**
     *  Creates a report object to generate tables of data.
     *
     *  @param data The data 'payload' to use for the report
     *  @param map  Optional record mapping/modifying function
     */
    function report( data ) {
        this.data   = data;
        this.mapper = new record_map( this.data.fields, this.data.info );
        if( ( arguments.length > 1 ) && ( arguments[ 1 ] != null ) ) {
            this.mapper.modify = arguments[ 1 ];
        }
        this.table = document.createElement( 'table' );
        this.table.className = 'data';
        this.tbody = document.createElement( 'tbody' );
        this._append( this.data.fields, 'th' );
        var num_records = this.data.records.length;
        for( var i = 0; i < num_records; ++i ) {
            this.append( this.data.records[ i ] );
        }
        this.table.appendChild( this.tbody );
    }

    /**
     *  Appends a record to the report.
     *
     *  @param record The record data to append
     *  @return       The row element appended (null if not appended)
     */
    report.prototype.append = function( record ) {
        if( this.mapper.modify( record ) == true ) {
            return this._append( record );
        }
        return null;
    };

    /**
     *  Internal record append method.
     *
     *  @param record  The modified row to append to the record
     *  @param heading Optionally use heading cells (true == 'th')
     *  @return        The row element that was appended
     */
    report.prototype._append = function( record ) {
        var tag = ( arguments.length > 1 ) && arguments[ 1 ] ? 'th' : 'td';
        var td;
        var tr = document.createElement( 'tr' );
        for( var i = 0; i < record.length; ++i ) {
            td = document.createElement( tag );
            hz.util.append( td, record[ i ] );
            tr.appendChild( td );
        }
        this.tbody.appendChild( tr );
        return tr;
    };


    /**
     *  Allows a user to customize how data is inserted into reports.
     *
     *  @param fields The list of fields in the report
     *  @param info   Optional record set 'info' object
     */
    function record_map( fields ) {
        this.info    = arguments.length > 1 ? arguments[ 1 ] : {};
        this.fields  = fields;
        this.indexes = {};
        for( var i = 0; i < fields.length; ++i ) {
            this.indexes[ fields[ i ] ] = i;
        }
    }

    /**
     *  Instances of record_map objects must define their own modify method to
     *  make changes to data in the record.  The record is an array, and is,
     *  therefore, passed by reference.  Modifying the array changes the
     *  contents used in the report.
     *
     *  @param record A single record from the data set
     *  @return       True to insert, false to discard before insertion
     */
    record_map.prototype.modify = function( record ) {
        /*
        Example:
            var col = this.indexes[ 'date' ];
            record[ col ] = my_date_formatter( record[ col ] );
        */
        return true;
    };


    /*------------------------------------------------------------------------
    Private Properties
    ------------------------------------------------------------------------*/

    var _http_accept = 'application/json,text/html;q=0.2,*/*;q=0.1';
                                    //HTTP Accept header for JSON requests


    /*------------------------------------------------------------------------
    Private Methods
    ------------------------------------------------------------------------*/

    /**
     *  Simplifies repetitive construction of the XHR object.
     *
     *  @param json_handler The function to call with the JSON response
     *  @return             An XMLHttpRequest object ready for use
     */
    function _create_json_request( json_handler ) {
        var xhr = new XMLHttpRequest();
        xhr.onabort = function( event ) {
            throw new Error( 'Request aborted.' );
        };
        xhr.onerror = function( event ) {
            throw new Error( 'Request error.' );
        };
        xhr.ontimeout = function( event ) {
            throw new Error( 'Request timed out.' );
        };
        xhr.onload = ns.make_jdi_handler( json_handler );
        return xhr;
    }


    return ns;
} )( hz.data || {} );
