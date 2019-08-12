const chromeLauncher = require('chrome-launcher');
const puppeteer = require('puppeteer');
const lighthouse = require('lighthouse');
const request = require('request');
const express = require('express');
const util = require('util');

const app = express();

const asyncMiddleware = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

async function launchChromeAndRunLighthouse() {
  const URL = 'https://www.chromestatus.com/features';

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

app.get(
  '/',
  asyncMiddleware(async (req, res, next) => {
    const results = await launchChromeAndRunLighthouse('https://google.com');
    res.json(results);
  })
);

app.listen(process.env.PORT || 8080, () => console.log('App don dey run'));
