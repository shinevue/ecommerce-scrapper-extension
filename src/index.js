const {
	isFileExists,
	createFile,
	getWebName,
	url2FileName,
	getChromeProfilePath,
	getChromeExecutablePath,
	loadNotBlankPage,
} = require('./helpers');
const { scrapeWithPagination, autoScroll, saveProduct, navigatePage } = require('./scraper');
const { clusterWrapper } = require('./wrapper');

module.exports = {
	helpers: {
		isFileExists,
		createFile,
		getWebName,
		url2FileName,
		getChromeProfilePath,
		getChromeExecutablePath,
		loadNotBlankPage,
	},
	scraper: { scrapeWithPagination, autoScroll, saveProduct, navigatePage },
	clusterWrapper,
};
