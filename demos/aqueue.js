
function step_1( q ) {
    console.log( 'step 1 done' );
    q.complete();
}

function step_2( q ) {
    console.log( 'step 2 done' );
    q.complete();
}

var retries = 0;

function step_3( q ) {
    if( retries < 3 ) {
        console.log( 'step 3 retry #' + ( retries + 1 ) );
        retries += 1;
        q.retry();
    }
    else {
        console.log( 'step 3 done' );
        q.complete();
    }
}

function step_4( q ) {
    console.log( 'step 4 done' );
    q.complete();
}

function step_5( q ) {
    var timer_int = window.setInterval(
        function( event ) {
            console.log( 'step 5 working' );
            q.pulse();
        },
        200
    );
    var timer_to = window.setTimeout(
        function( event ) {
            window.clearInterval( timer_int );
            window.clearTimeout( timer_to );
            console.log( 'step 5 done' );
            q.complete();
        },
        2000
    );
}

function step_6( q ) {
    console.log( 'step 6 done' );
    q.complete();
}


function main( argv ) {

    var sequence = new hz.aqueue.aqueue();

    sequence.add( step_1 );
    sequence.add( step_2 );
    sequence.add( step_3 );
    sequence.add( step_4 );
    sequence.add( step_5 );
    sequence.add( step_6 );

    sequence.start();

}
