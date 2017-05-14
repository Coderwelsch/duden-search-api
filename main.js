// modules
const
	Fetch = require( "node-fetch" ),
	JsDom = require( "jsdom" ).JSDOM;


// variables
const
	MAX_CONNECTIONS = 3,
	DUDEN_SEARCH_URL = "http://www.duden.de/suchen/dudenonline/",
	RESULT_SELECTOR = "#content > section.block > section.wide";


module.exports = class DudenSearchApi {
	constructor ( maxConnections = MAX_CONNECTIONS ) {
		this.maxConnections = maxConnections;
	}

	setMaxConnections ( connections = MAX_CONNECTIONS ) {
		this.maxConnections = connections;
	}

	search ( word = "" ) {
		return new Promise( ( resolve, reject ) => {
			Fetch( this.generateSearchUrl( word ) ).then( ( resource ) => {
				return resource.text();
			} ).then( ( text ) => {
				resolve( this.parseResult( text ) );
			} ).catch( ( error ) => {
				reject( error );
			} );
		} );
	}

	searchWordList ( array, onDone, onProgress ) {
		let current = 0,
			enrichedData = [],
			currentConnections = 0,
			total = array.length,
			arr = array.slice( 0 );

		let handleRequest = ( word, data, isError ) => {
			let returnValue;

			if ( typeof onProgress === "function" ) {
				returnValue = onProgress( word, data, current, total, isError );
			}

			if ( !isError && returnValue instanceof Promise ) {
				returnValue.then( ( data ) => {
					current++;

					enrichedData.push( data );

					if ( current >= total ) {
						onDone( enrichedData );
					} else {
						manageRequests();
					}
				} ).catch( () => {
					current++;

					if ( current >= total ) {
						onDone( enrichedData );
					} else {
						manageRequests();
					}
				} );
			} else {
				current++;

				enrichedData.push( returnValue || data );

				if ( current >= total ) {
					onDone( enrichedData );
				} else {
					manageRequests();
				}
			}
		};

		let manageRequests = () => {
			if ( currentConnections < this.maxConnections ) {
				let newConnections = this.maxConnections - currentConnections;

				if ( newConnections >= arr.length ) {
					newConnections = arr.length;
				}

				for ( let i = 0; i < newConnections; i++ ) {
					let word = arr.pop();

					this.search( word ).then( ( data ) => {
						handleRequest( word, data );
					} ).catch( ( error ) => {
						handleRequest( word, null, error );
					} );
				}
			}
		};

		manageRequests();
	}

	parseResult ( result ) {
		let $dom = new JsDom( result ),
			definitions = [],
			$results = $dom.window.document.querySelectorAll( RESULT_SELECTOR );

		for ( let $entry of $results ) {
			let headline = $entry.querySelector( "h2" ),
				description = $entry.querySelector( "p" );

			if ( !headline ) {
				continue;
			}

			description = description ? description.textContent : "";

			definitions.push( {
				text: headline.textContent,
				description: description,
				wordProperties: this.getWordProperties( description ),
				definitionUrl: headline.querySelector( "a" ).href
			} );
		}

		return definitions;
	}

	getWordProperties ( description = "" ) {
		let regex = /^(\w+),?\ +(feminin|maskulin|Neutrum)?.*- (.*)/gi,
			m,
			result = {};

		while ( ( m = regex.exec( description ) ) !== null ) {
			if ( m.index === regex.lastIndex ) {
				regex.lastIndex++;
			}

			m.forEach( ( match, groupIndex ) => {
				switch ( groupIndex ) {
					case 1:
						result[ "type" ] = match;
						break;
					case 2:
						result[ "genus" ] = match;
						break;
					case 3:
						result[ "definition" ] = match;
						break;
				}
			} );
		}

		return result;
	}

	generateSearchUrl ( searchString ) {
		return DUDEN_SEARCH_URL + encodeURIComponent( searchString );
	}
};
