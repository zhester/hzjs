/*****************************************************************************
Hz Data Interaction Module

This module combines consistent data protocols with element generation for the
purpose of displaying for and interacting with the user.

Remote record sets are expected to follow the following basic layout:

{
    'status'  : 0,
    'message' : 'message',
    'payload' : {
        'fields' : [
            'id',
            'sid',
            'name',
            'color'
        ],
        'records' : [
            [ 1, 'adam',    'Adam',    'red'   ],
            [ 2, 'baker',   'Baker',   'green' ],
            [ 3, 'charlie', 'Charlie', 'blue'  ]
        ],
        'info' : {
            'offset' : 0,
            'length' : 3,
            'total'  : 3,
            'parent' : {
                'set_id'  : 1,
                'path_id' : 'people',
                'name'    : 'People'
            },
            'meta' : {
                'set_id'  : 'id',
                'path_id' : 'sid',
                'name'    : 'name'
            }
        }
    }
}

*****************************************************************************/

/*----------------------------------------------------------------------------
Hz Library Boilerplate
----------------------------------------------------------------------------*/
var hz = ( function( ns ) { return ns; } )( hz || {} );


/*----------------------------------------------------------------------------
Hz Data Interaction Submodule
----------------------------------------------------------------------------*/
hz.data = ( function( ns ) {

    /*------------------------------------------------------------------------
    Public Properties
    ------------------------------------------------------------------------*/

    ns.record_map = record_map;     //expose the record_map class
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
     *  @return       The appended table element of the report
     */
    ns.append_report = function( parent, data ) {
        var map = arguments.length > 2 ? arguments[ 2 ] : null;
        var r = new report( data, map );
        parent.appendChild( r.table );
        return r.table;
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
        var xhr = new XMLHttpRequest();
        xhr.timeout = 60 * 1000;
        xhr.onabort = function( event ) {
            throw new Error( 'Request aborted.' );
        };
        xhr.onerror = function( event ) {
            throw new Error( 'Error encountered loading ' + uri );
        };
        xhr.ontimeout = function( event ) {
            throw new Error( 'Request timed out.' );
        };
        xhr.onload = function( event ) {
            var rctype = xhr.getResponseHeader( 'content-type' );
            var ectype = 'application/json';
            if( rctype.substring( 0, ectype.length ) != ectype ) {
                throw new Error(
                    'Expected ' + ectype + ' data, received '
                    + rctype + ' data from server.'
                );
            }
            handler( JSON.parse( xhr.responseText ) );
        };
        xhr.open( 'GET', uri, true );
        xhr.send( null );
    };


    /*------------------------------------------------------------------------
    Classes
    ------------------------------------------------------------------------*/

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

    /*------------------------------------------------------------------------
    Private Methods
    ------------------------------------------------------------------------*/


    return ns;
} )( hz.data || {} );
