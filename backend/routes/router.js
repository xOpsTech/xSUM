var express = require('express');
var Api = require('./api/api');
var UserApi = require('./api/user-api');
var SuperUserApi = require('./api/super-user-api');
var JobApi = require('./api/job-api');
var AlertApi = require('./api/alert-api');
var TenantApi = require('./api/tenant-api');
var FeedbackApi = require('./api/feedback-api');
var router = express.Router();

router.route('/urlData').post(Api.handleUrlData);
router.route('/urlData').get(Api.handleTestData);
router.route('/handleJobs').post(JobApi.handleJobs);
router.route('/handleResults').post(Api.handleResults);

router.route('/userAuth').post(UserApi.handleUserData);
router.route('/userAuth').get(UserApi.handleUserGetData);
router.route('/superUserAuth').post(SuperUserApi.handleSuperUserData);
router.route('/alert').post(AlertApi.handleAlertData);
router.route('/tenant').post(TenantApi.handleTenantData);
router.route('/feedback').post(FeedbackApi.handleFeedbackData);

router.route('/').get(Api.handleHTML);
module.exports = router;
