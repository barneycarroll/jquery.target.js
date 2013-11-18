/* Provides a jQuery 'target' event that fires in all conditions that would
 * result in an element becoming the target of the URI fragment identifier or
 * hash as it is often called. It aims to provide a behavioural hook to emulate
 * CSS3's :target selector [1] (more here [2] and here [3]: good demos include
 * this proof of concept [4] and Wikipedia's styling of targeted footnotes and
 * citations [5]).
 *
 * [1] https://developer.mozilla.org/en-US/docs/Web/CSS/:target
 * [2] http://css-tricks.com/on-target/
 * [3] http://blog.teamtreehouse.com/stay-on-target
 * [4] http://daniel.glazman.free.fr/weblog/targetExample.html
 * [5] http://en.wikipedia.org/wiki/Cascading_Style_Sheets#cite_note-World_Wide_Web_Consortium-24
 */
void function jQueryTargetEventClosure( $, undefined ){
    var $previous;
    // Returns a 'ready' event to pass when 'target' is triggered by initial hash state on document load:
    // Prevents critical failure when attempting to invoke event methods on 'target' handlers
    var readyEventConstructor = ( function readyEventConstructorClosure() {
        var history        = window.history;
        var historySupport = history.replaceState && $.isFunction( history.replaceState );
 
        return function readyEventConstructor() {
            var location   = window.location;
            var readyEvent = $.Event( 'ready' );
 
            // In case of history support, allow preventDefault to remove the window location's hash
            if( historySupport && location.hash ){
                readyEvent.preventDefault = function preventDomReadyTargetDefault() {
                    history.replaceState( undefined, undefined, location.href.split( location.hash )[ 0 ] );
 
                    // ...but then hand over to jQuery's own preventDefault for internal statefulness etc
                    return $.Event.prototype.preventDefault.call( readyEvent );
                };
            }
            return readyEvent;
        };
    }() );

    // The end result
    function target( $subject, originalEvent ){
        $subject.trigger( 'target', [ originalEvent ] );

        $previous && $previous.trigger( 'unhash', [ originalEvent ] );

        $previous = $subject;
    }
 
    // Utility: removes the hash from any passed URI(-component)-like string
    // so we can compare URIs excluding the fragment identifier
    function unHash( uriString ) {
        var link     = $( ''.link( uriString ) )[ 0 ];
        var hash     = link.hash;
        var unhashed = link.href.split( unhashed )[ 0 ];
 
        return unhashed;
    }
 
    // Hashchange event handlers:
    // The function below triggers a target event if the hashchange targets an element
    // but needs conditional binding or unbinding depending on whether it is the end
    // result of a click event that has already fired a target event
    function filterHashChangeTarget( hashChangeEvent ) {
        var $subject = $( window.location.hash );
 
        target( $subject, hashChangeEvent );
    }
 
    // Bind the above handler
    function handleHashChange() {
        $( window )
            .off( 'hashchange.ignore' )
            .on(  'hashchange.handle', filterHashChangeTarget );
    }
 
    // Unbind the next instance
    function ignoreHashChange() {
        $( window )
            .off( 'hashchange.handle' )
            .on(  'hashchange.ignore', handleHashChange );
    }
 
    // For link clicks
    $( 'body' ).on( 'click', 'a[href*=#]', function filterTarget( clickEvent ) {
        var link     = this;
        var $subject = $( link.hash );
 
        // Abandon non-targetting clicks
        if( !$subject.length ) {
            return;
        }
 
        // Assume the default click behaviour isn't prevented:
        // A hashchange event will bubble up and trigger another target.
        // Unbind that handler temporarily, but extend preventDefault
        // to reinstate it.
        void function handlePropagation() {
            var originalPreventDefault = clickEvent.preventDefault;
 
            // Don't handle the next hash change
            ignoreHashChange();
 
            // ...Unless default's prevented
            clickEvent.preventDefault = function reinstateHashTarget() {
                // Reinstate the hash change handler
                handleHashChange();
 
                return originalPreventDefault.apply( clickEvent, arguments );
            };
        }();
 
        // Only apply to in-page links: minus the hash, link & location must match
        if ( unHash( link.href ) === unHash( window.location.href )) {
            target( $subject, clickEvent );
        }
    });
 
    // On DOM ready
    $(function readyTargetCheck(){
        $( window.location.hash ).trigger( 'target', readyEventConstructor() );
    });
}(jQuery);