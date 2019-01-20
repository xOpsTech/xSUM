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

AlertApi.prototype.saveAlert = async function(req, res) {
    var alertObj = req.body;

    if (alertObj._id) {
        var objectToUpdate = {
            warningThreshold: alertObj.warningThreshold,
            criticalThreshold: alertObj.criticalThreshold
        };

        MongoDB.updateData(alertObj.tenantID, AppConstants.ALERT_LIST, {'job.jobId': alertObj.job.jobId}, objectToUpdate);
        res.send(alertObj);
    } else {
        alertObj.warningAlertCount = 0;
        alertObj.criticalAlertCount = 0;
        await MongoDB.insertData(alertObj.tenantID, AppConstants.ALERT_LIST, alertObj);
        res.send(alertObj);
    }

}

AlertApi.prototype.getAllAlerts = async function(req, res) {
    var userObj = req.body;
    var queryObj = {};
    var jobData = await MongoDB.getAllData(userObj.tenantID, AppConstants.DB_JOB_LIST, queryObj);

    var alertsData = [];

    for (let jobObj of jobData) {
        var queryToGetJobAlert = {
            'job.jobId': jobObj.jobId
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
        var warningThreshold = meanAvg + 3000; // 5000 in miliseconds
        var criticalThreshold = meanAvg + 5000;

        if (alertObjData.length > 0) {
            alertsData.push({
                job: jobObj,
                meanAvg: roundValue(meanAvg/1000, 3),
                warningThreshold: roundValue(alertObjData[0].warningThreshold, 3),
                criticalThreshold: roundValue(alertObjData[0].criticalThreshold, 3),
                _id: alertObjData[0]._id,
                warningAlertCount: alertObjData[0].warningAlertCount,
                criticalAlertCount: alertObjData[0].criticalAlertCount
            });
        } else {
            alertsData.push({
                job: jobObj,
                meanAvg: roundValue(meanAvg/1000, 3),
                warningThreshold: roundValue(warningThreshold / 1000, 3),
                criticalThreshold: roundValue(criticalThreshold / 1000, 3)
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
    MongoDB.deleteOneData(alertObj.tenantID, AppConstants.ALERT_LIST, queryToRemoveAlert);
    res.send(queryToRemoveAlert);
}

AlertApi.prototype.sendEmailAsAlert = async function(databaseName, insertedJobObj, executedTime) {
    var queryForPingResults = "SELECT * FROM "+AppConstants.PING_RESULT_LIST+" where jobid='" + insertedJobObj.jobId + "' and executedTime ='" + executedTime + "'";

    var jobResults = await InfluxDB.getAllDataFor(databaseName, queryForPingResults);

    var queryToGetJobAlert = {
        'job.jobId': insertedJobObj.jobId
    };

    var queryToGetTenantDetails = { _id: ObjectId(databaseName) };

    var tenantData = await MongoDB.getAllData(AppConstants.DB_NAME, AppConstants.TENANT_LIST, queryToGetTenantDetails);

    //give default alert count when alerts are not defnied
    if (tenantData.length > 0) {
        //give default alert count when alerts are not defnied
        if (typeof tenantData[0].alert === "undefined") {
            var emailCriticalAlertCount = AppConstants.EMAIL_CRITICAL_ALERT_COUNT
            var emailWarningAlertCount = AppConstants.EMAIL_WARNING_ALERT_COUNT
        }

        else {
            var emailCriticalAlertCount = tenantData[0].alert.warningAlertCount;
            var emailWarningAlertCount = tenantData[0].alert.criticalAlertCount;
        }
    }

    var alertObjData = await MongoDB.getAllData(databaseName, AppConstants.ALERT_LIST, queryToGetJobAlert);

    if (alertObjData.length > 0) {

        for (var j = 0; j < jobResults.length; j++) {

            if (jobResults[j].mean/1000 > parseInt(alertObjData[0].criticalThreshold)) {

                if (alertObjData[0].criticalAlertCount >= emailCriticalAlertCount) {
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

                    var alertJobs = {
                        alerts: {
                            critical: [],
                            warning: [],
                        }
                    }

                    var jobdata = await MongoDB.getAllData(databaseName, AppConstants.DB_JOB_LIST, { jobId: jobResults[j].jobid });

                    if (typeof alertJobs.alerts.critical === 'undefined')
                        alertJobs.alerts.critical = []
                    else
                        alertJobs.alerts.critical = jobdata[0].alerts.critical

                    alertJobs.alerts.critical.push({
                        time: jobResults[j].time,
                        resultID: jobResults[j].resultID,
                        response: jobResults[j].response,
                        status: "critical",
                    })

                    //add job details status wise for the DB_JOB_LIST
                    MongoDB.updateData(databaseName, AppConstants.DB_JOB_LIST, { jobId: jobResults[j].jobid }, alertJobs);

                    MongoDB.updateData(databaseName, AppConstants.ALERT_LIST, {'job.jobId': alertObjData[0].job.jobId}, objectToUpdate);
                    break;
                } else {
                    // Increase critical count
                    var objectToUpdate = {
                        criticalAlertCount: alertObjData[0].criticalAlertCount + 1
                    };

                    MongoDB.updateData(databaseName, AppConstants.ALERT_LIST, {'job.jobId': alertObjData[0].job.jobId}, objectToUpdate);
                }

            } else if (jobResults[j].mean/1000 > parseInt(alertObjData[0].warningThreshold)) {

                if (alertObjData[0].warningAlertCount >= emailWarningAlertCount) {
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

                    var alertJobs = {
                        alerts: {
                            critical: [],
                            warning: [],
                        }
                    }

                    if (typeof alertJobs.alerts.warning === 'undefined')
                        alertJobs.alerts.warning = []
                    else
                        alertJobs.alerts.warning = jobdata[0].alerts.warning

                    alertJobs.alerts.warning.push({
                        time: jobResults[j].time,
                        resultID: jobResults[j].resultID,
                        response: jobResults[j].response,
                        status: "warning",
                    })
                    //add job details status wise for the DB_JOB_LIST
                    MongoDB.updateData(databaseName, AppConstants.DB_JOB_LIST, { jobId: jobResults[j].jobid }, alertJobs);

                    MongoDB.updateData(databaseName, AppConstants.ALERT_LIST, {'job.jobId': alertObjData[0].job.jobId}, objectToUpdate);
                    break;
                } else {

                    // Increase warning count
                    var objectToUpdate = {
                        warningAlertCount: alertObjData[0].warningAlertCount + 1
                    };

                    MongoDB.updateData(databaseName, AppConstants.ALERT_LIST, {'job.jobId': alertObjData[0].job.jobId}, objectToUpdate);
                }

            }

        }

    }
}

function roundValue(value, decimalPlaces) {
    let num = Math.pow(10, decimalPlaces);
    return Math.round(value * num) / num;
}

module.exports = new AlertApi();
