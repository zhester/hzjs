<?php

$dh = opendir( '.' );
$scripts = [];
if( $dh ) {
    while( ( $node = readdir( $dh ) ) !== false ) {
        if( ( substr( $node, 0, 1 ) != '.' )
         && ( substr( $node, -3 ) == '.js' ) ) {
            $scripts[] = $node;
        }
    }
    closedir( $dh );
    sort( $scripts );
}

$link_tags = '';
for( $i = 0; $i < count( $scripts ); ++$i ) {
    $link_tags .= '  <li><a href="?d=' . $scripts[ $i ]
        . '">' . $scripts[ $i ] . '</a></li>' . "\n";
}

$body = '';
$script_tags = '';
if( empty( $_GET[ 'd' ] ) == false ) {
    $script_tags = '  <script src="' . $_GET[ 'd' ] . '"></script>' . "\n";
}
else {
    $body = "<h1>hzjs Development</h1>\n<ul>\n" . $link_tags . "</ul>\n";
}

?><!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>hzjs Development</title>
  <link rel="stylesheet" href="../../hzcss/styles/base_sans.css">
  <link rel="stylesheet" href="../../hzcss/styles/ui.css">
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
/**
 *  Includes additional scripts in the current document.
 *  Note: I don't use this for production sites.  This is a development tool.
 *
 *  @param urls     A list of URLs to scripts to include
 *  @param callback Optional function to call when all scripts are loaded
 */
function include( urls ) {
    var callback = arguments.length > 1 ? arguments[ 1 ] : null;
    var loaded = [];
    var script;
    for( var i = 0; i < urls.length; ++i ) {
        loaded[ i ] = false;
        script = document.createElement( 'script' );
        script.setAttribute( 'src', urls[ i ] );
        script.addEventListener(
            'load',
            (
                function( index ) {
                    return function( event ) {
                        loaded[ index ] = true;
                        if( ( callback !== null )
                         && ( loaded.indexOf( false ) == -1 ) ) {
                            callback();
                        }
                    };
                }( i )
            )
        );
        document.head.appendChild( script );
    }
}
    window.addEventListener(
      'load',
      function( event ) {
        if( 'main' in window ) {
          var hash = window.location.hash;
          window.main( hash.replace( /^#/, '' ).split( ':' ) );
        }
      }
    );
  </script>
</head>
<body>
<?php echo $body; ?>
</body>
</html>