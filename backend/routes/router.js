var express = require('express');
var Api = require('./api/api');

var router = express.Router();

router.route('/urlData').post(Api.handleUrlData);
router.route('/urlData').get(Api.handleTestData);
module.exports = router;
