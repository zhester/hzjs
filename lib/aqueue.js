/*****************************************************************************
Hz Asynchronous Procedure Queue
    - Execute a series of procedures.
    - Procedures are assumed to be composed of time-delayed, asynchronous
        request/response pairings.  A request procedure is initiated by the
        queue after the previous procedure reports that it completed.
    - Procedures can communicate by sending data that is stored in the
        procedure queue for retrieval by following procedures.
    - Any procedure may abort execution of the entire queue.
    - A procedure that fails to communicate with the queue can be timed out to
        notify the application.
*****************************************************************************/

/*----------------------------------------------------------------------------
Hz Library Boilerplate
----------------------------------------------------------------------------*/
var hz = ( function( ns ) { return ns; } )( hz || {} );


/*----------------------------------------------------------------------------
Hz User Interface Submodule
----------------------------------------------------------------------------*/
hz.aqueue = ( function( ns ) {

    /*------------------------------------------------------------------------
    Public Properties
    ------------------------------------------------------------------------*/

    ns.aqueue = aqueue;             //expose the queue class


    /*------------------------------------------------------------------------
    Classes
    ------------------------------------------------------------------------*/

    /**
     *  Asynchronous procedure queue.  Create one of these to execute a
     *  sequence of asynchronous procedures.
     *
     *  Example usage:
     *
     *      //Over-simplified, boring, and useless demonstration:
     *      var sequence = aqueue();
     *      sequence.ondone = function() { console.log( 'all done!' ); };
     *      sequence.execute(
     *          function( q ) { console.log( 'step 1 done' ); q.complete(); },
     *          function( q ) { console.log( 'step 2 done' ); q.complete(); },
     *          function( q ) { console.log( 'step 3 done' ); q.complete(); }
     *      );
     *
     *      //Demonstrating more typical usage:
     *      function step( name ) {
     *          this.name  = name;
     *          this.timer = null;
     *          this.queue = null;
     *      }
     *      // --> defining this method allows the object to be used directly
     *      step.prototype.initiate = function( queue ) {
     *          this.queue = queue;
     *          var context = this;
     *          this.timer = window.setTimeout(
     *              function() { context.done(); },
     *              1000
     *          );
     *          console.log( 'starting step ' + this.name );
     *      };
     *      step.prototype.done = function() {
     *          console.log( 'finishing step ' + this.name );
     *          window.clearTimeout( this.timer );
     *          // --> once a procedure is done, it must call this method
     *          this.queue.complete();
     *      };
     *      //create the queue, and load steps with delayed execution
     *      var sequence = aqueue();
     *      sequence.ondone = function() { console.log( 'all done!' ); };
     *      for( var i = 0; i < 4; ++i ) {
     *          sequence.add( new step( i ) );
     *      }
     *      //start the execution of each step in the queue
     *      sequence.start();
     *
     */
    function aqueue() {

        //external object state
        this.timeout = 10000;           //execution timeout in milliseconds

        //references to possible event handlers to be set by the user
        //  The onother handler receives the name of the event as a string.
        //  The onupdate handler receives an update value from the procedure.
        this.oncomplete = null;     //a procedure has completed normally
        this.ondone     = null;     //all procedures have completed normally
        this.oninitiate = null;     //a procedure is about to be started
        this.onother    = null;     //special, fall-through event handler
        this.onpulse    = null;     //a procedure sent a pulse
        this.onretry    = null;     //a procedure requested a retry
        this.ontimeout  = null;     //a procedure has timed out
        this.onupdate   = null;     //a procedure sent an update

        //internal object state
        this._completed = 0;        //procedures completed in this execution
        this._data      = null;     //procedure-populated data
        this._initiated = 0;        //procedures initiated in this execution
        this._procs     = [];       //list of procedures in queue
        this._queued    = 0;        //procedures queued for this execution
        this._timer     = null;     //timer ID
    }


    /**
     *  Start/restart the procedure timeout timer.
     *
     */
    aqueue.prototype._start_timer = function() {
        this._stop_timer();
        var context = this;
        this._timer = window.setTimeout(
            function() {
                context._stop_timer();
                context._trigger( 'timeout' );
            },
            this.timeout
        );
    };


    /**
     *  Stop the procedure timeout timer.
     *
     */
    aqueue.prototype._stop_timer = function() {
        if( this._timer != null ) {
            window.clearTimeout( this._timer );
            this._timer = null;
        }
    };


    /**
     *  Trigger an event by name.
     *
     *  @param name The name of the event to trigger
     *  @param * Arguments to pass to the event handler (varargs, optional)
     */
    aqueue.prototype._trigger = function( name ) {
        var args;
        var pname = 'on' + name;
        if( ( pname in this ) && ( this[ pname ] != null ) ) {
            args = Array.prototype.slice.call( arguments, 1 );
            this[ pname ].apply( this, args );
        }
        else if( this.onother != null ) {
            args = Array.prototype.slice.call( arguments );
            this.onother.apply( this, args );
        }
    };


    /**
     *  Add a procedure to the queue.
     *
     *  @param procedure A function reference or an object that implements an
     *                   "initialize" method.
     */
    aqueue.prototype.add = function( procedure ) {
        this._procs.push( procedure );
    };


    /**
     *  Convenience method to add and start a queue in one call.
     *
     *  @param * Functions/objects to enqueue and execute (varargs)
     */
    aqueue.prototype.execute = function() {
        for( var i = 0; i < arguments.length; ++i ) {
            this.add( arguments[ i ] );
        }
        this.start();
    };


    /**
     *  Start executing all procedures in the queue.
     *
     */
    aqueue.prototype.start = function() {
        this._completed = 0;
        this._initiated = 0;
        this._queued    = this._procs.length;
        this.next();
    };


    /**
     *  Execute the next procedure in the queue.
     *
     */
    aqueue.prototype.next = function() {

        //Make sure there is a procedure to execute.
        if( this._procs.length > 0 ) {
            this._trigger( 'initiate' );
            this._start_timer();
            this._initiated += 1;
            var proc = this._procs[ 0 ];
            //check for objects that appear to support the aqueue protocol
            if( 'initiate' in proc ) {
                proc.initiate( this );
            }
            //otherwise, this should be a simple function
            else if( proc instanceof Function ) {
                proc( this );
            }
            //nothing i can safely do with this procedure
            else {
                this.abort();
            }
        }

        //No procedures to execute.
        else {
            this._stop_timer();
            this._trigger( 'done' );
        }
    };


    /**
     *  Abort execution of the queue.
     *
     */
    aqueue.prototype.abort = function() {
        this._stop_timer();
        this._trigger( 'abort' );
    }


    /**
     *  Called to indicate the current procedure has completed.
     *
     */
    aqueue.prototype.complete = function() {
        this._stop_timer();
        this._trigger( 'complete' );
        this._procs.shift();
        this._completed += 1;
        this.next();
    };


    /**
     *  Called to retrieve data from earlier procedures.
     *
     *  @return Procedure-populated data
     */
    aqueue.prototype.get_data = function() {
        return( this._data );
    };


    /**
     *  Called to indicate the current procedure is still working.
     *
     */
    aqueue.prototype.pulse = function() {
        this._stop_timer();
        this._trigger( 'pulse' );
        this._start_timer();
    };


    /**
     *  Called by a procedure in an attempt to recover from a failure.
     *
     */
    aqueue.prototype.retry = function() {
        this._stop_timer();
        this._trigger( 'retry' );
        this.next();
    };


    /**
     *  Called to store data for later procedures.
     *
     *  @param data Procedure-populated data to store
     */
    aqueue.prototype.set_data = function( data ) {
        this._data = data;
    };


    /**
     *  Called to indicate measureable progress has been made.
     *
     *  @param progress Value to indicate how much is complete
     *                  This can be an application-defined range.
     */
    aqueue.prototype.update = function( progress ) {
        this._stop_timer();
        this._trigger( 'update', progress );
        this._start_timer();
    };


    return ns;
} )( hz.aqueue || {} );
