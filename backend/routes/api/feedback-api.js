var MongoDB = require('../../db/mongodb');
var InfluxDB = require('../../db/influxdb');
var AppConstants = require('../../constants/AppConstants');
var Helpers = require('../../common/Helpers');
var {ObjectId} = require('mongodb');

function FeedbackApi(){};

FeedbackApi.prototype.handleFeedbackData = function(req, res) {
    var action = req.query.action;
    switch (action) {
        case "saveFeedback":
            new FeedbackApi().saveFeedback(req, res);
            break;
        default:
            res.send("no data");
    }
}

FeedbackApi.prototype.saveFeedback = async function(req, res) {
    var feedbackObj = req.body;
    var feedbackList = AppConstants.UNLOGIN_FEEDBACK_LIST
    if (feedbackObj.loggedUserObj) {
      feedbackList = AppConstants.FEEDBACK_LIST;
    }
    var feedbackInsertObj = {
      name: feedbackObj.name,
      email: feedbackObj.email,
      subject: feedbackObj.subject,
      message: feedbackObj.message
    };

    await MongoDB.insertData(AppConstants.DB_NAME, feedbackList, feedbackInsertObj);

    var emailBodyToSend = 'xSUM feedback added <br><br>' +
    'user name: ' + feedbackInsertObj.name + '<br>' +
    'user email: ' + feedbackInsertObj.email + '<br>' +
    'subeject: ' + feedbackInsertObj.subject + '<br>' +
    'message: ' + feedbackInsertObj.message

    Helpers.sendEmailAs(
        feedbackInsertObj.email,
        'xSUM-Feedback',
        emailBodyToSend,
        AppConstants.ADMIN_EMAIL_TYPE
    );
    res.send(feedbackObj);

}

module.exports = new FeedbackApi();
