const express = require('express');
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const app = express();

function launchChromeAndRunLighthouse(url, opts, config = null) {
  return chromeLauncher
    .launch({ chromeFlags: opts.chromeFlags, onlyCategories: ['performance'] })
    .then(chrome => {
      opts.port = chrome.port;
      return lighthouse(url, opts, config).then(results => {
        // use results.lhr for the JS-consumeable output
        // https://github.com/GoogleChrome/lighthouse/blob/master/types/lhr.d.ts
        // use results.report for the HTML/JSON/CSV output as a string
        // use results.artifacts for the trace/screenshots/other specific case you need (rarer)
        return chrome.kill().then(() => results.lhr);
      });
    });
}

const opts = { chromeFlags: ['--show-paint-rects'] };

const asyncMiddleware = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

app.get(
  '/',
  asyncMiddleware(async (req, res, next) => {
    const results = await launchChromeAndRunLighthouse(
      'https://google.com',
      opts
    );
    res.json(results);
  })
);

app.listen(process.env.PORT || '5000', () => console.log('App don dey run'));
