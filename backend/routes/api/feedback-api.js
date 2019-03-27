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
    var feedbackInsertObj = {
      name: feedbackObj.name,
      email: feedbackObj.email,
      subject: feedbackObj.subject,
      message: feedbackObj.message
    };
    await MongoDB.insertData(AppConstants.DB_NAME, AppConstants.FEEDBACK_LIST, feedbackInsertObj);
    res.send(feedbackObj);

}

module.exports = new FeedbackApi();
