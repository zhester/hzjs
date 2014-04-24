/*****************************************************************************
Hz Segmented File Upload Module

TODO:
  - Convert diverted handlers to proper dispatchEvent()s
  - The manager needs to cleanly report the status of individual uploads
    as its progress is updating.  The UI should be allowed to see each
    file go up separately (with file name, size, loaded).
  - The individual uploads (and manager) need to support a suspend/resume
    feature.  This could be augmented with localStorage to continue
    distrupted uploads.
  - The individual uploads (and manager) need to support a cancel feature.

*****************************************************************************/

/*----------------------------------------------------------------------------
Hz Library Boilerplate
----------------------------------------------------------------------------*/
var hz = ( function( ns ) { return ns; } )( hz || {} );


/*----------------------------------------------------------------------------
Module Dependencies
----------------------------------------------------------------------------*/
/*?jspp { "include" : { "hz" : [ "data" ] } } ?*/


/*----------------------------------------------------------------------------
Hz Upload Submodule
----------------------------------------------------------------------------*/
hz.upload = ( function( ns ) {

    /*------------------------------------------------------------------------
    Public Properties
    ------------------------------------------------------------------------*/

    ns.manager = manager;           //expose the upload manager class
    ns.upload  = upload;            //expose the upload class

    /*------------------------------------------------------------------------
    Public Methods
    ------------------------------------------------------------------------*/


    /*------------------------------------------------------------------------
    Classes
    ------------------------------------------------------------------------*/

    /**
     *  Multiple file upload manager.  Allows user code to upload multiple
     *  files in one large process with little supervision.  This should also
     *  be used as the reference implementation for using the chunked upload
     *  system.
     *
     *  Example usage:
     *
     *      var file_input = document.getElementById( 'file_input' );
     *      var up = new hz.upload.manager( file_input.files );
     *      up.onload = function( e ) { alert( 'All files uploaded!' ); };
     *      up.upload_all();
     *
     *  @param file_list A FileList instance
     *  @param target    The base URL to the upload server handler
     */
    function manager() {

        //default the constructor parameters
        this.file_list = arguments.length > 0 ? arguments[ 0 ] : null;
        this.target    = arguments.length > 1 ? arguments[ 1 ] : null;

        //initialize the uploader object
        this.current    = -1;
        this.onabort    = null;
        this.onerror    = null;
        this.onload     = null;
        this.onprogress = null;
        this.ontimeout  = null;

        //overall transfer status tracking
        this.status = {
            'files_total' : 0,
            'bytes_total' : 0,
            'files_sent'  : 0,
            'bytes_sent'  : 0
        };

        //check for a specified file list
        if( this.file_list.length > 0 ) {

            //initialize the transfer status information
            this.status.files_total = this.file_list.length;
            for( var i = 0; i < this.status.files_total; ++i ) {
                this.status.bytes_total += this.file_list[ i ].size;
            }
        }

    }


    /**
     *  Initiates an upload of all files known to the uploader object.
     *
     */
    manager.prototype.upload_all = function() {

        //reset the current file index
        this.current = -1;

        //initialize the multi-file upload status
        this.status.files_total = this.file_list.length;
        this.status.bytes_total = 0;
        for( var i = 0; i < this.status.files_total; ++i ) {
            this.status.bytes_total += this.file_list[ i ].size;
        }
        this.status.files_sent = 0;
        this.status.bytes_sent = 0;

        //upload the next (first) file in the list
        this.upload_next();

    };


    /**
     *  Initiates an upload of the next file in the list.
     *
     */
    manager.prototype.upload_next = function() {

        //increment the current file index
        this.current += 1;

        //bounds check the current file index
        if( this.current < this.file_list.length ) {

            //create the upload object for the current file
            var up = this.create_upload( this.file_list[ this.current ] );

            //set an object context variable for closed event handlers
            var context = this;

            //pass-through event handlers
            up.onabort   = this.onabort;
            up.onerror   = this.onerror;
            up.ontimeout = this.ontimeout;

            //handle the completion of this upload
            up.onload = function( e ) {

                //update status
                context.status.files_sent += 1;
                context.status.bytes_sent += e.loaded;

                //attempt to upload the next file in the list (if there is one)
                context.upload_next();
            };

            //handle progress updates during the upload
            up.onprogress = function( e ) {
                if( context.onprogress != null ) {
                    var loaded = e.loaded + context.status.bytes_sent;
                    context.onprogress(
                        {
                            'current'          : this.current,
                            'uploaded'         : this.status.files_sent,
                            'lengthComputable' : true,
                            'loaded'           : loaded,
                            'total'            : context.status.bytes_total
                        }
                    );
                }
            };

            //initiate the chunked upload for this file
            up.send();
        }

        //multi-file upload completed, and there's an onload handler
        else if( this.onload != null ) {
            this.onload(
                {
                    'target'           : this,
                    'lengthComputable' : true,
                    'loaded'           : this.status.bytes_sent,
                    'total'            : this.status.bytes_total
                }
            );
        }

    };


    /**
     *  Creates an upload object for the specified file instance.
     *
     *  @param file   A File instance to upload
     *  @param target The base URL to the upload server handler (optional)
     *  @return       An upload object instance that can upload the file,
     *                or null on failure
     */
    manager.prototype.create_upload = function( file ) {

        //set the base target URL
        var target = arguments.length > 1 ? arguments[ 1 ] : this.target;

        //create the upload object and return it
        return new upload( file, target );
    };


    /**
     *  Establishes a chunked file upload for a single file.  The file must be
     *  an instance of a File object.  The user can subscribe to the four
     *  typical XHR events (abort, error, load, progress) using property-style
     *  assignment.
     *
     *  Example usage:
     *      var file_input = document.getElementById( 'file_input' );
     *      var up = new hz.upload.upload(
     *          file_input.files[ 0 ],
     *          'http://example.com/upload_handler.php'
     *      );
     *      up.onprogress = function( status ) {
     *          console.log( status.loaded + '/' + status.total + ' bytes' );
     *      };
     *      up.onload = function( status ) {
     *          console.log( status.loaded + '/' + status.total + ' bytes' );
     *      };
     *      up.send();
     *
     *  @param file   The File instance representing the file to send
     *  @param target The target URL that can handle chunked uploads
     */
    function upload( file, target ) {

        //initialize the upload object
        this.chunk_size  = 8 * 1024 * 1024;
        this.file        = file;
        this.onabort     = null;
        this.onerror     = null;
        this.onload      = null;
        this.onprogress  = null;
        this.ontimeout   = null;
        this.reader      = new FileReader();
        this.to_send     = 0;
        this.target      = target;
        this.xhr         = new XMLHttpRequest();
        this.xhr.timeout = 5 * 60 * 1000;

        //transfer status tracking
        this.status = {
            bytes_total : file.size,
            bytes_sent  : 0
        };

        //set an object context variable for closed event handlers
        var context = this;

        //pass-through event handlers
        this.xhr.onabort = function( event ) {
            if( context.onabort != null ) {
                context.onabort( event );
            }
        };
        this.xhr.onerror = function( event ) {
            if( context.onerror != null ) {
                context.onerror( event );
            }
        };
        this.xhr.ontimeout = function( event ) {
            if( context.ontimeout != null ) {
                context.ontimeout( event );
            }
        }

        //progress is re-mapped to the overall upload (not just a chunk)
        this.xhr.onprogress = function( event ) {
            if( context.onprogress != null ) {
                var loaded = event.loaded + context.status.bytes_sent;
                context.onprogress(
                    {
                        'lengthComputable' : true,
                        'loaded'           : loaded,
                        'total'            : context.status.bytes_total
                    }
                );
            }
        };

        //load is re-mapped to the overall upload (not just a chunk)
        this.xhr.onload = hz.data.make_jdi_handler(
            function( data ) {

                //check the transfer for problems reported by the server
                if( data.status != 0 ) {

                    //if the error handler is available...
                    if( context.onerror != null ) {

                        //indicate an error with some custom fields
                        context.onerror(
                            {
                                'lengthComputable' : false,
                                'loaded'           : 0,
                                'total'            : 0,
                                'message'          : data.payload,
                                'bytes_sent'       : context.to_send
                            }
                        );
                    }
                }

                //the transfer appears successful
                else {

                    //increment the total bytes sent
                    context.status.bytes_sent += context.to_send;

                    //send the next chunk
                    context.send();
                }
            }
        );

        //the file reader load event signals when it's ready to upload
        this.reader.onload = function( event ) {

            var qa = context.target.indexOf( '?' ) == -1 ? '?' : '&';

            //construct the URI for the POST request
            var uri = context.target + qa
                +  'name='    + encodeURIComponent( context.file.name )
                + '&type='    + encodeURIComponent( context.file.type )
                + '&time_ms=' + context.file.lastModifiedDate.getTime()
                + '&size='    + context.status.bytes_total
                + '&offset='  + context.status.bytes_sent
                + '&length='  + event.target.result.length;

            //prepare the proper POST request
            context.xhr.open( 'POST', uri, true );
            context.xhr.setRequestHeader(
                'Content-Type',
                'application/octet-stream'
            );
            //note for future generations:
            //  webkit does not allow a script to set Content-Length and
            //  Connection headers for XHR.  If it becomes an issue in the
            //  future, the server will have to deal with what it decides.

            //send the file segment in a POST request
            context.xhr.sendAsBinary( event.target.result );
        };

    }


    /**
     *  Sends the next part of the file to the server.
     *
     */
    upload.prototype.send = function() {

        //determine the number of remaining bytes to send
        var left = this.status.bytes_total - this.status.bytes_sent;

        //check if there are bytes left to send
        if( left > 0 ) {

            //calculate the bytes to send in this transfer
            this.to_send = left > this.chunk_size ? this.chunk_size : left;

            //initiate a file read for the number of bytes to send
            //  -- this is used to complement xhr.sendAsBinary()
            this.reader.readAsBinaryString(

                //specify the part of the file that should be sent
                //ZIH - Chrome may not support file.slice(),
                //      might have to duck-check for file.webkitSlice()
                this.file.slice(
                    this.status.bytes_sent,
                    ( this.status.bytes_sent + this.to_send )
                )
            );
        }

        //there are no more bytes left to send, check for load handler
        else if( this.onload != null ) {

            //fire the load event
            this.onload(
                {
                    'target'           : this,
                    'lengthComputable' : true,
                    'loaded'           : this.status.bytes_sent,
                    'total'            : this.status.bytes_total
                }
            );
        }

    };


    /*------------------------------------------------------------------------
    Private Properties
    ------------------------------------------------------------------------*/

    /*------------------------------------------------------------------------
    Private Methods
    ------------------------------------------------------------------------*/


    return ns;
} )( hz.upload || {} );


/*----------------------------------------------------------------------------
Attempting to add support for sendAsBinary() (thanks, webkit).
----------------------------------------------------------------------------*/

if( ( 'sendAsBinary' in XMLHttpRequest.prototype ) == false ) {
    XMLHttpRequest.prototype.sendAsBinary = function( data ) {
        var num_bytes = data.length;
        var uint8_data = new Uint8Array( num_bytes );
        for( var i = 0; i < num_bytes; ++i ) {
            uint8_data[ i ] = data.charCodeAt( i ) & 0xFF;
        }
        this.send( uint8_data );
    };
}
