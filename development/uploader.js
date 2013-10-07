/*****************************************************************************
    Chunked, High-Volume File Uploader
*****************************************************************************/

function uploader( input_element ) {
    this.input = input_element;
    this.current_file = 0;
    var context = this;
    this.input.onchange = function( e ) {
        context.input.disable = true;
        if( context.input.files.length > 0 ) {
            context.start_upload( 0 );
        }
    };
}

uploader.prototype.start_upload = function( index ) {
    var flist = context.input.files;
    var uppy = new upload( flist[ index ] );
    // uppy.onload = function( e ) { #### }
    uppy.send_chunk();
};



function upload( file ) {
    this.file = file;
    this.chunk_size = 10 * 1024 * 1024;
    this.bytes_sent = 0;
    this.reader = new FileReader();
    this.xhr = new XMLHttpRequest();
    this.onload = null;
    var context = this;
    this.reader.onload = function( e ) {
        // set up a POST request using context.xhr
        // post e.target.result
    };
}

upload.prototype.send_chunk = function() {
    var left = this.file.size - this.bytes_sent;
    if( left > 0 ) {
        var send = left > this.chunk_size ? this.chunk_size : left;
        this.reader.readAsDataURL(
            this.file.slice( this.bytes_sent, ( this.bytes_sent + send ) )
        );
    }
    else if( this.onload != null ) {
        this.onload( { 'target' : this } );
    }
};
