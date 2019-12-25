// imports
const Nightmare = require("nightmare");


class DudenSearchApi {
	static SEARCH_PAGE_URL = `https://www.duden.de/suchen/dudenonline/`;
	static nightmareInstance = null;

	nightmareSettings = {
		show: false,
		webPreferences: {
        	images: false
    	}
	};

	maxWords = 3;

	constructor (maxWords, nightmareSettings) {
		if (maxWords) {
			this.maxWords = maxWords;
		}

		if (nightmareSettings) {
			this.nightmareSettings = nightmareSettings;
		}
	}

	async searchWord (word) {
		if (!word) {
			throw `Please specify a word to search`;
		}

		DudenSearchApi.nightmareInstance = new Nightmare(this.nightmareSettings);

		const wordLinks = await this.getWordLinksFromPage(DudenSearchApi.generateSearchLink(word));
		const wordDefs = await this.getWordDefinitions(wordLinks);

		DudenSearchApi.nightmareInstance.end();

		return wordDefs;
	}

	async getWordLinksFromPage (url) {
		const links = await DudenSearchApi.nightmareInstance
			.goto(url)
			.evaluate(() => {
				const urls = [];

				document
					.querySelectorAll(".views-element-container .segment section.vignette")
					.forEach(element => urls.push(element.querySelector(".vignette__link").href));

				return urls;
			});

		return links.slice(0, this.maxWords);
	}

	async getWordDefinitions (links) {
		const wordDefs = [];

		for (const link of links) {
			wordDefs.push(
				await DudenSearchApi.nightmareInstance
					.goto(link)
					.evaluate(() => {
						return [ ...document.querySelectorAll("#rechtschreibung .tuple") ].map(tuple => {
							return {
								[ tuple.querySelector(".tuple__key").innerText ]: tuple.querySelector(".tuple__val").innerText
							};
						});
					})
			);
		}

		return wordDefs;
	}

	static generateSearchLink (word) {
		return `${ DudenSearchApi.SEARCH_PAGE_URL }${ word }`;
	}
}


module.exports = DudenSearchApi;
