require('dotenv').config();
const { scrapeWithPagination, clusterWrapper } = require('puppeteer-ecommerce-scraper');

async function extractTiki(page, keyword) {
	const { products } = await scrapeWithPagination({
		page, // Puppeteer page object
		scrapingConfig: {
			url: `https://tiki.vn/search?q=${keyword}`,
			productSelector: '.product-item',
			filePath: `./data/tiki-${keyword}.csv`,
			fileHeader: 'title,price,imgUrl\n',
		},
		paginationConfig: {
			nextPageSelector: 'div:nth-child(3) a.arrow',
			disabledSelector: 'div:nth-child(3) a.arrow.disabled',
			sleep: 1000, // in milliseconds
			maxPages: 3, // 0 for unlimited
		},
		extractFunc: productDOM => [
			productDOM.querySelector('.product-name')?.textContent.replaceAll(',', ''),
			productDOM.querySelector('.price-discount__price')?.textContent.slice(0, -1),
			productDOM.querySelector('.product-image img')?.getAttribute('srcset').split(' ')[0],
		],
	});
	console.log(`[DONE] Fetched ${products.length} ${keyword} products from Tiki`);
}

(async () => {
	await clusterWrapper({
		func: extractTiki,
		keywords: ['android', 'iphone'],
		proxyEndpoint: process.env.PROXY_ENDPOINT, // Must be in the form of http://username:password@host:port
		monitor: false,
		useProfile: false, // After solving Captcha, save uour profile, so you may avoid doing it next time
	});
})();
