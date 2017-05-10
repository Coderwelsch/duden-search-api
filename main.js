// modules
const
	Fetch = require( "node-fetch" ),
	JsDom = require( "jsdom" ).JSDOM;


// variables
const
	DUDEN_SEARCH_URL = "http://www.duden.de/suchen/dudenonline/",
	RESULT_SELECTOR = "#content > section.block > section.wide";


module.exports = class DudenSearchApi {
	constructor () {

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
			total = array.length,
			handleRequest = ( word, data, isError ) => {
				current++;

				if ( !isError ) {
					enrichedData.push( data );
				}

				if ( typeof onProgress === "function" ) {
					onProgress( word, data, current, total, isError );
				}

				if ( current === total ) {
					onDone( enrichedData );
				}
			};

		for ( let word of array ) {
			this.search( word ).then( ( data ) => {
				handleRequest( word, data );
			} ).catch( ( error ) => {
				handleRequest( word, null, error );
			} );
		}
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