const {
	isFileExists,
	createFile,
	getWebName,
	url2FileName,
	getChromeProfilePath,
	getChromeExecutablePath,
} = require('./helpers');
const { scrapeWithPagination, autoScroll, saveProduct, navigatePage } = require('./scraper');
const { clusterWrapper } = require('./wrapper');

module.exports = {
	clusterWrapper,
	scraper: { scrapeWithPagination, autoScroll, saveProduct, navigatePage },
	helpers: {
		isFileExists,
		createFile,
		getWebName,
		url2FileName,
		getChromeProfilePath,
		getChromeExecutablePath,
	},
};
