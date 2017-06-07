# duden-search-api
![](https://upload.wikimedia.org/wikipedia/commons/a/af/Duden_Logo_2017.svg)
A Node.js Duden.de 'API' (website scraper for searching of german words on duden.de)

## Install
```bash
npm i duden-search-api --save
```

## Usage
````javascript
const DudenSearchApi = require( "duden-search-api" );

let instance = new DudenSearchApi();

instance.search( "gestern" ).then( ( result ) => {
	console.log( result );
} ).catch( ( error ) => {
	console.log( error );
} );
````

### The result array
The resulted return value is in the following scheme:
```javascript
[
	{
		"word": "gestern",
		"props": {
			"wordClass": "Adverb",
			"hyphenation": [
				"ges",
				"tern"
			],
			"meanings": [
				"an dem Tag, der dem heutigen unmittelbar vorausgegangen ist",
				"früher"
			],
			"ancestry": "mittelhochdeutsch gester(n), althochdeutsch gesteron, eigentlich = am anderen Tag"
		}
	}
]
```

## Todo
- [x] simple word search
- [x] extend word results (distribution, hyphenation, ancestry, examples)
- [ ] documentation ;)
- [ ] …
