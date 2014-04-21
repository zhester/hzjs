
function main( argv ) {

    var buttons = [
        'arrow_down', 'arrow_left', 'arrow_right', 'arrow_up',
        'check', 'check_fill', 'chevron_down', 'chevron_left',
        'chevron_right', 'chevron_up', 'cog', 'denied', 'document',
        'document_filled', 'download', 'folder', 'info',
        'info_fill', 'minus', 'pencil', 'plus', 'question_fill', 'save',
        'upload', 'x', 'x_fill'
    ];

    var button;

    p = hz.util.append();

    for( var i = 0; i < buttons.length; ++i ) {
        button = hz.ui.add.button( p, buttons[ i ] );
        button.className = 'button ' + buttons[ i ];
    }

    p = hz.util.append();

    for( var i = 0; i < buttons.length; ++i ) {
        button = hz.ui.add.button( p, buttons[ i ] );
        button.className = 'button ' + buttons[ i ];
        button.disabled = true;
    }

}
