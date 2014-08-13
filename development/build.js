/*

name#id.class.class?a=v&a=v:"text"#tid, ...

*/

Element.prototype.addClass = function( className ) {
    if( this.className.length == 0 ) {
        this.className = className;
    }
    else {
        var classes = this.className.split( /\s+/ );
        if( classes.indexOf( className ) == -1 ) {
            classes.push( className );
        }
        this.className = classes.join( ' ' );
    }
};
Element.prototype.removeClass = function( className ) {
    if( this.className.length == 0 ) {
        return;
    }
    var classes = this.className.split( /\s+/ );
    var index = classes.indexOf( className );
    if( index != -1 ) {
        this.className = classes.splice( index, 1 ).join( ' ' );
    }
};


var ns = {};

    ns.delims = [ ',', ':', ';', '#', '.', '?', '&', '=', '*', '"', '\\' ];
    ns.dlist = ns.delims.join( '' );

    ns.build = function( dtn ) {

        //create a dummy element to contain the collection we will return
        var root = document.createElement( 'div' );
        var base = root;

        var buffer;
        var in_string = false;
        var mult;
        var node;
        var parsed;
        var parser = new token_parser( dtn, ns.dlist );
        var stack  = [];
        var state  = new build_state( parser );

        //tokenize input string
        while( state.next() !== null ) {

            //ZIH
            //console.log( state.token + ' [' + state.matched + ']' );

            //check for a delimiter escape sequence
            if( state.matched == '\\' ) {
                //grab next token
                parsed = parser.next();
                //no token, this is a normal delimiter escape
                if( parsed.token == '' ) {
                    state.token += parsed.matched;
                    parsed = parser.next();
                    state.token += parsed.token;
                }
                //a token was returned, this is a lone escape
                else {
                    state.token += '\\' + parsed.token;
                }
                state.matched = parsed.matched;
            }

            //do not do things with empty tokens unless it's an empty string
            if( ( state.token == ''         )
             && ( ( state.capture != '"'  )
               && ( in_string     != true ) ) ) {
                continue;
            }

            //trim tokens that aren't string constants
            if( in_string == false ) {
                state.token = state.token.trim();
            }

            //check for token capturing
            switch( state.capture ) {
                case 'TAG_NAME':
                    node = document.createElement( state.token );
                    break;
                case '#':
                    node.id = state.token;
                    break;
                case '.':
                    node.addClass( state.token );
                    break;
                case '?':
                case '&':
                    buffer = state.token;
                    break;
                case '=':
                    node.setAttribute( buffer, state.token );
                    break;
                case '*':
                    mult = parseInt( state.token ) - 1;
                    for( var i = 0; i < mult; ++i ) {
                        base.appendChild( node.cloneNode( true ) );
                    }
                    break;
                case '"':
                    //ZIH - untested
                    if( in_string == true ) {
                        parser.delimiters = ns.dlist;
                        in_string = false;
                        node = document.createTextNode( state.token );
                    }
                    else {
                        parser.delimiters = '"\\';
                        in_string = true;
                    }
                    break;
            }

            //for now, assume we are capturing a new element's tag name
            state.capture = 'TAG_NAME';

            //determine action based on the matched delimiter
            switch( state.matched ) {

                //node contents complete, ascending out of contents
                case ';':
                    //base = stack.pop();
                    base = node.parentNode;
                    break;

                //node complete, descending into contents
                case ':':
                    //stack.push( base );
                    base = node;
                    break;

                //node or DTN is complete
                case ',':
                case null:
                    base.appendChild( node );
                    break;

                //enter capture state
                default:
                    state.capture = state.matched;
                    break;

            }

        }

        //return the HTMLCollection containing the document fragment
        return root.childNodes;
    }


    function build_state( parser ) {
        this.capture = 'TAG_NAME';
        this.matched = null;
        this.parser  = parser;
        this.token   = null;
    }
    build_state.prototype.next = function() {
        var parsed = this.parser.next();
        if( parsed !== null ) {
            this.token   = parsed.token;
            this.matched = parsed.matched;
            return parsed.token;
        }
        return null;
    };


    function token_parser( string, delimiters ) {
        this.delimiters = delimiters;
        this.length     = string.length;
        this.position   = 0;
        this.string     = string;
    }
    token_parser.prototype.next = function() {
        if( this.position >= this.length ) { return null; }
        var pos, token;
        for( var i = this.position; i < this.length; ++i ) {
            pos = this.delimiters.indexOf( this.string[ i ] );
            if( pos != -1 ) {
                token = this.string.substring( this.position, i );
                this.position = i + 1;
                return { 'token' : token, 'matched' : this.string[ i ] };
            }
        }
        token = this.string.substr( this.position );
        this.position = this.length;
        return { 'token' : token, 'matched' : null };
    };

function main( argv ) {
    include(
        //[ '../lib/html.js', '../lib/util.js' ],
        [ '../lib/html.js' ],
        function() {

            var div   = document.body.append( '<div>' );
            var txt   = div.append( '<textarea>' );
            txt.rows  = 10;
            txt.cols  = 60;
            txt.value = 'div:p,div#hello,div.hello?name=test*3,div#a.b.c,div';
            div = document.body.append( '<div>' );
            var btn     = div.append( '<input>' );
            btn.type    = 'button';
            btn.value   = 'Render';
            btn.onclick = function( event ) {
                var fragment = ns.build( txt.value );
                var item;
                for( var i = 0; i < fragment.length; ++i ) {
                    item = fragment.item( i );
                    if( item.id == '' ) {
                        item.id = 'id_' + i;
                    }
                }
                target.appendCollection( fragment );
                //var tp = new token_parser( txt.value, ns.dlist );
                //var t = tp.next();
                //while( t !== null ) {
                //    console.log(
                //        t.token + ' [' + t.matched + '] @' + tp.position
                //    );
                //    t = tp.next();
                //}
            };

            btn = div.append( '<input>' );
            btn.type    = 'button';
            btn.value   = 'Clear';
            btn.onclick = function( event ) {
                target.removeChildren();
            };

            var target = document.body.append( '<div>' );
            target.id  = 'target';
            target.style.border = 'dashed 1px green';

        }
    );
}
