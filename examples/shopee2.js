require('dotenv').config();
const { clusterWrapper, autoScroll, createFile, saveProduct, navigatePage } = require('puppeteer-ecommerce-scraper');

async function extractShopee(page, queueData) {
	const products = [];
	let totalPages = 1;
	let notLastPage = true;

	const filePath = `./data/shopee-${queueData}.csv`;
	createFile(filePath, 'title,price,imgUrl\n');

	const url = 'https://shopee.vn/search?keyword=' + queueData;
	await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });

	while (notLastPage) {
		await page.waitForSelector('.shopee-search-item-result__item', { visible: true, hidden: false, timeout: 0 });
		await page.evaluate(autoScroll.toString());
		await page.evaluate("autoScroll(500, 500, 'bottom').then(() => autoScroll(500, 500, 'top'))");
		await page.evaluate("autoScroll(500, 500, 'bottom').then(() => autoScroll(500, 500, 'top'))");

		const productNodes = await page.$$('.shopee-search-item-result__item');
		for (const node of productNodes) {
			const productInfo = await page.evaluate(productDOM => {
				const title = productDOM.querySelector('div[data-sqe="name"] > div:nth-child(1) > div')?.textContent;
				const priceParent = productDOM.querySelector('span[aria-label="current price"]')?.parentElement;
				const price = priceParent?.querySelectorAll('span')[2]?.textContent;
				const imgUrl = productDOM.querySelector('img[style="object-fit: contain"]')?.getAttribute('src');
				// const imgUrl = productDOM.querySelector(`img[alt="${title}"]`)?.getAttribute('src');
				return [title?.replaceAll(',', '_'), price, imgUrl];
			}, node);
			saveProduct(products, productInfo, filePath);
		}
		console.log(
			`${filePath}\t`,
			`| Total products now: ${products.length}\t`,
			`| Page: ${totalPages}/\u221E\t`,
			`| URL: ${url}`
		);
		notLastPage = await navigatePage({
			page,
			nextPageSelector: '.shopee-icon-button--right',
			disabledSelector: '.shopee-icon-button--right .shopee-icon-button--disabled',
			sleep: 1000, // in milliseconds
		});
		totalPages += notLastPage;
	}
	console.log(`[DONE] Fetched ${products.length} ${queueData} products from Shopee`);
}

(async () => {
	await clusterWrapper({
		func: extractShopee,
		queueEntries: ['android', 'iphone'],
		proxyEndpoint: process.env.PROXY_ENDPOINT, // Must be in the form of http://username:password@host:port
		monitor: false,
		useProfile: false, // After solving Captcha, save your profile, so you may avoid doing it next time
	});
})();
