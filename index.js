const express = require('express');
const cors = require('cors');

const {
  asyncMiddleware,
  extractResult,
  launchChromeAndRunLighthouse
} = require('./libs');

const app = express();
app.use(cors());

app.get(
  '/audit',
  asyncMiddleware(async (req, res, next) => {
    if (req.query.url) {
      const results = await launchChromeAndRunLighthouse(req.query.url);
      res.json(extractResult(results));
    } else {
      res.json({
        error: true,
        message: `You're not specifying any URL`
      });
    }
  })
);

app.listen(process.env.PORT || 8081, () => console.log('App don dey run'));
