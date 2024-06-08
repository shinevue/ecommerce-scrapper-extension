# Puppeteer Ecommerce Scraper

> Demo: https://youtu.be/KOoI-CLNHxU

This is a flexible web scraper for extracting product data from various ecommerce websites:
- It uses high-level API from [Puppeteer](https://github.com/puppeteer/puppeteer) to control **Chrome** or **Chromium**, making it capable of extracting data from websites that dynamically load content using JavaScript. 
- This scraper is also designed to handle pagination and bot detection, along with the use of [puppeteer-cluster](https://github.com/thomasdondorf/puppeteer-cluster) for efficient and parallel scraping.

```sh
npm i puppeteer-ecommerce-scraper
```
# Examples

The [examples](./examples/) folder contains my example scripts for different e-commerce websites. You can use them as a starting point for your own scraping tasks. 

For example, the [tiki1.js](./examples/tiki1.js) script configures the scraper to navigate throughout the `Android` and `iPhone` product pages of [Tiki](https://tiki.vn/) (a Vietnamese ecommerce website) and extract each *product title*, *its price*, and *image URL* from them, using a consistent user profile and a proxy server. 

This script only use 2 functions: [clusterWrapper](#clusterwrapper-) to wrap the scraping process and [scrapeWithPagination](#scraperscrapewithpagination-), an end-to-end function to scrape, paginate, and save the product data from the website automatically. If you want a more customized scraping process, you can use the other [functions provided](#functions-provided) in the different modules. I also provided scripts with post-fix `2` (such as [tiki2.js](./examples/tiki2.js)) to demonstrate how to use these functions to scrape the same website.

# Functions Provided

The functions and utilities of the scraper are divided into **3 modules**: `clusterWrapper`, `scraper`, and `helpers`. They are exported in [src/index.js](./src/index.js) in the following order:

1. [`clusterWrapper`](#clusterwrapper-).
2. `scraper`: { [**scrapeWithPagination**](#scraperscrapewithpagination-), [**autoScroll**](#scraperautoscroll-), [**saveProduct**](#scrapersaveproduct-), [**navigatePage**](#scrapernavigatepage-) }.
3. [`helpers`](#helpers-): {
    **isFileExists**,
    **createFile**,
    **getWebName**,
    **url2FileName**,
    **getChromeProfilePath**,
    **getChromeExecutablePath**
}.

## `clusterWrapper` [🔝](#functions-provided)

```js
async function clusterWrapper({
    func, // Function to be executed on each queue entry
    queueEntries, // Array or Object of queue entries. This can be the keywords you want to peform the scape.
    proxyEndpoint = '', // Must be in the form of http://username:password@host:port
    monitor = false, // Whether to monitor the progress of the scraping process
    useProfile = false, // Whether to use a consistent user profile
    otherConfigs = {}, // Other configurations for Puppeteer
})
```
This function uses the [puppeteer-cluster](https://github.com/thomasdondorf/puppeteer-cluster) to launch multiple instances of the browser at the same time (**maximum 5**) and set up different web scraping tasks to execute for each queue entry with a default **timeout of 10 seconds** before closing the cluster. Here, the scraper uses several techniques to avoid detection:
- [**puppeteer-extra-plugin-stealth**](https://github.com/berstend/puppeteer-extra/tree/master/packages/puppeteer-extra-plugin-stealth): This plugin applies evasion techniques to make the scraping activity appear more like normal browsing or a real user and less like a bot.
- **useProfile**: By using a consistent user profile (enabled by the `useProfile` option), the scraper can appear as a returning user rather than a new session each time. This option can be also beneficial when solving CAPTCHAs as we **may** avoid doing the same thing next time.
- **CAPTCHAs**: If the website requires solving CAPTCHAs, the script can wait until you solve it manually and then continue the scraping process.
- **proxyEndpoint**: The scraper can route its requests through different proxy servers to disguise its IP address and avoid IP-based blocking.

You can run the [test.js](./test.js) script to see the bot detection result when using this wrapper. Each task loads a page, gets the IP information, and then calls the `func` function with the [Puppeteer](https://github.com/puppeteer/puppeteer) page and queue data from the `queueEntries`.

## `scraper`.scrapeWithPagination [🔝](#functions-provided)

```js
async function scrapeWithPagination({ 
	page, // Puppeteer page object, which represents a single tab in Chrome
	extractFunc, // Function to extract product info from product DOM
	scrapingConfig = { // Configuration for scraping process
        url: '', // URL of the webpage to scrape
        productSelector: '', // CSS selector for product elements
        filePath: '', // File path to save the scraped data. If not provided, the function will generate one based on the URL
        fileHeader: '' // Header for the file
    },
	paginationConfig = { // Configuration for handling pagination
        nextPageSelector: '', // CSS selector for the "next page" button
        disabledSelector: '', // CSS selector for the disabled state of the "next page" button (to detect the end of pagination)
        sleep: 1000, // Delay the execution to allow for page loading or other asynchronous operations to complete
        maxPages: 0 // Maximum number of pages to scrape (0 for unlimited)
    },
	scrollConfig = { // Configuration for auto-scrolling
        scrollDelay: NaN, // Delay between scrolls
        scrollStep: NaN, // The amount (size) to scroll each time
        numOfScroll: 1, // Number of scrolls to perform
        direction: 'both' // Scroll direction ('up', 'down', 'both')
    },
})
```
👉 **return** { `products`, `totalPages`, `scrapingConfig`, `paginationConfig`, `scrollConfig` }

The scraper can navigate through multiple pages of results using this function:
1. It begins by navigating to the specified `url` and uses the `nextPageSelector` and `disabledSelector` from the `paginationConfig` to identify the "next page" button on the webpage and clicks it to load the next set of results. 
2. This process is repeated until all pages have been scraped (the "next page" button has `disabledSelector`) or a maximum limit (`maxPages`) has been reached.
3. Inside the loop, the function waits for the product elements to be visible on the page, then [autoScroll](#scraperautoscroll-) the page according to the `scrollConfig` setup. This is done to ensure that all product elements are fully rendered and can be scraped.
4. Next, the function scrapes the product information using the provided `extractFunc` and then [saveProduct](#scrapersaveproduct-) to the file.
5. Finally, the function attempts to navigate to the next page using the [navigatePage](#scrapernavigatepage-) function and the `paginationConfig` parameters.

## `scraper`.autoScroll [🔝](#functions-provided)

```js
function autoScroll(
    delay, // Delay between scrolls
    scrollStep, // The amount (size) to scroll each time
    direction // Scroll direction ('up', 'down', 'both')
) 
```
This function automatically scrolls a Puppeteer `page` object in the specified `direction` (up, down, or both) by the specified `scrollStep` amount. It continues to scroll until the end of the page is reached, waiting for the specified `delay` between each scroll.

## `scraper`.saveProduct [🔝](#functions-provided)

```js
function saveProduct( 
    products, // Array of product information
    productInfo, // Object containing information about the product
    filePath // File path to save the scraped data
)
```
If all `productInfo`'s values are truthy, the function will push them into the `products` array and append (save) them to a file at the specified `filePath`.

## `scraper`.navigatePage [🔝](#functions-provided)

```js
async function navigatePage({ 
    page, // Puppeteer page object
    nextPageSelector, // CSS selector for the "next page" button
    disabledSelector, // CSS selector for the disabled state of the "next page" button (to detect the end of pagination)
    sleep = 1000 // Delay the execution to allow for page loading or other asynchronous operations to complete
})
```
👉 **return** `Boolean` indicating whether the navigation was successful or if there is a "next page".

This function identifies if "next page" aimed to navigate is not the last page by using `disabledSelector`. If there is a "next page", it waits for current the navigation to complete and then click the `nextPageSelector`. Otherwise, it returns `false`, indicating that there is no "next page" to navigate. This could be used by the calling code to decide whether to continue scraping or stop.

## `helpers` [🔝](#functions-provided)

1. **isFileExists(`filePath`)**: Checks if a file exists at the given `filePath`. It returns a boolean value indicating whether the file exists.
2. **createFile(`filePath`, `header` = '')**: Creates a new file at the given `filePath` with the provided `header` as the first line. If the file already exists, it will not be overwritten.
3. **getWebName(`url`)**: Extracts the website name from a URL.
4. **url2FileName(`url`)**: Converts a URL into a filename-safe string by removing invalid characters.
5. **getChromeProfilePath()**: Returns the path to the Chrome profile directory on different platforms (Windows, macOS, Linux).
6. **getChromeExecutablePath()**: Returns the path to the Chrome executable on different platforms (Windows, macOS, Linux).

# Disclaimer

This scraper is designed for educational purposes only. The user is responsible for complying with the terms of service of the websites being scraped. The scraper should be used responsibly and respectfully to avoid overloading the websites with requests and to prevent IP blocking or other forms of retaliation.