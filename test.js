const DudenSearchApi = require("./index.js");


async function test () {
	const instance = new DudenSearchApi();

	const result = await instance.searchWord("Buchstabe");
	console.log(result);
	process.exit();
};

test();
