# duden-search-api
![](https://upload.wikimedia.org/wikipedia/commons/a/af/Duden_Logo_2017.svg)
A Node.js website scraper for searching of german words on duden.de

## Install
```bash
npm i duden-search-api --save
```

## Usage
````javascript
const DudenSearchApi = require( "duden-search-api" );

let instance = new DudenSearchApi();

instance.search( "Welt" ).then( ( result ) => {
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
		text: 'weltlich',
		description: 'Adjektiv - 1. der (diesseitigen, irdischen) Welt angehörend, …2. nicht geistlich, nicht kirchlich',
		wordProperties: { 
			type: 'Adjektiv',
			genus: undefined,
			definition: '1. der (diesseitigen, irdischen) Welt angehörend, …2. nicht geistlich, nicht kirchlich' },
			definitionUrl: 'http://www.duden.de/rechtschreibung/weltlich' 
		}
]
```

## Todo
- [x] simple word search
- [ ] extend word results (distribution, hyphenation, ancestry, examples)
- [ ] documentation ;)
- [ ] …
