// modules
const
	Fetch = require( "node-fetch" ),
	JsDom = require( "jsdom" ).JSDOM;

// constants
const
	MAX_CONNECTIONS = 3,
	DUDEN_SEARCH_URL = "http://www.duden.de/suchen/dudenonline/",
	RESULT_SELECTOR = "#content > section.block > section.wide",
	NUMBER_OF_POSSIBLE_FREQUENCY_BARS = 5;


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
				let parsedResult = this.parseSearchResult( text ),
					matchedWord = this.getMatchingWord( parsedResult,word );

				if ( matchedWord !== null ) {
					this.getWordDefinition( word, matchedWord.definitionUrl ).then( resolve ).catch( reject );
				} else {
					reject( new Error( "Could not find matching word" ) );
				}
			} ).catch( ( error ) => {
				reject( error );
			} );
		} );
	}

	getWordDefinition ( word, url ) {
		return new Promise( ( resolve, reject ) => {
			Fetch( url ).then( ( resource ) => {
				return resource.text();
			} ).then( ( result ) => {
				resolve( this.parseWordDefinition( word, result ) );
			} ).catch( reject );
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

	getMatchingWord ( searchResults, word ) {
		for ( let result of searchResults ) {
			if ( result.text === word ) {
				return result;
			}
		}

		return null;
	}

	parseWordDefinition ( word, result ) {
		try {
			const $ = require( "jquery" )( new JsDom( result ).window );

			let $dom = $( "body" ),
				$wordClass = $dom.find( "div.entry > div:contains(Wortart) .lexem" ),
				$frequency = $dom.find( "div.entry > div:contains(Häufigkeit) .lexem" ),
				$hyphenation = $dom.find( "#block-duden-tiles-0 > div.entry:nth-child(2) .lexem" ),
				$examples = $dom.find( "#block-duden-tiles-0 > div.entry:nth-child(3) .lexem" ),
				$meanings = $dom.find( "#block-duden-tiles-1 > ol > li" ),
				$ancestry = $dom.find( "h2:contains(Herkunft)" ).closest( ".block" ).find( ".lexem" ),

				definition = {
					word: word,
					props: {}
				};

			// word class
			if ( $wordClass.length ) {
				let match = $wordClass.text().match( /^([^,]+)(?:,?\W?(\w+))?/ );

				if ( match.length > 1 ) {
					definition.props.wordClass = match[ 1 ];
				}

				// genum
				if ( match.length > 2 && match[ 2 ] ) {
					definition.props.genum = match[ 2 ];
				}
			}

			if ( $frequency.length ) {

			}

			// hyphenation
			if ( $hyphenation.length ) {
				definition.props.hyphenation = $hyphenation.text().split( "|" );
			}

			// examples
			if ( $examples.length ) {
				definition.props.example = $examples.html();
			}

			// meanings
			if ( $meanings.length ) {
				definition.props.meanings = Array.from( $meanings ).map( ( item ) => {
					return $( item ).text().trim();
				} );
			}

			// ancestry
			if ( $ancestry.length ) {
				definition.props.ancestry = $ancestry.text();
			}

			return definition;
		} catch ( error ) {
			console.log( error );
		}
	}

	parseSearchResult ( result ) {
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
