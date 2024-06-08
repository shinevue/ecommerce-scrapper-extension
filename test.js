require('dotenv').config();
const { clusterWrapper, helpers } = require('puppeteer-ecommerce-scraper');

(async () => {
	await clusterWrapper({
		func: async (page, queueData) => {
			const webName = helpers.url2FileName(queueData);
			await page.goto(queueData, { waitUntil: 'networkidle2' });
			await page.screenshot({ path: `./tmp/${webName}.png`, fullPage: true });
			console.log(`Check ./tmp/${webName}.png for anti-bot testing result on ${queueData}`);
		},
		queueEntries: ['https://bot.sannysoft.com', 'https://browserleaks.com/webrtc', 'https://browserleaks.com/javascript'],
		proxyEndpoint: process.env.PROXY_ENDPOINT, // Must be in the form of http://username:password@host:port
		monitor: false,
		useProfile: true, // After solving Captcha, save your profile, so you may avoid doing it next time
	});
})();
