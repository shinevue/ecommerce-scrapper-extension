require('dotenv').config();
const { clusterWrapper, scraper, helpers } = require('puppeteer-ecommerce-scraper');

async function extractLazada(page, queueData) {
	const products = [];
	let totalPages = 1;
	let notLastPage = true;

	const filePath = `./data/lazada-${queueData}.csv`;
	helpers.createFile(filePath, 'title,price,imgUrl\n');

	const url = 'https://www.lazada.vn/catalog/?q=' + queueData;
	await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });

	while (notLastPage) {
		await page.waitForSelector('[data-qa-locator="product-item"]', { visible: true, hidden: false, timeout: 0 });
		await page.evaluate(scraper.autoScroll.toString()); // Inject autoScroll function
		await page.evaluate("autoScroll(500, 500, 'bottom').then(() => autoScroll(500, 500, 'top'))");
		await page.evaluate("autoScroll(500, 500, 'bottom').then(() => autoScroll(500, 500, 'top'))");

		const productNodes = await page.$$('[data-qa-locator="product-item"]');
		for (const node of productNodes) {
			const productInfo = await page.evaluate(productDOM => {
				const parent = '[data-qa-locator="product-item"] > div > div';
				const imgUrl = productDOM.querySelector(`${parent} img[type="product"]`)?.getAttribute('src').split('_')[0];
				return [
					productDOM.querySelector(`${parent} > div:nth-child(2) a`)?.textContent.replaceAll(',', ''),
					productDOM
						.querySelector(`${parent} > div:nth-child(2) > div:nth-child(3) > span`)
						?.textContent.replaceAll('₫', ''),
					imgUrl.match(/\.(jpeg|jpg|gif|png|bmp|webp)$/) ? imgUrl : '',
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
			nextPageSelector: '.ant-pagination-next button',
			disabledSelector: '.ant-pagination-next.ant-pagination-disabled button',
			sleep: 1000, // in milliseconds
		});
		totalPages += notLastPage;
	}
	console.log(`[DONE] Fetched ${products.length} ${queueData} products from Shopee`);
}

(async () => {
	await clusterWrapper({
		func: extractLazada,
		queueEntries: ['android', 'iphone'],
		proxyEndpoint: process.env.PROXY_ENDPOINT, // Must be in the form of http://username:password@host:port
		monitor: false,
		useProfile: true, // After solving Captcha, save your profile, so you may avoid doing it next time
	});
})();
