const chromeLauncher = require('chrome-launcher');
const puppeteer = require('puppeteer');
const lighthouse = require('lighthouse');
const request = require('request');
const util = require('util');

const asyncMiddleware = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

async function launchChromeAndRunLighthouse(URL) {
  const opts = {
    chromeFlags: ['--headless'],
    logLevel: 'info',
    output: 'json'
  };

  // Launch chrome using chrome-launcher.
  const chrome = await chromeLauncher.launch(opts);
  opts.port = chrome.port;

  // Connect to it using puppeteer.connect().
  const resp = await util.promisify(request)(
    `http://localhost:${opts.port}/json/version`
  );

  const { webSocketDebuggerUrl } = JSON.parse(resp.body);
  const browser = await puppeteer.connect({
    browserWSEndpoint: webSocketDebuggerUrl
  });

  // Run Lighthouse.
  return lighthouse(URL, opts, null).then(async result => {
    await browser.disconnect();
    await chrome.kill();
    return result.lhr;
  });
}

const extractResult = lighthouseResult => {
  return { 
      is_on_https: lighthouseResult.audits['is-on-https'],
      works_offline: lighthouseResult.audits['works-offline'],
      without_js: lighthouseResult.audits['without-js'],
      is_crawlable: lighthouseResult.audits['is-crawlable'],
      font_size: lighthouseResult.audits['font-size'],
      load_fast_for_pwa: lighthouseResult.audits['load-past-for-pwa'],
      first_contentful_paint: lighthouseResult.audits['first-contentful-paint'],
    };
};

module.exports = {
  extractResult,
  launchChromeAndRunLighthouse,
  asyncMiddleware
};
