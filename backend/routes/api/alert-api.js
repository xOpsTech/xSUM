var AppConstants = require('../../constants/AppConstants');
var MongoDB = require('../../db/mongodb');
var InfluxDB = require('../../db/influxdb');
var Helpers = require('../../common/Helpers');
var {ObjectId} = require('mongodb');

function AlertApi(){};

AlertApi.prototype.handleAlertData = function(req, res) {
    var action = req.query.action;
    switch (action) {
        case "saveAlert":
            new AlertApi().saveAlert(req, res);
            break;
        case "getAllAlerts":
            new AlertApi().getAllAlerts(req, res);
            break;
        case "removeAlert":
            new AlertApi().removeAlert(req, res);
            break;
        default:
            res.send("no data");
    }
}

AlertApi.prototype.saveAlert = function(req, res) {
    var alertObj = req.body;

    if (alertObj._id) {
        var objectToUpdate = {
            warningThreshold: alertObj.warningThreshold,
            criticalThreshold: alertObj.criticalThreshold
        };

        MongoDB.updateData(AppConstants.ALERT_LIST, {'job.jobId': alertObj.job.jobId}, objectToUpdate);
        res.send(alertObj);
    } else {
        alertObj.warningAlertCount = 0;
        alertObj.criticalAlertCount = 0;
        MongoDB.insertData(AppConstants.ALERT_LIST, alertObj, res);
    }

}

AlertApi.prototype.getAllAlerts = async function(req, res) {
    var userObj = req.body;
    var queryObj = {userEmail: userObj.userEmail};
    var jobData = await MongoDB.getAllData(AppConstants.DB_JOB_LIST, queryObj);

    var alertsData = [];

    for (var i = 0; i < jobData.length; i++) {
        var queryToGetJobAlert = {
            'job.jobId': jobData[i].jobId
        };

        var alertObjData = await MongoDB.getAllData(AppConstants.ALERT_LIST, queryToGetJobAlert);
        var jobResults = await InfluxDB.getAllDataFor("SELECT * FROM pageLoadTime where jobid='" + jobData[i].jobId+"'"); //+ "' and time >= '" + yesterDay + "'")

        var meanCount = 0;
        for (var j = 0; j < jobResults.length; j++) {
            meanCount += jobResults[j].mean;
        }

        var meanAvg = meanCount/jobResults.length;
        var warningThreshold = meanAvg + 3000; // 5000 in miliseconds
        var criticalThreshold = meanAvg + 5000;

        if (alertObjData.length > 0) {
            alertsData.push({
                job: jobData[i],
                meanAvg: meanAvg/1000,
                warningThreshold: alertObjData[0].warningThreshold,
                criticalThreshold: alertObjData[0].criticalThreshold,
                _id: alertObjData[0]._id,
                warningAlertCount: alertObjData[0].warningAlertCount,
                criticalAlertCount: alertObjData[0].criticalAlertCount
            });
        } else {
            alertsData.push({
                job: jobData[i],
                meanAvg: meanAvg/1000,
                warningThreshold: warningThreshold/1000,
                criticalThreshold: criticalThreshold/1000
            });
        }

    }

    res.send({alertsData: alertsData});
}

AlertApi.prototype.removeAlert = function(req, res) {
    var alertObj = req.body;
    var queryToRemoveAlert = {
        _id: ObjectId(alertObj.alertId)
    };
    MongoDB.deleteOneData(AppConstants.ALERT_LIST, queryToRemoveAlert, res);
}

AlertApi.prototype.sendEmailAsAlert = async function(insertedJobObj, curDateMilliSec) {
    // Send alert
    var jobResults = await InfluxDB.getAllDataFor(
        "SELECT * FROM pageLoadTime where jobid='"
        + insertedJobObj.jobId + "' and curDateMilliSec = '" + curDateMilliSec + "'"
    );

    var queryToGetJobAlert = {
        'job.jobId': insertedJobObj.jobId
    };

    var alertObjData = await MongoDB.getAllData(AppConstants.ALERT_LIST, queryToGetJobAlert);

    if (alertObjData.length > 0) {

        for (var j = 0; j < jobResults.length; j++) {

            if (jobResults[j].mean/1000 > parseInt(alertObjData[0].criticalThreshold)) {

                if (alertObjData[0].criticalAlertCount >= AppConstants.EMAIL_CRITICAL_ALERT_COUNT) {

                    // Send warning alert
                    var emailBodyToSend = 'Hi ,<br><br>' +
                                            'The job you have added for <b>' +
                                            insertedJobObj.siteObject.value +
                                            '</b> is having high respnse time.<br><br>' +
                                            'Regards,<br>xSUM admin';

                    Helpers.sendEmail(insertedJobObj.userEmail, 'Critical Alert from xSUM', emailBodyToSend);

                    // Save alert with decreasing critical alert count to 0
                    var objectToUpdate = {
                        criticalAlertCount: 0
                    };

                    MongoDB.updateData(AppConstants.ALERT_LIST, {'job.jobId': alertObjData[0].job.jobId}, objectToUpdate);
                    break;
                } else {

                    // Increase critical count
                    var objectToUpdate = {
                        criticalAlertCount: alertObjData[0].criticalAlertCount + 1
                    };

                    MongoDB.updateData(AppConstants.ALERT_LIST, {'job.jobId': alertObjData[0].job.jobId}, objectToUpdate);
                }

            } else if (jobResults[j].mean/1000 > parseInt(alertObjData[0].warningThreshold)) {

                if (alertObjData[0].warningAlertCount >= AppConstants.EMAIL_WARNING_ALERT_COUNT) {

                    // Send critical alert
                    var emailBodyToSend = 'Hi ,<br><br>' +
                                            'The job you have added for <b>' +
                                            insertedJobObj.siteObject.value +
                                            '</b> is having high respnse time.<br><br>' +
                                            'Regards,<br>xSUM admin';

                    Helpers.sendEmail(insertedJobObj.userEmail, 'Warning Alert from xSUM', emailBodyToSend);

                    // Save alert with decreasing warning alert count to 0
                    var objectToUpdate = {
                        warningAlertCount: 0
                    };

                    MongoDB.updateData(AppConstants.ALERT_LIST, {'job.jobId': alertObjData[0].job.jobId}, objectToUpdate);
                    break;
                } else {

                    // Increase warning count
                    var objectToUpdate = {
                        warningAlertCount: alertObjData[0].warningAlertCount + 1
                    };

                    MongoDB.updateData(AppConstants.ALERT_LIST, {'job.jobId': alertObjData[0].job.jobId}, objectToUpdate);
                }

            }

        }

    }
}

module.exports = new AlertApi();
