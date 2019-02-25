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
            criticalThreshold: alertObj.criticalThreshold,
            failureAlertEmailLimit: alertObj.failureAlertEmailLimit,
            criticalAlertEmailLimit: alertObj.criticalAlertEmailLimit,
            warningAlertEmailLimit: alertObj.warningAlertEmailLimit
        };

        MongoDB.updateData(alertObj.tenantID, AppConstants.ALERT_LIST, {'job.jobId': alertObj.job.jobId}, objectToUpdate);
        res.send(alertObj);
    } else {
        alertObj.warningAlertCount = 0;
        alertObj.criticalAlertCount = 0;
        alertObj.failureAlertCount = 0;
        alertObj.criticalMailCount = 0;
        alertObj.warningMailCount = 0;


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
        var warningThreshold = (meanAvg) ? (meanAvg + 3000) : 3000; // 5000 in miliseconds
        var criticalThreshold = (meanAvg) ? (meanAvg + 5000) : 5000;

        if (alertObjData.length > 0) {
            alertsData.push({
                job: jobObj,
                meanAvg: Helpers.roundValue(meanAvg/1000, 3),
                warningThreshold: Helpers.roundValue(alertObjData[0].warningThreshold, 3),
                criticalThreshold: Helpers.roundValue(alertObjData[0].criticalThreshold, 3),
                _id: alertObjData[0]._id,
                warningAlertCount: alertObjData[0].warningAlertCount,
                criticalAlertCount: alertObjData[0].criticalAlertCount,
                failureAlertCount: alertObjData[0].failureAlertCount,
                criticalMailCount: alertObjData[0].criticalMailCount,
                warningMailCount: alertObjData[0].warningMailCount,

                failureAlertEmailLimit: alertObjData[0].failureAlertEmailLimit,
                criticalAlertEmailLimit: alertObjData[0].criticalAlertEmailLimit,
                warningAlertEmailLimit: alertObjData[0].warningAlertEmailLimit
            });
        } else {
            alertsData.push({
                job: jobObj,
                meanAvg: Helpers.roundValue(meanAvg/1000, 3),
                warningThreshold: Helpers.roundValue(warningThreshold / 1000, 3),
                criticalThreshold: Helpers.roundValue(criticalThreshold / 1000, 3),
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

AlertApi.prototype.sendRecoveryAlert = async function(databaseName, insertedJobObj) {

    var queryToGetJobAlert = {
        'job.jobId': insertedJobObj.jobId
    };

    var alertObjData = await MongoDB.getAllData(databaseName, AppConstants.ALERT_LIST, queryToGetJobAlert);

    var queryForLastTwoPingResults = "SELECT * FROM "+AppConstants.PING_RESULT_LIST+" where jobid='" + insertedJobObj.jobId + "' ORDER BY time DESC LIMIT 2";

    InfluxDB.getAllDataFor(databaseName, queryForLastTwoPingResults).then((data)=>
    {
        var dataObj = data.map(values=>({response:values.response,resultId:values.resultID}));
        var responseArray = [];
        var resultArray = [];

        for(var rsp of dataObj) {
            responseArray.push(rsp.response)
            resultArray.push(rsp.resultId)
        }

        if (alertObjData.length > 0) {

            var failureAlertEmailLimit = alertObjData[0].failureAlertEmailLimit;
            var failureAlertCount =  alertObjData[0].failureAlertCount;
            var warningThreshold = alertObjData[0].warningThreshold;
            var criticalThreshold = alertObjData[0].criticalThreshold;

            var previousResponseTime = responseArray[1]/1000;
            var currentResponseTime = responseArray[0]/1000;

            //When site recoverd from Warning stage
            if(previousResponseTime >= warningThreshold && previousResponseTime > currentResponseTime && previousResponseTime < criticalThreshold) {

                if(currentResponseTime < warningThreshold) {

                    var emailBodyToSend = 'xSUM alert recovery notification for '+insertedJobObj.jobName+'<br><br>'+
                    'Test name: '+insertedJobObj.siteObject.value +'<br>'+
                    'Alert name: '+insertedJobObj.jobName +'<br>'+
                    'Alert level: Recoverd from Warning' +'<br>'+
                    'Alert threshold: '+warningThreshold +'<br>'+
                    'Previous Response time: '+previousResponseTime+'<br>'+
                    'Current Response time: '+currentResponseTime;

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

                    MongoDB.updateData(databaseName, AppConstants.ALERT_LIST, {'job.jobId': alertObjData[0].job.jobId}, objectToUpdate);
                }
            }

            //When site recovered from Critical stage
            if(previousResponseTime >= criticalThreshold && previousResponseTime > currentResponseTime) {

                if(currentResponseTime < warningThreshold) {

                    var emailBodyToSend = 'xSUM alert recovery notification for '+insertedJobObj.jobName+'<br><br>'+
                    'Test name: '+insertedJobObj.siteObject.value +'<br>'+
                    'Alert name: '+insertedJobObj.jobName +'<br>'+
                    'Alert level: Recoverd from Critical' +'<br>'+
                    'Alert threshold: '+criticalThreshold +'<br>'+
                    'Previous Response time: '+previousResponseTime+'<br>'+
                    'Current Response time: '+currentResponseTime;

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

                    MongoDB.updateData(databaseName, AppConstants.ALERT_LIST, {'job.jobId': alertObjData[0].job.jobId}, objectToUpdate);
                }
            }

            //When alet goes from Critical to Warning
            if(previousResponseTime >= criticalThreshold && previousResponseTime > currentResponseTime) {

                if(currentResponseTime < criticalThreshold && currentResponseTime >= warningThreshold) {

                    var emailBodyToSend = 'xSUM alert goes Critical to Warning for '+insertedJobObj.jobName+'<br><br>'+
                    'Test name: '+insertedJobObj.siteObject.value +'<br>'+
                    'Alert name: '+insertedJobObj.jobName +'<br>'+
                    'Alert level: Critical to Warning'+'<br>'+
                    'Alert threshold: '+warningThreshold +'<br>'+
                    'Previous Response time: '+previousResponseTime+'<br>'+
                    'Current Response time: '+currentResponseTime;

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

                    MongoDB.updateData(databaseName, AppConstants.ALERT_LIST, {'job.jobId': alertObjData[0].job.jobId}, objectToUpdate);
                }
            }

            //When recoverd from a Failure state
            if(failureAlertCount <=failureAlertEmailLimit && failureAlertEmailLimit!==0 && failureAlertCount!==0)
            {
                if(currentResponseTime)
                {
                    var emailBodyToSend = 'xSUM alert recovery notification for '+insertedJobObj.jobName+'<br><br>'+
                    'Test name: '+insertedJobObj.siteObject.value +'<br>'+
                    'Alert name: '+insertedJobObj.jobName +'<br>'+
                    'Alert level: Recoverd from Failure' +'<br>'+
                    'Alert threshold: '+warningThreshold +'<br>'+
                    'Previous Response time: '+previousResponseTime+'<br>'+
                    'Current Response time: '+currentResponseTime;

                    Helpers.sendEmailAs(
                        insertedJobObj.userEmail,
                        'xSUM Alert Recovery for ' + insertedJobObj.jobName,
                        emailBodyToSend,
                        AppConstants.ALERT_EMAIL_TYPE
                    );

                    var objectToUpdate = {
                        failureAlertCount: 0
                    }

                    MongoDB.updateData(databaseName, AppConstants.ALERT_LIST, {'job.jobId': alertObjData[0].job.jobId}, objectToUpdate);
                }
            }

            //When alert goes from Warning to Critical
            if(currentResponseTime >= criticalThreshold && previousResponseTime < currentResponseTime) {

                if(previousResponseTime >= warningThreshold && previousResponseTime < criticalThreshold) {

                    var emailBodyToSend =
                        'The response time for '+insertedJobObj.siteObject.value +' is increased from Warning Stage and now in Critical stage <br>'+
                        'Test name: '+insertedJobObj.siteObject.value +'<br>'+
                        'Alert name: '+insertedJobObj.jobName +'<br>'+
                        'Alert level: Warning to Critical'+'<br>'+
                        'Previous Response time: '+previousResponseTime+'<br>'+
                        'Current Response time: '+currentResponseTime;

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

                    MongoDB.updateData(databaseName, AppConstants.ALERT_LIST, {'job.jobId': alertObjData[0].job.jobId}, objectToUpdate);
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

    if (alertObjData.length > 0) {

        var alertObjData = await MongoDB.getAllData(databaseName, AppConstants.ALERT_LIST, queryToGetFailureAlertCount);

        var failureAlertCount =  alertObjData[0].failureAlertCount;
        var failureAlertEmailLimit = alertObjData[0].failureAlertEmailLimit;

        if(failureAlertEmailLimit > failureAlertCount) {

            var emailBodyToSend =
                'Notification of XSUM Failue Alert for '+ JobObj.jobName +'<b>' +
                'Test name '+ JobObj.siteObject.value +'<b>' +
                'Alert name: ' + JobObj.jobName +'<br>'+
                'Response time: 0'
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

            MongoDB.updateData(databaseName, AppConstants.ALERT_LIST, {'job.jobId': alertObjData[0].job.jobId}, objectToUpdate);
        }
    }
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

        var warningAlertEmailLimit= alertObjData[0].warningAlertEmailLimit;
        var criticalAlertEmailLimit= alertObjData[0].criticalAlertEmailLimit;

        for (var j = 0; j < jobResults.length; j++) {

            if (jobResults[j].response/1000 > parseInt(alertObjData[0].criticalThreshold)) {

                if (alertObjData[0].criticalAlertCount >= emailCriticalAlertCount) {

                    var warningMailCount = alertObjData[0].warningMailCount;
                    var criticalMailCount = alertObjData[0].criticalMailCount;


                if(criticalMailCount < criticalAlertEmailLimit) {

                    var emailBodyToSend = 'Hi ,<br><br>' +
                                            'The job you have added for <b>' +
                                            insertedJobObj.siteObject.value +
                                            '</b> is having high respnse time.<br><br>' +
                                            'Regards,<br>xSUM admin';

                    Helpers.sendEmailAs(
                        insertedJobObj.userEmail,
                        'Critical Alert from xSUM',
                        emailBodyToSend,
                        AppConstants.ALERT_EMAIL_TYPE
                    );

                    // Save alert with decreasing critical alert count to 0
                    var objectToUpdate = {
                        criticalAlertCount: 0,
                        criticalMailCount: criticalMailCount + 1
                    };

                    var alertJobs = {
                        alerts: {
                            critical: [],
                            warning: [],
                        }
                    }

                    var jobData = await MongoDB.getAllData(databaseName, AppConstants.DB_JOB_LIST, { jobId: jobResults[j].jobid });

                    if (typeof alertJobs.alerts.critical === 'undefined')
                        alertJobs.alerts.critical = []
                    else
                        alertJobs.alerts.critical = jobData[0].alerts.critical

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
                }

                } else {

                    if(alertObjData[0].criticalAlertCount == 0)
                    {
                        var emailBodyToSend = 'Hi ,<br><br>' +
                        'The job you have added for <b>' +
                        insertedJobObj.siteObject.value +
                        '</b> is having high respnse time.<br><br>' +
                        'Regards,<br>xSUM admin';

                        Helpers.sendEmailAs(
                            insertedJobObj.userEmail,
                            'Critical Alert from xSUM',
                            emailBodyToSend,
                            AppConstants.ALERT_EMAIL_TYPE
                        );

                        var object = {
                            criticalMailCount: alertObjData[0].criticalMailCount + 1
                        };

                         MongoDB.updateData(databaseName, AppConstants.ALERT_LIST, {'job.jobId': alertObjData[0].job.jobId}, object);
                    }
                    // Increase critical count
                    var objectToUpdate = {
                        criticalAlertCount: alertObjData[0].criticalAlertCount + 1
                    };

                    MongoDB.updateData(databaseName, AppConstants.ALERT_LIST, {'job.jobId': alertObjData[0].job.jobId}, objectToUpdate);
                }

            } else if (jobResults[j].response/1000 > parseInt(alertObjData[0].warningThreshold)) {

                if (alertObjData[0].warningAlertCount >= emailWarningAlertCount) {

                    if(warningMailCount < warningAlertEmailLimit) {
                    // Send critical alert
                    var emailBodyToSend = 'Hi ,<br><br>' +
                                            'The job you have added for <b>' +
                                            insertedJobObj.siteObject.value +
                                            '</b> is having high respnse time.<br><br>' +
                                            'Regards,<br>xSUM admin';

                    Helpers.sendEmailAs(
                        insertedJobObj.userEmail,
                        'Warning Alert from xSUM',
                        emailBodyToSend,
                        AppConstants.ALERT_EMAIL_TYPE
                    );

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

                    var jobData = await MongoDB.getAllData(databaseName, AppConstants.DB_JOB_LIST, { jobId: jobResults[j].jobid });

                    if (typeof alertJobs.alerts.warning === 'undefined')
                        alertJobs.alerts.warning = []
                    else
                        alertJobs.alerts.warning = jobData[0].alerts.warning

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
                    }
                }
                else {

                    if(alertObjData[0].warningAlertCount == 0) {

                        var emailBodyToSend = 'Hi ,<br><br>' +
                        'The job you have added for <b>' +
                        insertedJobObj.siteObject.value +
                        '</b> is having high respOnse time.<br><br>' +
                        'Regards,<br>xSUM admin';

                        Helpers.sendEmailAs(
                            insertedJobObj.userEmail,
                            'Warning Alert from xSUM',
                            emailBodyToSend,
                            AppConstants.ALERT_EMAIL_TYPE
                        );

                        var object = {
                            warningMailCount: alertObjData[0].warningMailCount + 1
                        };

                        MongoDB.updateData(databaseName, AppConstants.ALERT_LIST, {'job.jobId': alertObjData[0].job.jobId}, object);
                    }
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
