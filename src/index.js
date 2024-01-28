const { isFileExists, getChromeProfilePath, getChromeExecutablePath, loadNotBlankPage } = require('./helpers');
const { scrapeWithPagination, autoScroll, createFile, saveProduct, navigatePage } = require('./scraper');
const { clusterWrapper } = require('./wrapper');

module.exports = {
	isFileExists,
	getChromeProfilePath,
	getChromeExecutablePath,
	loadNotBlankPage,
	scrapeWithPagination,
	createFile,
	autoScroll,
	saveProduct,
	navigatePage,
	clusterWrapper,
};
