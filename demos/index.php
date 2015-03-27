<?php
/*****************************************************************************
hzjs Demonstration Interface

*****************************************************************************/

//stuff that might change over time
$conf = [
    'hzcss'  => '../../hzcss/styles',
    'hzjs'   => '../lib',
    'demos'  => '.',
    'ignore' => [ 'blank.js', 'uhttp.js', 'ui_color.js' ]
];

//fetch a list of modules in the library
$dh = opendir( $conf[ 'hzjs' ] );
$scripts = [];
if( $dh !== false ) {
    while( ( $node = readdir( $dh ) ) !== false ) {
        if( ( substr( $node, 0, 1 ) != '.'                  )
         && ( in_array( $node, $conf[ 'ignore' ] ) == false ) ) {
            $scripts[] = $node;
        }
    }
    closedir( $dh );
}
sort( $scripts );
$script_tags = '';
for( $i = 0; $i < count( $scripts ); ++$i ) {
    $script_tags .= '  <script src="' . $conf[ 'hzjs' ] . '/'
        . $scripts[ $i ] . '"></script>' . "\n";
}

//optional content to echo in the body of the page
$body = '';

//determine if a demo script has been requested
if( empty( $_GET[ 'd' ] ) == false ) {

    //sanitize input
    $d = $_GET[ 'd' ];
    $result = preg_match( '/^[a-z][a-z_]+\.js$/', $d );

    //check for bad input
    if( $result != 1 ) {
        $body = '<h1>Invalid Request</h1><p><em>Seriously?</em></p>';
    }

    //it's cool, add the requested script to the list
    else {
        $pf = $conf[ 'demos' ] == '.' ? '' : $conf[ 'demos' ] . '/';
        $script_tags .= '  <script src="' . $pf . $d . '"></script>' . "\n";
    }
}

//no demo script, build an index to what's available
else {

    $nodes = [];
    $dh = opendir( $conf[ 'demos' ] );
    if( $dh !== false ) {
        while( ( $node = readdir( $dh ) ) !== false ) {
            if( ( substr( $node, 0, 1 ) != '.' )
             && ( substr( $node, -3 ) == '.js' ) ) {
                $nodes[] = $node;
            }
        }
        closedir( $dh );
    }

    sort( $nodes );
    $pf = $conf[ 'demos' ] == '.' ? '' : $conf[ 'demos' ] . '/';
    $body = "  <h1>Demonstration Index</h1>\n  <ul>\n";
    for( $i = 0; $i < count( $nodes ); ++$i ) {
        $body .= '    <li><a href="?d=' . $nodes[ $i ] . '">'
            . $nodes[ $i ] . '</a> <a href="' . $pf . $nodes[ $i ]
            . '">[source]</a></li>' . "\n";
    }
    $body .= "  </ul>\n";
}


function ec( $key ) { global $conf; echo $conf[ $key ]; }

?><!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>hzjs demos</title>
  <link rel="stylesheet" href="<?php ec('hzcss'); ?>/base_sans.css">
  <link rel="stylesheet" href="<?php ec('hzcss'); ?>/ui.css">
  <style>
    body {
      margin: 0.5em 1em;
    }
      body>div {
        margin: 0.5em 0;
      }
  </style>
<?php echo $script_tags; ?>
  <script>
    window.addEventListener(
      'load',
      function( event ) {
        if( 'main' in window ) {
          var hash = window.location.hash;
          window.main( hash.replace( /^#/, '' ).split( ':' ) );
        }
      },
      false
    );
  </script>
</head>
<body>
<?php echo $body; ?>
</body>
</html>

