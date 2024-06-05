require('dotenv').config();
const { clusterWrapper, scraper } = require('puppeteer-ecommerce-scraper');

async function extractTiki(page, queueData) {
	const { products } = await scraper.scrapeWithPagination({
		page, // Puppeteer page object
		scrapingConfig: {
			url: `https://tiki.vn/search?q=${queueData}`,
			productSelector: '.product-item',
			filePath: `./data/tiki-${queueData}.csv`,
			fileHeader: 'title,price,imgUrl\n',
		},
		paginationConfig: {
			nextPageSelector: 'div:nth-child(3) a.arrow',
			disabledSelector: 'div:nth-child(3) a.arrow.disabled',
			sleep: 1000, // in milliseconds
			maxPages: 3, // 0 for unlimited
		},
		extractFunc: productDOM => [
			productDOM.querySelector('.product-item h3')?.textContent.replaceAll(',', ''),
			productDOM.querySelector('.price-discount__price')?.textContent.slice(0, -1),
			productDOM.querySelector('.image-wrapper img')?.getAttribute('srcset').split(' ')[0],
		],
	});
	console.log(`[DONE] Fetched ${products.length} ${queueData} products from Tiki`);
}

(async () => {
	await clusterWrapper({
		func: extractTiki,
		queueEntries: ['android', 'iphone'],
		proxyEndpoint: process.env.PROXY_ENDPOINT, // Must be in the form of http://username:password@host:port
		monitor: false,
		useProfile: false, // After solving Captcha, save your profile, so you may avoid doing it next time
	});
})();
