var nodemailer = require('nodemailer');
var AppConstants = require('../constants/AppConstants');
var AlertApi = require('../routes/api/alert-api');
var InfluxDB = require('../db/influxdb');
var MongoDB = require('../db/mongodb');
var request = require('request');
var crypto = require('crypto');
var config = require('../config/config');
var moment = require('moment');
var cmd = require('node-cmd');
const phantom = require('phantom');
var fileSystem = require('file-system');
const Client = require('kubernetes-client').Client;

function Helpers(){};

exports.sendEmail = function(toMailAddress, subject, html, res) {
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: AppConstants.EMAIL_USERNAME,
            pass: AppConstants.EMAIL_PASSWORD
        }
    });

    var mailOptions = {
        from: AppConstants.EMAIL_USERNAME,
        to: toMailAddress,
        subject: subject,
        html: html
    };

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
            //res.send({message: AppConstants.RESPONSE_ERROR});
        } else {
            console.log('Email sent: ' + info.response);
            //res.send({message: AppConstants.RESPONSE_SUCCESS});
        }
    });
}

exports.sendEmailFrom = function(fromMailAddress, fromPassword, toMailAddress, subject, html, res) {
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: fromMailAddress,
            pass: fromPassword
        }
    });

    var mailOptions = {
        from: fromMailAddress,
        to: toMailAddress,
        subject: subject,
        html: html
    };

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
            //res.send({message: AppConstants.RESPONSE_ERROR});
        } else {
            console.log('Email sent: ' + info.response);
            //res.send({message: AppConstants.RESPONSE_SUCCESS});
        }
    });
}

exports.sendEmailAs = function(toMailAddress, subject, html, emailType, attachments) {
    var sendingMail, sendingMailPassword;
    switch (emailType) {
        case AppConstants.ADMIN_EMAIL_TYPE:
            sendingMail = AppConstants.ADMIN_EMAIL_USERNAME;
            sendingMailPassword = AppConstants.ADMIN_EMAIL_PASSWORD;
            break;
        case AppConstants.ALERT_EMAIL_TYPE:
            sendingMail = AppConstants.ALERT_EMAIL_USERNAME;
            sendingMailPassword = AppConstants.ALERT_EMAIL_PASSWORD;
            break;
        default:
            sendingMail = '';
            sendingMailPassword = '';
            break;
    }
    var transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
            user: sendingMail,
            pass: sendingMailPassword
        }
    });

    var mailOptions = {
        from: sendingMail,
        to: toMailAddress,
        subject: subject,
        html: html
    };

    if (attachments && attachments.length > 0) {
        mailOptions.attachments = attachments;
    }

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
            //res.send({message: AppConstants.RESPONSE_ERROR});
        } else {
            console.log('Email sent: ' + info.response);
            //res.send({message: AppConstants.RESPONSE_SUCCESS});
        }
    });
}

exports.executePingJob = function(databaseName, jobObj, isOneTimeTest) {
    request({
        uri: jobObj.securityProtocol + jobObj.urlValue,
        method: 'GET',
        time: true
    }, (err, resp) => {
        if (resp) {
            console.log('Successfully executed the job : ', jobObj.jobId);
            var resultID = crypto.randomBytes(10).toString('hex');
            var tagsObj = { jobid: jobObj.jobId, resultID: resultID, executedTime: jobObj.currentDateTime };

            // Insert data for single user test
            databaseName === AppConstants.DB_NAME
                && InfluxDB.insertData(databaseName, AppConstants.PING_RESULT_LIST, tagsObj, resp.timings);

            // sendEmailAsAlert method calls the insert method to put results in influx db
            databaseName !== AppConstants.DB_NAME
                && AlertApi.sendEmailAsAlert(databaseName, jobObj, resp.timings, resultID, tagsObj);
            databaseName !== AppConstants.DB_NAME
                && AlertApi.sendRecoveryAlert(databaseName, jobObj);

            if (isOneTimeTest) {
                var newValueObj = {
                    status: 'Done',
                    resultID: resultID
                };
                MongoDB.updateData(AppConstants.DB_NAME, AppConstants.DB_URL_LIST, {jobId: jobObj.jobId}, newValueObj);
            }

        } else if (err) {

            var resultID = crypto.randomBytes(10).toString('hex');
            var tagsObj = { jobid: jobObj.jobId, resultID: resultID, executedTime: jobObj.currentDateTime };

            obj = {
                socket: 0,
                lookup: 0,
                connect:0,
                response:0.000000000,
                end:0

            }
            InfluxDB.insertData(databaseName, AppConstants.PING_RESULT_LIST, tagsObj, obj);

            AlertApi.sendFailureAlert(databaseName, jobObj);
        }

    })
}

exports.executeScriptJob = async function(databaseName, collectionName, jobToExecute) {
    var resultID = crypto.randomBytes(10).toString('hex');
    var locationTitle = jobToExecute.serverLocation.textValue;
    var locationLatitude = jobToExecute.serverLocation.latitude;
    var locationLongitude = jobToExecute.serverLocation.longitude;

    var curDateMilliSec = new Date().getTime();

    let scriptFilePath = 'scripts/tenantid-' + databaseName + '/jobid-' + jobToExecute.jobId;
    let fileName = '/script-1.js';

    fileSystem.mkdir(scriptFilePath, {recursive: true}, (err) => {

        if (err) {
            console.log('Error in creating directories' + scriptFilePath, err);
            throw err;
        } else {

            fileSystem.writeFile(scriptFilePath + fileName, jobToExecute.scriptValue, async (err) => {
                if (err) {
                    console.log('Error in creating file' + fileName, err);
                    throw err;
                } else {
                    var createdJobObj = await this.executeOneTimeJob(databaseName, jobToExecute);
                    console.log("Job creation successful in cluster side ", createdJobObj);
                }
            });
        }

    });

}

exports.executeOneTimeJob = async function(databaseName, jobToExecute) {
    var resultID = crypto.randomBytes(10).toString('hex');
    var locationTitle = jobToExecute.serverLocation.textValue;
    var locationLatitude = jobToExecute.serverLocation.latitude;
    var locationLongitude = jobToExecute.serverLocation.longitude;

    var curDateMilliSec = new Date().getTime();

    // Create the job
    const client = new Client({
        config: {
            url: config.CLUSTER_URL,
            auth: {
                user: AppConstants.CLUSTER_USERNAME,
                pass: AppConstants.CLUSTER_PASSWORD,
            },
            insecureSkipTlsVerify: true
        }
    });
    await client.loadSpec();

    const deploymentManifest = {
        kind: "Job",
        spec: {
            template: {
                spec: {
                    containers: [
                        {
                            image: "sitespeedio/sitespeed.io:8.7.5",
                            name: "sitespeed",
                            command: [
                                "/start.sh",
                                "-n",
                                "1",
                                "--influxdb.host",
                                config.INFLUXDB_IP,
                                "--influxdb.port",
                                "8086",
                                "--influxdb.database",
                                databaseName,
                                "--browser",
                                jobToExecute.browser,
                                "--influxdb.tags",
                                "jobid=" + jobToExecute.jobId + ",resultID=" + resultID + ",locationTitle=" + locationTitle + ",latitude=" + locationLatitude + ",longitude=" + locationLongitude + ",curDateMilliSec=" + curDateMilliSec,
                                jobToExecute.securityProtocol + jobToExecute.siteObject.value
                            ]
                        }
                    ],
                    restartPolicy: "Never"
                }
            },
            backoffLimit: 4
        },
        apiVersion: "batch/v1",
        metadata: {
            name: "sitespeedjob" + curDateMilliSec
        }
    };
    const create = await client.apis.batch.v1.namespaces('default').jobs.post({ body: deploymentManifest });
    return create;
}

exports.sendEmailRegardingOneTimeJob = async function(tenantID, jobObj) {
    var oneTimeTestResultURL = config.API_URL + '/#/auth-job-result?tag=' + jobObj.authKey;

    let objectToRetrieveResults = {jobId: jobObj.jobId, tenantID: tenantID};

    let htmlPath = 'one-time-results/';
    let fileName = 'result.html';
    let rederedImageDir = htmlPath + 'tenantid-' + tenantID + '/jobid-' + jobObj.jobId;
    let renderedImageName = '/image.png';
    let renderedImgPath = rederedImageDir + renderedImageName;

    let oneTimeResults = await this.getJobResultsBackDate(tenantID, jobObj, false, true);
    let chartData = await this.getArrangedChartData(tenantID, jobObj, oneTimeResults);

    let contentToWrite = (
        '<style>' +
        '.chartdiv {' +
            'width: 800px;' +
            'height: 220px;' +
            'margin: 30px 0;' +
            'border: 1px solid #ccc;' +
        '}' +
        '</style>' +
        '<script src="../../lib/js/am-charts/v3/amcharts.js">' +
        '</script><script src="../../lib/js/am-charts/v3/serial.js">' +
        '</script><script src="../../lib/js/am-charts/v3/light.js">' +
        '</script><script src="../../lib/js/am-charts/v3/pie.js"></script>' +
        '<div><h4>Response Time</h4><div id="responseTime" class="chartdiv"></div></div>' +
        '<div><h4>DNS Time</h4><div id="dnsLookUpTime" class="chartdiv"></div></div>' +
        '<div><h4>TCP Connect Time</h4><div id="tcpConnectTime" class="chartdiv"></div></div>' +
        '<div><h4>Last Byte Recieve Time</h4><div id="lastByteRecieveTime" class="chartdiv"></div></div>' +
        this.createCharts(chartData, 'responseTime') +
        this.createCharts(chartData, 'dnsLookUpTime') +
        this.createCharts(chartData, 'tcpConnectTime') +
        this.createCharts(chartData, 'lastByteRecieveTime')
    );

    fileSystem.writeFile(htmlPath + fileName, contentToWrite, async (err) => {

        if (err) {
            console.log('Error in writing to file' + fileName, err);
            throw err;
        } else {

            // Create directory to store image
            fileSystem.mkdir(rederedImageDir, {recursive: true}, async (err) => {

                if (err) {
                    console.log('Error in creating directories' + rederedImageDir, err);
                    throw err;
                } else {
                    const instance = await phantom.create();
                    const page = await instance.createPage();
                    let urlToOpen = config.API_URL + '/one-time-test';
                    const status = await page.open(urlToOpen);
                    setTimeout(async function() {
                        await page.render(renderedImgPath);
                        await instance.exit();
                    }, 5000);

                }

            });

        }

    });

    let results = await this.getSummaryResults(objectToRetrieveResults, false);
    var emailBodyToSend = '<div><h3>Test Results - ' + jobObj.jobName + '</h3>' +
                          '<img src="' + config.API_URL + '/' + renderedImgPath + '"/>';

    for (let result of results.summaryResults) {
        emailBodyToSend += this.getTileTagString(result);
    }

    emailBodyToSend += '</div>';
    this.sendEmailAs (
        jobObj.userEmail,
        'xSUM - One Time Test - ' + jobObj.siteObject.value,
        emailBodyToSend,
        AppConstants.ADMIN_EMAIL_TYPE
    );

}

exports.getArrangedChartData = async function (tenantID, job, jobResults) {
    var queryToGetJobAlert = {
        jobId: job.jobId
    };

    var alertObjData = await MongoDB.getAllData(tenantID, AppConstants.ALERT_LIST, queryToGetJobAlert);
    var savedDateTime, criticalThreshold, warningThreshold;

    for (var thresHold of alertObjData) {
        criticalThreshold = thresHold.criticalThreshold;
        warningThreshold = thresHold.warningThreshold;
        savedDateTime = thresHold.savedDateTime;
    }

    var resultArray = [];

    if (jobResults.length === 0) {
        resultArray.push({
            execution: moment().format(AppConstants.DATE_TIME_FORMAT),
            responseTime: 0,
            color: '#eb00ff',
            resultID: -1
        });
        job.pieChartColor = '#eb00ff';
    }

    for (let currentResult of jobResults) {
        var barColor = '#eb00ff';
        var responseTime = this.roundValue(currentResult.response / 1000, 2);
        var dnsLookUpTime = this.roundValue(currentResult.lookup / 1000, 2);
        var tcpConnectTime = this.roundValue(currentResult.connect / 1000, 2);
        var lastByteRecieveTime = this.roundValue(currentResult.end / 1000, 2);
        var socketTime = this.roundValue(currentResult.socket / 1000, 2);

        var dateCompare = moment(currentResult.executedTime).isAfter(savedDateTime);

        if (criticalThreshold === undefined && warningThreshold === undefined){
            barColor = '#eb00ff';
        } else if (savedDateTime === undefined || dateCompare) {

            if (responseTime >= criticalThreshold) {
                barColor = '#b22222';
            } else if (responseTime >= warningThreshold && responseTime < criticalThreshold) {
                barColor = '#ffff00';
            }

        } else {
            barColor = '#eb00ff';
        }

        resultArray.push({
            execution: moment(currentResult.time).format(AppConstants.DATE_TIME_FORMAT),
            responseTime: responseTime,
            dnsLookUpTime: dnsLookUpTime,
            tcpConnectTime: tcpConnectTime,
            lastByteRecieveTime: lastByteRecieveTime,
            socketTime: socketTime,
            color: barColor,
            resultID: currentResult.resultID
        });
        job.pieChartColor = barColor;
    }
    return resultArray;
}

exports.createCharts = function(chartData, valueField, ) {
    let chartJSON = {
        color: '#fff',
        type: 'serial',
        theme: 'light',
        dataProvider: chartData,
        valueAxes: [
            {
                gridColor: '#FFFFFF',
                gridAlpha: 0.2,
                dashLength: 0,
                title: 'Response time / second',
                autoRotateAngle: 90
            }
        ],
        gridAboveGraphs: true,
        startDuration: 1,
        mouseWheelZoomEnabled: true,
        graphs: [
            {
                balloonText: '[[category]]: <b>[[value]] seconds</b>',
                fillAlphas: 0.8,
                lineAlpha: 0.2,
                type: 'column',
                valueField: valueField,
                fillColorsField: 'color'
            }
        ],
        categoryField: 'execution',
        categoryAxis: {
            gridPosition: 'start',
            gridAlpha: 0,
            tickPosition: 'start',
            tickLength: 20,
            autoRotateAngle: 45,
            autoRotateCount: 5
        },
        maxSelectedTime: 3,
        export: {
            enabled: true
        }
    };

    return '<script>AmCharts.makeChart("' + valueField + '", ' + JSON.stringify(chartJSON) + ');</script>'
}

exports.getTileTagString = function(summaryResult) {
    if (summaryResult.tableName === 'score') {
        return (
            summaryResult.result.map((resultObj, j) => {
                let tileName = undefined;
                switch (resultObj.advice) {
                    case null:
                        tileName = 'Overall Score';
                        break;
                    case 'performance':
                        tileName = 'Performance Score';
                        break;
                    case 'bestpractice':
                        tileName = 'Best Practice score';
                        break;
                    case 'accessibility':
                        tileName = 'Accessibility score';
                        break;

                }
                let tileValue = resultObj.value;
                let styleClass = 'color: #b94a48;background-color: #f2dede;border-color: #eed3d7;';
                if (tileValue > 90) {
                    styleClass = 'color: #468847;background-color: #dff0d8;border-color: #d6e9c6;';
                } else if (tileValue > 80) {
                    styleClass = 'color: #c09853;background-color: #fcf8e3;border-color: #fbeed5;';
                }

                if (tileName !== undefined) {
                    return this.getTileHTML(tileName, tileValue, styleClass);
                } else {
                    return null;
                }

            })
        );
    } else {
        let valueToDisplay = (summaryResult.result.length > 0)
                                 ? (this.roundValue(summaryResult.result[0].mean/1000, 2) + ' s')
                                 : 'N/A';
        return this.getTileHTML(summaryResult.displayName, valueToDisplay, 'background-color: #d9edf7;border-color: #bce8f1;color: #3a87ad;');
    }

}

exports.getTileHTML = function(tileName, tileValue, styleClass) {
    var valueStringToReturn =
        (
            '<div style="width:30%;float: left;">' +
                '<div style="padding: 15px;margin-bottom: 20px;border: 1px solid transparent;border-radius: 4px;margin: 20px 5px;' + styleClass + '">' +
                    tileName +
                    '<div style="font-size: 25px;line-height: 1;font-weight: 700;">' +
                    tileValue +
                    '</div>' +
                '</div>' +
            '</div>'
        );
    return valueStringToReturn;
}

exports.getJobsWithLocations = async function(tenantID, isNeedShowTest) {
    var queryObj;

    if (isNeedShowTest) {
        queryObj = {isShow: true};
    } else {
        queryObj = {};
    }

    var jobsList = await MongoDB.getAllData(tenantID, AppConstants.DB_JOB_LIST, queryObj);

    var locationsArr = [];

    for (let job of jobsList) {

        // Fetch all results for one time test and fetch only given time range data for other tests
        if (job.testType === AppConstants.ONE_TIME_TEST_TYPE) {
            job.result = await this.getJobResultsBackDate(tenantID, job, false, false);
        } else {
            job.result = await this.getJobResultsBackDate(tenantID, job, false, true);
        }

        var isLocationFound = locationsArr.find(function(locationObj) {
            return (locationObj.locationid === job.serverLocation.locationid);
        });

        if (!isLocationFound) {
            locationsArr.push(job.serverLocation);
        }

    }

    var listObj = {jobsList: jobsList, locations: locationsArr};
    return listObj;
}

exports.getAJobWithLocation = async function(paramObj) {
    var queryObj = {jobId: paramObj.jobId};
    var jobsList = await MongoDB.getAllData(paramObj.tenantID, AppConstants.DB_JOB_LIST, queryObj);

    var job = jobsList[0];

    // Fetch all results for one time test and fetch only given time range data for other tests
    if (job.testType === AppConstants.ONE_TIME_TEST_TYPE) {
        job.result = await this.getJobResultsBackDate(paramObj.tenantID, job, false, false);
    } else {
        job.result = await this.getJobResultsBackDate(paramObj.tenantID, job, false, true);
    }

    return job;
}

exports.getJobResultsBackDate = async function(tenantID, job, isLimitLast, isTimeCheck) {
    var dataTables = [];
    if (job.testType === AppConstants.PERFORMANCE_TEST_TYPE) {
        dataTables.push(AppConstants.PERFORMANCE_RESULT_LIST);
    } else if (job.testType === AppConstants.SCRIPT_TEST_TYPE) {
        dataTables.push({tableName: AppConstants.PERFORMANCE_RESULT_LIST, fieldToFetch: 'mean',fieldToReturn: 'response', isPageTimingsCheck: true});
        dataTables.push({tableName: AppConstants.PAGE_DOWNLOAD_TIME_RESULT_LIST, fieldToFetch: 'mean', fieldToReturn: 'downloadTime', isPageTimingsCheck: true});
        dataTables.push({tableName: AppConstants.SERVER_RESPONSE_TIME_LIST, fieldToFetch: 'mean', fieldToReturn: 'serverResponseTime', isPageTimingsCheck: true});
        dataTables.push({tableName: AppConstants.BACKEND_TIME_LIST, fieldToFetch: 'mean', fieldToReturn: 'backEndTime', isPageTimingsCheck: true});
    } else {
        dataTables.push(AppConstants.PING_RESULT_LIST);
    }

    var jobResults;

    if (dataTables.length > 1) {
        var tableResults = [];
        for (let dataTable of dataTables) {
            var backDate = moment().subtract(1, 'days').format(AppConstants.INFLUXDB_DATETIME_FORMAT);
            var queryToGetResults = "SELECT * FROM " + dataTable.tableName +
                                    " where jobid='" + job.jobId + "'" +
                                    ((isTimeCheck) ? " and time >= '" + backDate + "'" : "") +
                                    ((dataTable.isPageTimingsCheck) ? " and pageTimings='" + dataTable.tableName + "'" : "" ) +
                                    ((isLimitLast) ? " ORDER BY time DESC LIMIT 1" : "");
            var eachTableResults = await InfluxDB.getAllDataFor(
                tenantID,
                queryToGetResults
            );

            if (tableResults.length === 0) {
                for (let jobResult of eachTableResults) {
                    let resultObj = {
                        time: jobResult.time,
                        resultID: jobResult.resultID
                    };
                    resultObj[dataTable.fieldToReturn] = jobResult[dataTable.fieldToFetch];
                    tableResults.push(resultObj);
                }
            } else {
                for (let jobResultIndex in tableResults) {
                    tableResults[jobResultIndex][dataTable.fieldToReturn] = eachTableResults[jobResultIndex][dataTable.fieldToFetch];
                }
            }

        }
        jobResults = tableResults;
    } else {
        var backDate = moment().subtract(1, 'days').format(AppConstants.INFLUXDB_DATETIME_FORMAT);
        var queryToGetResults = "SELECT * FROM " + dataTables[0] +
                                " where jobid='" + job.jobId + "'" +
                                ((isTimeCheck) ? " and time >= '" + backDate + "'" : "") +
                                ((isLimitLast) ? " ORDER BY time DESC LIMIT 1" : "");
        var jobResults = await InfluxDB.getAllDataFor(
            tenantID,
            queryToGetResults
        );
    }

    return jobResults;
}

exports.getSummaryResults = async function(params, isTimeCheck) {
    let resultsArray = [];
    let dataTables = [
        {tableName: AppConstants.SCORE_LIST, displayName: 'Score'},
        {tableName: AppConstants.FIRST_PAINT_LIST, displayName: 'First Paint'},
        {tableName: AppConstants.BACKEND_TIME_LIST, displayName: 'Backend Time'},
        {tableName: AppConstants.FRONTEND_TIME_LIST, displayName: 'Frontend Time'},
        {tableName: AppConstants.PERFORMANCE_RESULT_LIST, displayName: 'Page Load Time'},
        {tableName: AppConstants.FIRST_VISUAL_CHANGE_LIST, displayName: 'First Visual Change'},
        {tableName: AppConstants.SPEED_INDEX_TIME_LIST, displayName: 'Speed Index'},
        {tableName: AppConstants.PERCEPTUAL_SPEED_INDEX_LIST, displayName: 'Perceptual Speed Index'},
        {tableName: AppConstants.VISUAL_COMPLETE_85_LIST, displayName: 'Visual Complete 85%'},
        {tableName: AppConstants.VISUAL_COMPLETE_95_LIST, displayName: 'Visual Complete 95%'},
        {tableName: AppConstants.VISUAL_COMPLETE_99_LIST, displayName: 'Visual Complete 99%'},
        {tableName: AppConstants.LAST_VISUAL_CHANGE_LIST, displayName: 'Last Visual Change'}
    ];

    for (let dataTable of dataTables) {
        var backDate = moment().subtract(1, 'days').format(AppConstants.INFLUXDB_DATETIME_FORMAT);
        var queryToGetResults = "SELECT * FROM " + dataTable.tableName +
                                " where jobid='" + params.jobId + "'" +
                                ((isTimeCheck) ? " and time >= '" + backDate + "'" : "") + " and summaryType='pageSummary'";

        if (dataTable.tableName === AppConstants.SCORE_LIST) {
            queryToGetResults += " ORDER BY time DESC LIMIT 5";
        } else {
            queryToGetResults += " ORDER BY time DESC LIMIT 1";
        }

        var tableResult = await InfluxDB.getAllDataFor(
            params.tenantID,
            queryToGetResults
        );
        resultsArray.push({tableName: dataTable.tableName, displayName: dataTable.displayName, result: tableResult});
    }
    return {summaryResults: resultsArray};
}

exports.roundValue = function(value, decimalPlaces) {
    let num = Math.pow(10, decimalPlaces);
    return Math.round(value * num) / num;
}
