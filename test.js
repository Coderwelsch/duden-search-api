// modules
const DudenApi = require( "./main.js" );


// variables
let dudenApi = new DudenApi();


//
dudenApi.searchWordList( [ "bewahren", "Mann", "gestern" ], ( data ) => {
	console.log( JSON.stringify( data, null, 4 ) );
} );