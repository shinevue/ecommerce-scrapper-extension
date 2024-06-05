require('dotenv').config();
const { clusterWrapper, scraper, helpers } = require('puppeteer-ecommerce-scraper');

async function extractTiki(page, queueData) {
	const products = [];
	let totalPages = 1;
	let notLastPage = true;

	const filePath = `./data/tiki-${queueData}.csv`;
	helpers.createFile(filePath, 'title,price,imgUrl\n');

	const url = 'https://tiki.vn/search?q=' + queueData;
	await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });

	while (notLastPage) {
		await page.waitForSelector('.product-item', { visible: true, hidden: false, timeout: 0 });

		const productNodes = await page.$$('.product-item');
		for (const node of productNodes) {
			const productInfo = await page.evaluate(productDOM => {
				return [
					productDOM.querySelector('.product-item h3')?.textContent.replaceAll(',', ''),
					productDOM.querySelector('.price-discount__price')?.textContent.slice(0, -1),
					productDOM.querySelector('.image-wrapper img')?.getAttribute('srcset').split(' ')[0],
				];
			}, node);
			scraper.saveProduct(products, productInfo, filePath);
		}
		console.log(
			`${filePath}\t`,
			`| Total products now: ${products.length}\t`,
			`| Page: ${totalPages}/\u221E\t`,
			`| URL: ${await page.url()}`
		);
		notLastPage = await scraper.navigatePage({
			page,
			nextPageSelector: 'div:nth-child(3) a.arrow',
			disabledSelector: 'div:nth-child(3) a.arrow.disabled',
			sleep: 1000, // in milliseconds
		});
		totalPages += notLastPage;
	}
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
