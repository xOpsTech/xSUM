var AppConstants = require('../../constants/AppConstants');
var MongoDB = require('../../db/mongodb');
var InfluxDB = require('../../db/influxdb');
var Helpers = require('../../common/Helpers');
var {ObjectId} = require('mongodb');
var moment = require('moment');
var crypto = require('crypto');

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

AlertApi.prototype.saveAlert = async function(req, res) {
    var alertObj = req.body;
    console.log(10, alertObj);
    var currentDateTime = moment().format(AppConstants.INFLUXDB_DATETIME_FORMAT);

    if (alertObj._id) {
        var objectToUpdate = {
        warningThreshold: alertObj.warningThreshold,
            criticalThreshold: alertObj.criticalThreshold,

            failureAlertEmailLimit: parseInt(alertObj.failureAlertEmailLimit),
            criticalAlertEmailLimit: parseInt(alertObj.criticalAlertEmailLimit),
            warningAlertEmailLimit: parseInt(alertObj.warningAlertEmailLimit),

            savedDateTime: currentDateTime
        };

        MongoDB.updateData(alertObj.tenantID, AppConstants.ALERT_LIST, {_id: ObjectId(alertObj._id)}, objectToUpdate);
        res.send(alertObj);
    } else {
        alertObj.jobId = alertObj.job.jobId;
        alertObj.warningAlertCount = 0;
        alertObj.criticalAlertCount = 0;

        alertObj.failureAlertCount = 0;
        alertObj.criticalMailCount = 0;
        alertObj.warningMailCount = 0;

        alertObj.failureAlertEmailLimit = AppConstants.DEF_EMAIL_FAILURE_ALERT_COUNT;
        alertObj.criticalAlertEmailLimit = AppConstants.DEF_EMAIL_CRITICAL_ALERT_COUNT;
        alertObj.warningAlertEmailLimit = AppConstants.DEF_EMAIL_WARNING_ALERT_COUNT;

        alertObj.savedDateTime = currentDateTime;
        delete alertObj.job;

        await MongoDB.insertData(alertObj.tenantID, AppConstants.ALERT_LIST, alertObj);
        res.send(alertObj);
    }

}

AlertApi.prototype.getAllAlerts = async function(req, res) {
    var userObj = req.body;
    var queryObj = {};
    var jobData = await MongoDB.getAllData(userObj.tenantID, AppConstants.DB_JOB_LIST, queryObj);

    var alertsData = [], defaultAlerts = [];

    for (let jobObj of jobData) {
        var queryToGetJobAlert = {
            jobId: jobObj.jobId
        };

        var alertObjData = await MongoDB.getAllData(userObj.tenantID, AppConstants.ALERT_LIST, queryToGetJobAlert);
        var jobResults = [];

        if (jobObj.testType === AppConstants.PING_TEST_TYPE) {
            jobResults = await InfluxDB.getAllDataFor(
                                userObj.tenantID,
                                "SELECT * FROM " + AppConstants.PING_RESULT_LIST+ " where jobid='" + jobObj.jobId+"'");
        }

        var meanCount = 0;
        for (let jobResult of jobResults) {
            meanCount += jobResult.response;
        }

        var meanAvg = meanCount/jobResults.length;
        var warningThreshold = (meanAvg) ? (meanAvg + 3000) : 3000; // 5000 in miliseconds
        var criticalThreshold = (meanAvg) ? (meanAvg + 5000) : 5000;

        if (alertObjData.length > 0) {

            for (let
                of alertObjData) {
                alertsData.push({
                    job: jobObj,
                    meanAvg: Helpers.roundValue(meanAvg/1000, 3),
                    warningThreshold: Helpers.roundValue(alertObject.warningThreshold, 3),
                    criticalThreshold: Helpers.roundValue(alertObject.criticalThreshold, 3),
                    _id: alertObject._id,
                    warningAlertCount: alertObject.warningAlertCount,
                    criticalAlertCount: alertObject.criticalAlertCount,

                    failureAlertCount: alertObject.failureAlertCount,
                    criticalMailCount: alertObject.criticalMailCount,
                    warningMailCount: alertObject.warningMailCount,

                    failureAlertEmailLimit: alertObject.failureAlertEmailLimit,
                    criticalAlertEmailLimit: alertObject.criticalAlertEmailLimit,
                    warningAlertEmailLimit: alertObject.warningAlertEmailLimit,

                    savedDateTime: alertObject.savedDateTime,
                    alertName: alertObject.alertName
                });
            }

        }

        defaultAlerts.push({
            job: jobObj,
            meanAvg: Helpers.roundValue(meanAvg/1000, 3),
            warningThreshold: Helpers.roundValue(warningThreshold / 1000, 3),
            criticalThreshold: Helpers.roundValue(criticalThreshold / 1000, 3),

            failureAlertEmailLimit: AppConstants.DEF_EMAIL_FAILURE_ALERT_COUNT,
            criticalAlertEmailLimit: AppConstants.DEF_EMAIL_CRITICAL_ALERT_COUNT,
            warningAlertEmailLimit: AppConstants.DEF_EMAIL_WARNING_ALERT_COUNT,
            alertName: ''
        });

    }

    res.send({alertsData: alertsData, jobList: jobData, defaultAlerts: defaultAlerts});
}

AlertApi.prototype.removeAlert = function(req, res) {
    var alertObj = req.body;
    var queryToRemoveAlert = {
        _id: ObjectId(alertObj.alertId)
    };
    console.log(alertObj.alertId)
    MongoDB.deleteOneData(alertObj.tenantID, AppConstants.ALERT_LIST, queryToRemoveAlert);
    res.send(queryToRemoveAlert);
}

AlertApi.prototype.sendRecoveryAlert = async function(databaseName, insertedJobObj) {

    var queryToGetJobAlert = {
        'job.jobId': insertedJobObj.jobId
    };

    var alertObjData = await MongoDB.getAllData(databaseName, AppConstants.ALERT_LIST, queryToGetJobAlert);

    var queryForLastTwoPingResults = "SELECT * FROM " + AppConstants.PING_RESULT_LIST +
                                     " where jobid='" + insertedJobObj.jobId +
                                     "' ORDER BY time DESC LIMIT 2";

    InfluxDB.getAllDataFor(databaseName, queryForLastTwoPingResults).then((data) => {
        var dataObj = data.map(values => (
            {response: values.response, resultId: values.resultID}
        ));
        var responseArray = [];

        for(var rsp of dataObj) {
            responseArray.push(rsp.response);
        }

        for (let alertObj of alertObjData) {
            var failureAlertEmailLimit = alertObj.failureAlertEmailLimit;
            var failureAlertCount =  alertObj.failureAlertCount;
            var warningThreshold = alertObj.warningThreshold;
            var criticalThreshold = alertObj.criticalThreshold;

            var previousResponseTime = responseArray[1]/1000;
            var currentResponseTime = responseArray[0]/1000;

            // When site recoverd from Warning stage
            if(previousResponseTime >= warningThreshold
                && previousResponseTime > currentResponseTime
                && previousResponseTime < criticalThreshold) {

                if(currentResponseTime < warningThreshold) {

                    var emailBodyToSend = 'xSUM alert recovery notification for '+insertedJobObj.jobName+'<br><br>'+
                                            'Test name: ' + insertedJobObj.siteObject.value + '<br>' +
                                            'Alert name: ' + insertedJobObj.jobName + '<br>'+
                                            'Alert level: Recoverd from Warning' + '<br>' +
                                            'Alert threshold: '+warningThreshold + '<br>' +
                                            'Previous Response time: ' + previousResponseTime + '<br>' +
                                            'Current Response time: ' + currentResponseTime;

                    Helpers.sendEmailAs(
                        insertedJobObj.userEmail,
                        'xSUM Alert Recovery for ' + insertedJobObj.jobName,
                        emailBodyToSend,
                        AppConstants.ALERT_EMAIL_TYPE
                    );

                    var objectToUpdate = {
                        warningAlertCount: 0,
                        warningMailCount: 0
                    };

                    MongoDB.updateData(
                        databaseName,
                        AppConstants.ALERT_LIST,
                        {_id: ObjectId(alertObj._id)},
                        objectToUpdate
                    );
                }
            }

            // When site recovered from Critical stage
            if(previousResponseTime >= criticalThreshold && previousResponseTime > currentResponseTime) {

                if(currentResponseTime < warningThreshold) {
                    var emailBodyToSend = 'xSUM alert recovery notification for ' + insertedJobObj.jobName + '<br><br>'+
                                            'Test name: ' + insertedJobObj.siteObject.value + '<br>' +
                                            'Alert name: ' + insertedJobObj.jobName + '<br>' +
                                            'Alert level: Recoverd from Critical' + '<br>'+
                                            'Alert threshold: ' + criticalThreshold + '<br>'+
                                            'Previous Response time: ' + previousResponseTime + '<br>' +
                                            'Current Response time: ' + currentResponseTime;

                    Helpers.sendEmailAs(
                        insertedJobObj.userEmail,
                        'xSUM Alert Recovery for ' + insertedJobObj.jobName,
                        emailBodyToSend,
                        AppConstants.ALERT_EMAIL_TYPE
                    );

                    var objectToUpdate = {
                        criticalAlertCount: 0,
                        criticalMailCount: 0
                    };

                    MongoDB.updateData(
                        databaseName,
                        AppConstants.ALERT_LIST,
                        {_id: ObjectId(alertObj._id)},
                        objectToUpdate
                    );
                }
            }

            // When alet goes from Critical to Warning
            if(previousResponseTime >= criticalThreshold && previousResponseTime > currentResponseTime) {

                if(currentResponseTime < criticalThreshold && currentResponseTime >= warningThreshold) {
                    var emailBodyToSend = 'xSUM alert goes Critical to Warning for ' + insertedJobObj.jobName + '<br><br>'+
                                            'Test name: ' + insertedJobObj.siteObject.value + '<br>' +
                                            'Alert name: ' + insertedJobObj.jobName + '<br>' +
                                            'Alert level: Critical to Warning' + '<br>' +
                                            'Alert threshold: ' + warningThreshold + '<br>' +
                                            'Previous Response time: ' + previousResponseTime + '<br>' +
                                            'Current Response time: ' + currentResponseTime;

                    Helpers.sendEmailAs(
                        insertedJobObj.userEmail,
                        'xSUM Alert Recovery for ' + insertedJobObj.jobName,
                        emailBodyToSend,
                        AppConstants.ALERT_EMAIL_TYPE
                    );


                    var objectToUpdate = {
                        criticalAlertCount: 0,
                        criticalMailCount: 0
                    };

                    MongoDB.updateData(
                        databaseName,
                        AppConstants.ALERT_LIST,
                        {_id: ObjectId(alertObj._id)},
                        objectToUpdate
                    );
                }
            }

            // When recoverd from a Failure state
            if(failureAlertCount <= failureAlertEmailLimit && failureAlertEmailLimit !== 0 && failureAlertCount !== 0) {

                if(currentResponseTime) {
                    var emailBodyToSend = 'xSUM alert recovery notification for ' + insertedJobObj.jobName + '<br><br>'+
                                            'Test name: ' + insertedJobObj.siteObject.value + '<br>' +
                                            'Alert name: ' + insertedJobObj.jobName  + '<br>' +
                                            'Alert level: Recoverd from Failure' + '<br>' +
                                            'Alert threshold: ' + warningThreshold + '<br>' +
                                            'Previous Response time: ' + previousResponseTime + '<br>' +
                                            'Current Response time: ' + currentResponseTime;

                    Helpers.sendEmailAs(
                        insertedJobObj.userEmail,
                        'xSUM Alert Recovery for ' + insertedJobObj.jobName,
                        emailBodyToSend,
                        AppConstants.ALERT_EMAIL_TYPE
                    );

                    var objectToUpdate = {
                        failureAlertCount: 0
                    }

                    MongoDB.updateData(
                        databaseName,
                        AppConstants.ALERT_LIST,
                        {_id: ObjectId(alertObj._id)},
                        objectToUpdate
                    );
                }

            }

            // When alert goes from Warning to Critical
            if(currentResponseTime >= criticalThreshold && previousResponseTime < currentResponseTime) {

                if(previousResponseTime >= warningThreshold && previousResponseTime < criticalThreshold) {

                    var emailBodyToSend = 'The response time for ' + insertedJobObj.siteObject.value +
                                            ' is increased from Warning Stage and now in Critical stage <br>' +
                                            'Test name: ' + insertedJobObj.siteObject.value + '<br>' +
                                            'Alert name: ' + insertedJobObj.jobName + '<br>' +
                                            'Alert level: Warning to Critical' + '<br>' +
                                            'Previous Response time: ' + previousResponseTime + '<br>' +
                                            'Current Response time: ' + currentResponseTime;

                    Helpers.sendEmailAs(
                        insertedJobObj.userEmail,
                        'xSUM Alert increased for ' + insertedJobObj.jobName,
                        emailBodyToSend,
                        AppConstants.ALERT_EMAIL_TYPE
                    );

                    var objectToUpdate = {
                        warningAlertCount: 0,
                        warningMailCount: 0
                    };

                    MongoDB.updateData(
                        databaseName,
                        AppConstants.ALERT_LIST,
                        {_id: ObjectId(alertObj._id)},
                        objectToUpdate
                    );
                }
            }
        }
    });
}

AlertApi.prototype.sendFailureAlert = async function(databaseName, JobObj) {
    var queryToGetFailureAlertCount = {
        'job.jobId': JobObj.jobId
    }

    var alertObjData = await MongoDB.getAllData(databaseName, AppConstants.ALERT_LIST, queryToGetFailureAlertCount);

    for (let alertObj of alertObjData) {
        var failureAlertCount =  alertObj.failureAlertCount;
        var failureAlertEmailLimit = alertObj.failureAlertEmailLimit;

        if(failureAlertEmailLimit > failureAlertCount) {
            var emailBodyToSend = 'Notification of XSUM Failue Alert for ' + JobObj.jobName + '<b>' +
                                    'Test name ' + JobObj.siteObject.value + '<b>' +
                                    'Alert name: ' + JobObj.jobName + '<br>' +
                                    'Response time: 0';
            Helpers.sendEmailAs(
                JobObj.userEmail,
                'Trouble of ping to your site',
                emailBodyToSend,
                AppConstants.ALERT_EMAIL_TYPE
            );

            failureAlertCount = failureAlertCount + 1

            var objectToUpdate = {
                failureAlertCount: failureAlertCount
            }

            MongoDB.updateData(
                databaseName,
                AppConstants.ALERT_LIST,
                {_id: ObjectId(alertObj._id)},
                objectToUpdate
            );
        }

    }
}

AlertApi.prototype.sendEmailAsAlert = async function(databaseName, insertedJobObj, result, resultID, tagsObj) {
    var queryToGetJobAlert = {
        'job.jobId': insertedJobObj.jobId
    };
    var alertObjData = await MongoDB.getAllData(databaseName, AppConstants.ALERT_LIST, queryToGetJobAlert);
    var resultStatus = AppConstants.NORMAL_STATUS;

    for (let alertObj of alertObjData) {
        var warningAlertEmailLimit = alertObj.warningAlertEmailLimit;
        var criticalAlertEmailLimit = alertObj.criticalAlertEmailLimit;

        if (result.response/1000 > alertObj.criticalThreshold) {
            resultStatus = AppConstants.CRITICAL_STATUS;
            var criticalMailCount = alertObj.criticalMailCount;
            let objectToUpdate;

            if(criticalMailCount < criticalAlertEmailLimit) {

                // Save alert with increasing critical alert count
                objectToUpdate = {
                    criticalMailCount: criticalMailCount + 1
                };
            } else {

                // Reset critical mail count
                objectToUpdate = {
                    criticalMailCount: 0
                };

                var emailBodyToSend = 'Notification of xSUM Critical Alert for ' + insertedJobObj.siteObject.value + '<br>' +
                                        'Test name: ' + insertedJobObj.jobName + '<br>' +
                                        'Alert threshold: ' + Helpers.roundValue(alertObj.criticalThreshold, 3) + 'seconds<br>' +
                                        'Response time: ' + Helpers.roundValue(result.response/1000, 3) + 'seconds<br>';

                Helpers.sendEmailAs(
                    insertedJobObj.userEmail,
                    'xSUM Critical Alert for ' + insertedJobObj.siteObject.value,
                    emailBodyToSend,
                    AppConstants.ALERT_EMAIL_TYPE
                );
            }

            MongoDB.updateData(
                databaseName,
                AppConstants.ALERT_LIST,
                {_id: ObjectId(alertObj._id)},
                objectToUpdate
            );

        } else if (result.response/1000 > alertObj.warningThreshold) {
            resultStatus = AppConstants.WARNING_STATUS;
            var warningMailCount = alertObj.warningMailCount;
            let objectToUpdate;

            if (warningMailCount < warningAlertEmailLimit) {
                objectToUpdate = {
                    warningMailCount: alertObj.warningMailCount + 1
                };
            } else {

                // Reset warning mail count
                objectToUpdate = {
                    warningMailCount: 0
                };

                // Send warning alert
                var emailBodyToSend = 'Notification of xSUM Warning Alert for ' + insertedJobObj.siteObject.value + '<br>' +
                                        'Test name: ' + insertedJobObj.jobName + '<br>' +
                                        'Alert threshold: ' + Helpers.roundValue(alertObj.warningThreshold, 3) + 'seconds<br>' +
                                        'Response time: ' + Helpers.roundValue(result.response/1000, 3) + 'seconds<br>';

                Helpers.sendEmailAs(
                    insertedJobObj.userEmail,
                    'xSUM Warning Alert for ' + insertedJobObj.siteObject.value,
                    emailBodyToSend,
                    AppConstants.ALERT_EMAIL_TYPE
                );

            }

            MongoDB.updateData(
                databaseName,
                AppConstants.ALERT_LIST,
                {_id: ObjectId(alertObj._id)},
                objectToUpdate
            );

        }

    }

    tagsObj.resultStatus = resultStatus;
    await InfluxDB.insertData(databaseName, AppConstants.PING_RESULT_LIST, tagsObj, result);
}

module.exports = new AlertApi();
