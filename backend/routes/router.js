var express = require('express');
var Api = require('./api/api');
var UserApi = require('./api/user-api');

var router = express.Router();

router.route('/urlData').post(Api.handleUrlData);
router.route('/urlData').get(Api.handleTestData);
router.route('/handleJobs').post(Api.handleJobs);
router.route('/handleResults').post(Api.handleResults);

router.route('/userAuth').post(UserApi.handleUserData);

router.route('/').get(Api.handleHTML);
module.exports = router;
