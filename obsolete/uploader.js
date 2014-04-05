/*****************************************************************************
    Chunked, High-Volume File Uploader

    Problem: Sending very large files over HTTP presents several challenges
    (forgetting, for a moment, the fact that HTTP isn't designed for large
    file transfers).  HTTP is most typically a server-to-client transaction.
    Client-to-server transactions tend to be very small (just basic request
    information, and the occasional form submission).  Even with modern
    server infrastructure, accepting a one-time request that contains a
    message more than 10 MB is extraordinary.  Scalability to a large number
    of concurrent uploaders is a primary concern.  However, what if the
    number of concurrent uploaders is extremely limited (e.g. in a
    corporate environment)?  Now, we can attempt to upload massive files by
    increasing the memory limits and security thresholds on the server.
    However, this is not a very portable (or forward-thinking) solution.
    The better option is to send large files to the server in parts.  That
    way the basic server configuration (software and hardware) doesn't have
    to change to handle very large files.

    Solution: The immediate solution is to create a one-off HTTP client
    capable of accepting a large file from the user, and making a series of
    requests to the server; iteratively transferring the entire file.

    However, this system attempts to explore a browser-based approach using
    some of the new (HTML5-based) tools available in modern web browsers.
    The goal is to not require any plugins (custom or ubiquitous), while
    still providing strong upload feedback to the user.

    The critical link to getting this to work entirely in JavaScript is the
    new Blob/File and FileReader objects.  The capability to read parts of a
    file from the user's file system (using the Blob.slice() method) gives us
    everything we need to send files that are potentially larger than the
    memory available to the web browser (not to mention, each web server
    handler process).

    Even better, Firefox gives us a relatively efficient mechanism of moving
    binary data between a FileReader object and an XMLHttpRequest object via
    the FileReader.readAsBinaryString() and XMLHttpRequest.sendAsBinary()
    methods.

    Note: This implementation has not been tested on any browser other than
    Firefox (version 24.0 as of the time of this comment).  I would like, at
    a minimum, to also support webkit-based browsers.

    Note: This system requires server-side feature support.  The server must
    support a simple POST interface that allows files to be uploaded in parts
    and reassembled on the server's file system.  The protocol is as follows:

        The client submits a POST request to the following URI (separated by
        lines for readability):

            <target>?name=<file_name>
                &time_ms=<file_mtime(ms)>
                &size=<file_size>
                &offset=<current_offset>
                &length=<current_length>

        The body of the POST request contains the raw binary data of the part
        of the file being uploaded (Content-Type: application/octet-stream).
        These parts are iteratively submitted to the server until the entire
        file has been sent.

        Upon successful receipt of a file part, the server must respond to the
        POST request with a simple JSON (Content-Type: application/json)
        message:

            {
                "name"    : "<file_name>",
                "time_ms" : <file_mtime(ms)>,
                "size"    : <file_size>,
                "offset"  : <current_offset>,
                "length"  : <current_length>
            }

        This allows the client script to verify everything was received before
        sending the next file part.  It's up to the server to decide how/when
        to reassemble the uploaded file.

        The maximum size of each file part can be set in the upload object.
        The property is named "chunk_size".
*****************************************************************************/


/**
 *  Multiple file upload manager.  Allows user code to upload multiple files
 *  in one large process with little supervision.  This should also be used as
 *  the reference implementation for using the chunked upload system.
 *
 *  Example usage:
 *
 *      var file_input = document.getElementById( 'file_input' );
 *      var up = new uploader( file_input.files );
 *      up.onload = function( e ) { alert( 'All files uploaded!' ); };
 *      up.upload_all();
 *
 *  @param file_list    A FileList instance
 *  @param target       The base URL to the upload server handler
 */
function uploader() {

    //initialize the uploader object
    this.current    = -1;
    this.file_list  = null;
    this.onabort    = null;
    this.onerror    = null;
    this.onload     = null;
    this.onprogress = null;
    this.ontimeout  = null;
    this.target     = null;

    //overall transfer status tracking
    this.status = {
        files_total: 0,
        bytes_total: 0,
        files_sent:  0,
        bytes_sent:  0
    };

    //check for a specified file list
    if( arguments.length > 0 ) {
        this.file_list = arguments[ 0 ];
        this.status.files_total = this.file_list.length;
        for( var i = 0; i < this.status.files_total; ++i ) {
            this.status.bytes_total += this.file_list[ i ].size;
        }
    }

    //check for a specified target URL
    if( arguments.length > 1 ) {
        this.target = arguments[ 1 ];
    }
}


/**
 *  Initiates an upload of all files known to the uploader object.
 *
 */
uploader.prototype.upload_all = function() {

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
uploader.prototype.upload_next = function() {

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
                context.onprogress( {
                    lengthComputable: true,
                    loaded:           ( e.loaded + context.status.bytes_sent ),
                    total:            context.status.bytes_total
                } );
            }
        };

        //initiate the chunked upload for this file
        up.send();
    }

    //multi-file upload completed, and there's an onload handler
    else if( this.onload != null ) {
        this.onload( {
            target:           this,
            lengthComputable: true,
            loaded:           this.status.bytes_sent,
            total:            this.status.bytes_total
        } );
    }

}


/**
 *  Creates an upload object for the specified file instance.
 *
 *  @param file         A File instance to upload
 *  @param target       The base URL to the upload server handler (optional)
 *  @return             An upload object instance that can upload the file,
 *                      or null on failure
 */
uploader.prototype.create_upload = function( file ) {

    //initialize the default target URL
    var target = this.target;

    //check for a per-upload target URL
    if( arguments.length > 1 ) {
        target = arguments[ 1 ];
    }

    //create the upload object and return it
    return new upload( file, target );
};


/**
 *  Establishes a chunked file upload for a single file.  The file must be an
 *  instance of a File object.  The user can subscribe to the four typical
 *  XHR events (abort, error, load, progress) using property-style assignment.
 *
 *  @param file         The File instance representing the file to send
 *  @param target       The target URL that can handle chunked uploads
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
        bytes_total: file.size,
        bytes_sent:  0
    };

    //set an object context variable for closed event handlers
    var context = this;

    //pass-through event handlers
    this.xhr.onabort = function( e ) {
        if( context.onabort != null ) {
            context.onabort( e );
        }
    };
    this.xhr.onerror = function( e ) {
        if( context.onerror != null ) {
            context.onerror( e );
        }
    };
    this.xhr.ontimeout = function( e ) {
        if( context.ontimeout != null ) {
            context.ontimeout( e );
        }
    }

    //progress is re-mapped to the overall upload (not just a chunk)
    this.xhr.onprogress = function( e ) {
        if( context.onprogress != null ) {
            context.onprogress( {
                lengthComputable: true,
                loaded:           ( e.loaded + context.status.bytes_sent ),
                total:            context.status.bytes_total
            } );
        }
    };

    //load is re-mapped to the overall upload (not just a chunk)
    this.xhr.onload = function( e ) {

        //parse the server's response
        var result = JSON.parse( context.xhr.responseText );

        //check the transfer for any problems
        if( result.length != context.to_send ) {

            //if the error handler is available...
            if( context.onerror != null ) {

                //indicate an error with some custom fields
                context.onerror( {
                    lengthComputable: false,
                    loaded:           0,
                    total:            0,
                    message:          'Server reports incorrect size.',
                    bytes_sent:       context.to_send,
                    bytes_received:   result.length
                } );
            }
        }

        //the transfer appears successful
        else {

            //increment the total bytes sent
            context.status.bytes_sent += context.to_send;

            //send the next chunk
            context.send();
        }
    };

    //the file reader load event signals when it's ready to upload
    this.reader.onload = function( e ) {

        //construct the URI for the POST request
        var uri = context.target
            + '?name='    + encodeURIComponent( context.file.name )
            + '&time_ms=' + context.file.lastModifiedDate.getTime()
            + '&size='    + context.status.bytes_total
            + '&offset='  + context.status.bytes_sent
            + '&length='  + e.target.result.length;

        //prepare the proper POST request
        context.xhr.open( 'POST', uri, true );
        context.xhr.setRequestHeader(
            'Content-Type',
            'application/octet-stream'
        );
        context.xhr.setRequestHeader(
            'Content-Length',
            e.target.result.length
        );
        context.xhr.setRequestHeader( 'Connection', 'close' );

        //send the POST request
        //ZIH - FF only, will need to look into Chrome support
        context.xhr.sendAsBinary( e.target.result );
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
        //ZIH - this is used to complement xhr.sendAsBinary
        this.reader.readAsBinaryString(

            //specify the part of the file that should be sent
            //ZIH - Chrome may not support file.slice()
            this.file.slice(
                this.status.bytes_sent,
                ( this.status.bytes_sent + this.to_send )
            )
        );
    }

    //there are no more bytes left to send, check for load handler
    else if( this.onload != null ) {

        //fire the load event
        this.onload( {
            target:           this,
            lengthComputable: true,
            loaded:           this.status.bytes_sent,
            total:            this.status.bytes_total
        } );
    }

};
