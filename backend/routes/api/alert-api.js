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
    var queryObj = {userEmail: userObj.userEmail};
    var jobData = await MongoDB.getAllData(userObj.tenantID, AppConstants.DB_JOB_LIST, queryObj);

    var alertsData = [];

    for (var i = 0; i < jobData.length; i++) {
        var queryToGetJobAlert = {
            'job.jobId': jobData[i].jobId
        };

        var alertObjData = await MongoDB.getAllData(userObj.tenantID, AppConstants.ALERT_LIST, queryToGetJobAlert);
        var jobResults = await InfluxDB.getAllDataFor(userObj.tenantID, "SELECT * FROM pageLoadTime where jobid='" + jobData[i].jobId+"'"); //+ "' and time >= '" + yesterDay + "'")

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
    MongoDB.deleteOneData(alertObj.tenantID, AppConstants.ALERT_LIST, queryToRemoveAlert);
    res.send(queryToRemoveAlert);
}

AlertApi.prototype.sendEmailAsAlert = async function(databaseName, insertedJobObj, curDateMilliSec) {
    // Send alert
    var jobResults = await InfluxDB.getAllDataFor(
        databaseName,
        "SELECT * FROM pageLoadTime where jobid='"
        + insertedJobObj.jobId + "' and curDateMilliSec = '" + curDateMilliSec + "'"
    );

    var queryToGetJobAlert = {
        'job.jobId': insertedJobObj.jobId
    };

    var queryToGetTenantDetails = { email: insertedJobObj.userEmail };

    var tenantData = await MongoDB.getAllData(AppConstants.DB_NAME, AppConstants.TENANT_LIST, queryToGetTenantDetails);
    var tenantId = tenantData[0]._id

    //give default alert count when alerts are not defnied
    if (typeof tenantData[0].alert === "undefined") {
        var emailCriticalAlertCount = AppConstants.EMAIL_CRITICAL_ALERT_COUNT
        var emailWarningAlertCount = AppConstants.EMAIL_WARNING_ALERT_COUNT
    }

    else {
        var emailCriticalAlertCount = tenantData[0].alert.critical_alert_limit;
        var emailWarningAlertCount = tenantData[0].alert.warning_alert_limit;
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
                        jobs: {
                            critical: [],
                            warning: [],
                        }
                    }

                    if(typeof alertJobs.jobs.critical === 'undefined')
                        alertJobs.jobs.critical=[]
                    else
                        alertJobs.jobs.critical = tenantData[0].jobs.critical
                 
                    alertJobs.jobs.critical.push({
                        jobid: jobResults[j].jobid,
                        time: jobResults[j].time,
                        resultID: jobResults[j].resultID,
                        status: "critical",
                    })

                    //add job details status wise for the tenantLIST
                    MongoDB.updateData(AppConstants.DB_NAME, AppConstants.TENANT_LIST, { _id: tenantId }, alertJobs);

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
                        jobs: {
                            critical: [],
                            warning: [],
                        }
                    }

                    if(typeof alertJobs.jobs.critical === 'undefined')
                    alertJobs.jobs.warning=[]
                    else
                    alertJobs.jobs.warning = tenantData[0].jobs.warning
                   
                    alertJobs.jobs.warning.push({
                        jobid: jobResults[j].jobid,
                        time: jobResults[j].time,
                        resultID: jobResults[j].resultID,
                        status: "warning",
                    })
                    //add job details status wise for the tenantLIST
                    MongoDB.updateData(AppConstants.DB_NAME, AppConstants.TENANT_LIST, { _id: tenantId }, alertJobs);

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

module.exports = new AlertApi();
