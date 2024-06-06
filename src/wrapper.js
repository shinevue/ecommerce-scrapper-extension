const { getChromeExecutablePath } = require('./helpers');
const { Cluster } = require('puppeteer-cluster');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function clusterWrapper({
	func, // Function to be executed on each queue entry
	queueEntries, // Array or Object of queue entries
	proxyEndpoint = '', // Must be in the form of http://username:password@host:port
	monitor = false, // Monitor the progress of the cluster
	useProfile = false, // After solving Captcha, save your profile, so you may avoid doing it next time
	otherConfigs = {}, // Other configurations for Puppeteer
}) {
	if (!Array.isArray(queueEntries) && (typeof queueEntries !== 'object' || queueEntries === null))
		throw new Error('queueEntries must be an array or an object');

	try {
		var { origin, username, password } = new URL(proxyEndpoint);
	} catch (_) {
		console.log('Proxy disabled => To use Proxy, provide an endpoint in the form of http://username:password@host:port');
		origin = username = password = null;
	}

	const maxConcurrency = Math.min(Object.keys(queueEntries).length, 5); // Maximum 5 browsers
	const perBrowserOptions = [...Array(maxConcurrency).keys()].map(i => {
		const puppeteerOptions = {
			...{
				headless: false,
				defaultViewport: false,
				executablePath: getChromeExecutablePath(), // Avoid Bot detection
			},
			...otherConfigs,
		};
		if (useProfile) puppeteerOptions.userDataDir = `./tmp/profile${i + 1}`; // Must use different profile for each browser
		if (proxyEndpoint) puppeteerOptions.args = [`--proxy-server=${origin}`];
		return puppeteerOptions;
	});
	console.log(`Configuration for ${maxConcurrency} browsers in Cluster:`, perBrowserOptions);

	const cluster = await Cluster.launch({
		concurrency: Cluster.CONCURRENCY_BROWSER, // Run one browser per worker
		maxConcurrency, // Maximum 5 browsers
		perBrowserOptions, // Configuration for each browser
		puppeteer, // Use puppeteer-extra
		monitor, // Monitor the progress of the cluster
		timeout: 1e7, // Wait for 10 seconds before closing the browser
	});
	cluster.on('taskerror', (err, data) => console.log(err.message, data));

	await cluster.task(async ({ page, data: queueData }) => {
		const notBlankPage = await loadNotBlankPage(page, 'https://ipinfo.io/json', username, password);
		const content = await notBlankPage.$eval('body', el => el.innerText); // Get IP information
		console.log(`IP Information for scraping ${queueData}: ${content}`);

		if (typeof func === 'function') await func(notBlankPage, queueData);
		else console.log('Function not found.');
	});

	for (const queueData of queueEntries) await cluster.queue(queueData);
	await cluster.idle(); // Wait for all tasks to finish
	await cluster.close();
}

async function loadNotBlankPage(page, url, proxyUsername = '', proxyPassword = '') {
	const browser = page.browser();
	const context = browser.defaultBrowserContext();
	await context.overridePermissions(url, []); // Reset permissions

	const pagesArray = await browser.pages();
	const notBlankPage = pagesArray[0];
	await page.close(pagesArray[1]);

	if (proxyUsername && proxyPassword) await notBlankPage.authenticate({ username: proxyUsername, password: proxyPassword });
	await notBlankPage.goto(url, { waitUntil: 'networkidle2', timeout: 0 });
	return notBlankPage;
}

module.exports = { clusterWrapper };
