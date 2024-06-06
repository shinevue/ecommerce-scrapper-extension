const fs = require('fs');
const os = require('os');
const path = require('path');

function isFileExists(filePath) {
	try {
		fs.accessSync(filePath, fs.constants.F_OK);
		return true;
	} catch (e) {
		return false;
	}
}

function createFile(filePath, header = '') {
	const dir = path.dirname(filePath);
	fs.mkdirSync(dir, { recursive: true });
	fs.writeFile(filePath, header, 'utf-8', err => {
		if (err) throw err;
		console.log(`${filePath} created`);
	});
}

function getWebName(url) {
	const parsedUrl = new URL(url);
	const hostnameParts = parsedUrl.hostname.split('.');
	return hostnameParts[hostnameParts.length - 1].length === 2
		? hostnameParts[hostnameParts.length - 3]
		: hostnameParts[hostnameParts.length - 2];
}

function url2FileName(url) {
	const parsedUrl = new URL(url);
	const fileName = parsedUrl.hostname.replace(/^www\./, '') + parsedUrl.pathname + parsedUrl.search;
	return fileName.replace(/[^a-zA-Z0-9]/g, '_');
}

// Cannot use the same profile for multiple browsers => Not working with CONCURRENCY_BROWSER
function getChromeProfilePath() {
	const homePath = os.homedir();
	switch (os.platform()) {
		case 'win32': // Windows
			return `${homePath}\\AppData\\Local\\Google\\Chrome\\User Data\\Default`;
		case 'darwin': // macOS
			return `${homePath}/Library/Application Support/Google/Chrome/Default`;
		case 'linux': // Linux
			return `${homePath}/.config/google-chrome/Default`;
		default:
			throw new Error('Unsupported platform');
	}
}

function getChromeExecutablePath() {
	switch (os.platform()) {
		case 'win32': // Windows
			for (let installedPath of [
				'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
				'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
			])
				if (isFileExists(installedPath)) return installedPath;
			throw new Error('Chrome executable not found in expected locations on Windows');
		case 'darwin': // macOS
			return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
		case 'linux': // Linux
			return '/usr/bin/google-chrome';
		default:
			throw new Error('Unsupported platform');
	}
}

module.exports = {
	isFileExists,
	createFile,
	getWebName,
	url2FileName,
	getChromeProfilePath,
	getChromeExecutablePath,
};
