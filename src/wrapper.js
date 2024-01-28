const { loadNotBlankPage, getChromeExecutablePath } = require('./helpers');
const { Cluster } = require('puppeteer-cluster');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function clusterWrapper({
	func,
	keywords,
	proxyEndpoint = '',
	monitor = false,
	useProfile = false, // After solving Captcha, save uour profile, so you may avoid doing it next time
	otherConfigs = {},
}) {
	try {
		var { origin, username, password } = new URL(proxyEndpoint);
	} catch (_) {
		console.log('Proxy disabled => To use Proxy, provide an endpoint in the form of http://username:password@host:port');
		origin = username = password = null;
	}

	const maxConcurrency = Math.min(keywords.length, 5);
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
		concurrency: Cluster.CONCURRENCY_BROWSER,
		maxConcurrency,
		perBrowserOptions,
		puppeteer,
		monitor,
		timeout: 1e7,
	});
	cluster.on('taskerror', (err, data) => {
		console.log(err.message, data);
	});

	await cluster.task(async ({ page, data: keyword }) => {
		const notBlankPage = await loadNotBlankPage(page, 'https://ipinfo.io/json', username, password);
		const content = await notBlankPage.$eval('body', el => el.innerText);
		console.log(`IP Information for scraping ${keyword}: ${content}`);

		if (typeof func === 'function') await func(notBlankPage, keyword);
		else console.log('Function not found.');
	});

	for (const keyword of keywords) await cluster.queue(keyword);
	await cluster.idle();
	await cluster.close();
}

module.exports = { clusterWrapper };
