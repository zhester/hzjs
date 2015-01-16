<?php

if( $_SERVER[ 'REQUEST_METHOD' ] != 'POST' ) {
    header( 'HTTP/1.1 405 Method Not Allowed', true, 405 );
    header( 'Allow: POST' );
    echo '<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"><title>Error 405: Method Not Allowed</title>
</head>
<body>
  <h1>Error 405: Method Not Allowed</h1>
</body>
</html>';
    exit();
}

if( isset( $_GET[ 'name' ] ) == false ) {
    header( 'HTTP/1.1 400 Bad Request', true, 400 );
    echo '<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"><title>Error 400: Bad Request</title>
</head>
<body>
  <h1>Error 400: Bad Request</h1>
</body>
</html>';
    exit();
}

//file meta data
$info = [];

//list of integer fields
$int_fields = [ 'time_ms', 'size', 'offset', 'length' ];

//load numeric fields
for( $i = 0; $i < count( $int_fields ); ++$i ) {
    if( isset( $_GET[ $int_fields[ $i ] ] ) == true ) {
        $info[ $int_fields[ $i ] ] = intval( $_GET[ $int_fields[ $i ] ] );
    }
    else {
        $info[ $int_fields[ $i ] ] = 0;
    }
}

//strip any path information off of the file name
$info[ 'name' ] = basename( $_GET[ 'name' ] );

//check file modified timestamp
if( isset( $info[ 'time_ms' ] ) == false ) {
    date_default_timezone_set( 'UTC' );
    $info[ 'time_ms' ] = time() * 1000;
}

//destination directory needs to be provided by application
$dir = 'files';

//write the POST contents to the file
$ifh = fopen( 'php://input', 'rb' );
if( $info[ 'offset' ] == 0 ) {
    $mode = 'wb';
}
else {
    $mode = 'ab';
}
$ofh = fopen( $dir . '/' . $info[ 'name' ], $mode );
$size = 0;
while( feof( $ifh ) == false ) {
    $size += fwrite( $ofh, fread( $ifh, 8192 ) );
}
fclose( $ofh );
fclose( $ifh );

//update the length field for verfication purposes
$info[ 'length' ] = $size;

//store the file meta data
file_put_contents(
    $dir . '/' . $info[ 'name' ] . '.json',
    json_encode( $info, JSON_PRETTY_PRINT )
);

//respond to the client
header( 'Content-Type: application/json' );
echo json_encode( $info );

?>
