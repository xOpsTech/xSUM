var nodemailer = require('nodemailer');
var AppConstants = require('../constants/AppConstants');
var AlertApi = require('../routes/api/alert-api');
var TenantApi = require('../routes/api/tenant-api');
var InfluxDB = require('../db/influxdb');
var MongoDB = require('../db/mongodb');
var {ObjectId} = require('mongodb');
var request = require('request');
var crypto = require('crypto');
var bcrypt = require('bcryptjs');
var config = require('../config/config');
var moment = require('moment');
var momentTimeZone = require('moment-timezone');
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

exports.sendEmailRegardingOneTimeJob = async function(user,tenantID, jobObj, emailToSend, timeZone) {
    var oneTimeTestResultURL = config.API_URL + '/#/auth-job-result?tag=' + jobObj.authKey;

    let objectToRetrieveResults = {jobId: jobObj.jobId, tenantID: tenantID};

    let htmlPath = 'one-time-results/';
    let fileName = 'result.html';
    let rederedImageDir = htmlPath + 'tenantid-' + tenantID + '/jobid-' + jobObj.jobId;
    let renderedImageName = '/image.png';
    let renderedImgPath = rederedImageDir + renderedImageName;

    let oneTimeResults = await this.getJobResultsBackDate(tenantID, jobObj, false, true);
    let barChartData = await this.getArrangedChartData(tenantID, jobObj, oneTimeResults, timeZone);

    let contentToWrite = (
        '<style>' +
        '.chartContainer {' +
            'width: 1000px;' +
        '}' +
        '.barChartDiv {' +
            'width: 70%;' +
            'height: 250px;' +
            'border: 1px solid #ccc;' +
            'display: inline-block;' +
        '}' +
        '.pieChartDiv {' +
            'width: 28%;' +
            'height: 250px;' +
            'border: 1px solid #ccc;' +
            'display: inline-block;' +
        '}' +
        '</style>' +
        '<script src="../../lib/js/am-charts/v3/amcharts.js">' +
        '</script><script src="../../lib/js/am-charts/v3/serial.js">' +
        '</script><script src="../../lib/js/am-charts/v3/light.js">' +
        '</script><script src="../../lib/js/am-charts/v3/pie.js"></script>' +
        '<div class="chartContainer">' +
            '<h4>Response Time</h4>' +
            '<div id="responseTimePie" class="pieChartDiv"></div>' +
            '<div id="responseTimeBar" class="barChartDiv"></div>' +
        '</div>' +
        '<div class="chartContainer">' +
            '<h4>DNS Time</h4>' +
            '<div id="dnsLookUpTimePie" class="pieChartDiv"></div>' +
            '<div id="dnsLookUpTimeBar" class="barChartDiv"></div>' +
        '</div>' +
        '<div class="chartContainer">' +
            '<h4>TCP Connect Time</h4>' +
            '<div id="tcpConnectTimePie" class="pieChartDiv"></div>' +
            '<div id="tcpConnectTimeBar" class="barChartDiv"></div>' +
        '</div>' +
        '<div class="chartContainer">' +
            '<h4>Last Byte Recieve Time</h4>' +
            '<div id="lastByteRecieveTimePie" class="pieChartDiv"></div>' +
            '<div id="lastByteRecieveTimeBar" class="barChartDiv"></div>' +
        '</div>' +
        this.createBarCharts(barChartData, 'responseTime', 'responseTimeBar', 'responseTimePie') +
        this.createBarCharts(barChartData, 'dnsLookUpTime', 'dnsLookUpTimeBar', 'dnsLookUpTimePie') +
        this.createBarCharts(barChartData, 'tcpConnectTime', 'tcpConnectTimeBar', 'tcpConnectTimePie') +
        this.createBarCharts(barChartData, 'lastByteRecieveTime', 'lastByteRecieveTimeBar', 'lastByteRecieveTimePie')
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

var emailStart = "Hey "+String(user.name)+"!<br> <p>Here at <b>xOps</b> we’re teaming up with Lenovo to help customers improve their website performance. We're using our new open source monitoring tool, xSUM to see how you stack up against the competition.Here are some demo results of One time test jobs that we have added.</p>"

var emailMiddle = "<p>Please find the results for each One Time Tests Below.</p><br><h3>Test Results - " + jobObj.jobName+ '<br><img width="100%" src="' + config.API_URL + '/' + renderedImgPath + '"/>';

var emailShow = "<br><div>We don't just stop there. We are able to run further tests on a regular basis at no cost to ensure your continuing to perform for your customers.</div>."


  var emailInvite =  'Administrator has invited you to join the ' + user.email + ' account on xSUM.<br>' +
                                'You can login to xSUM by using <b>your email as username</b> and following password. <br>' +
                                'Your password is: <b>' + user.passTocken + '<b> <br>' +
                                'Use following URL to login to xSUM<br>' +
                                '<a href="' + config.API_URL + '/#/login' + '">Navigate to xSUM Login</a> <br>' +
                                'Thank you';

    var emailBodyToSend = emailStart + emailMiddle + emailShow+ emailInvite;
  /*  for (let result of results.summaryResults) {
        emailBodyToSend += this.getTileTagString(result);
    }
*/
    emailBodyToSend += '</div>';
    this.sendEmailAs (
        emailToSend,
        'xSUM - One Time Test - ' + jobObj.siteObject.value,
        emailBodyToSend,
        AppConstants.ADMIN_EMAIL_TYPE
    );

}

exports.getArrangedChartData = async function (tenantID, job, jobResults, timeZone) {
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
        var dateTime = moment().format(AppConstants.DATE_TIME_FORMAT);

        if (timeZone) {
            dateTime = momentTimeZone.tz(timeZone).format(AppConstants.DATE_TIME_FORMAT);
        }

        resultArray.push({
            execution: dateTime,
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

        var dateTime = moment(currentResult.time).format(AppConstants.DATE_TIME_FORMAT);

        if (timeZone) {
            dateTime = momentTimeZone.tz(currentResult.time, timeZone).format(AppConstants.DATE_TIME_FORMAT);
        }

        resultArray.push({
            execution: dateTime,
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

exports.createBarCharts = function(chartData, valueField, barChartID, pieChartID) {
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

    var lastTestAvg = chartData[chartData.length-1]
                            && chartData[chartData.length-1][valueField];
    var lastColor = chartData[chartData.length-1]
                            && chartData[chartData.length-1].color;

    const pieChartConfig = {
        type: 'pie',
        theme: 'light',
        outlineAlpha: 0.7,
        outlineColor: '#343242',
        labelsEnabled: false,
        dataProvider: [
            {
                title: 'Average Response Time',
                value: 3
            },
            {
                title: 'Last Test Average',
                value: lastTestAvg
            }
        ],
        colors: [
            '#222029', lastColor
        ],
        titleField: 'title',
        valueField: 'value',
        labelRadius: 5,
        radius: '42%',
        innerRadius: '70%',
        labelText: '[[title]]',
        export: {
            enabled: true
        }
    };

    return (
        '<script>' +
            'AmCharts.makeChart("' + barChartID + '", ' + JSON.stringify(chartJSON) + ');' +
            'AmCharts.makeChart("' + pieChartID + '", ' + JSON.stringify(pieChartConfig) + ');' +
        '</script>'
    );
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
        job.result = await this.getJobResultsBackDate(tenantID, job, false, true);

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

    job.result = await this.getJobResultsBackDate(paramObj.tenantID, job, false, true);

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

exports.isUserCreated = async function(userObj, willReturnTenantObject) {

    if (userObj.password) {
        userObj.password = await this.hashPassword(userObj.password);
    } else {
        userObj.password = '';
    }

    var userInsertObj = {
        email: userObj.email,
        name: userObj.name,
        title: userObj.title,
        location: userObj.location,
        timeZone: userObj.timeZone,
        password: userObj.password,
        company: userObj.company,
        timestamp: moment().format(AppConstants.INFLUXDB_DATETIME_FORMAT),
        isActive: true,
        tenants: []
    };

    if (userObj.isScriptedUser) {
        userInsertObj.isScriptedUser = true;
        userInsertObj.passTocken = userObj.passTocken;
    }

    var queryObj = {email: userObj.email};
    var userData = await MongoDB.getAllData(AppConstants.DB_NAME, AppConstants.USER_LIST, queryObj);

    if (userData.length > 0) {
        return false;
    } else {
        var tenantName = userObj.email.replace(/@.*$/,'') + '-account';

        if (userInsertObj.company === '') userInsertObj.company = tenantName;

        await MongoDB.insertData(AppConstants.DB_NAME, AppConstants.USER_LIST, userInsertObj);

        var tenantObj = await TenantApi.insertTenantData(userInsertObj._id, tenantName);

        var tenantsArray = userInsertObj.tenants;

        tenantsArray.push({tenantID: tenantObj._id, role: AppConstants.ADMIN_ROLE});
        var toUpdateTenantArray = {
            tenants: tenantsArray
        };
        MongoDB.updateData(AppConstants.DB_NAME, AppConstants.USER_LIST, {_id: ObjectId(userInsertObj._id)}, toUpdateTenantArray);

        // Insert user to tenant id database
        await MongoDB.insertData(String(tenantObj._id), AppConstants.USER_LIST, userInsertObj);
        InfluxDB.createDatabase(String(tenantObj._id));

        if (willReturnTenantObject) {
            return tenantObj;
        } else {
            return true;
        }

    }
}

exports.isJobCreated = async function (jobObj) {
    var jobName = (jobObj.jobName === '') ? (jobObj.siteObject.value + '-Job') : jobObj.jobName;

    var jobInsertObj = {
        jobId: jobObj.jobId,
        siteObject: {value: jobObj.siteObject.value},
        browser: jobObj.browser,
        testType: jobObj.testType,
        scheduleDate: jobObj.scheduleDate,
        isRecursiveCheck: jobObj.isRecursiveCheck,
        recursiveSelect: jobObj.recursiveSelect,
        result: [],
        userEmail: jobObj.userEmail,
        jobName: jobName,
        serverLocation: jobObj.serverLocation,
        alerts: {
            critical: [],
            warning: []
        },
        isShow: true,
        securityProtocol: jobObj.securityProtocol
    };

    if (jobObj.isScriptedJob) {
        jobInsertObj.isScriptedJob = true;
    }

    if (jobObj.testType === AppConstants.SCRIPT_TEST_TYPE) {
        let scriptFilePath = 'scripts/tenantid-' + jobObj.tenantID + '/jobid-' + jobObj.jobId;
        let fileName = '/script-1.js';
        jobInsertObj.scriptPath = scriptFilePath + fileName;
        jobInsertObj.scriptValue = jobObj.scriptValue;
        fileSystem.mkdir(scriptFilePath, {recursive: true}, (err) => {

            if (err) {
                console.log('Error in creating directories' + scriptFilePath, err);
                throw err;
            } else {

                fileSystem.writeFile(scriptFilePath + fileName, jobObj.scriptValue, (err) => {
                    if (err) {
                        console.log('Error in creating file' + fileName, err);
                        throw err;
                    }
                });
            }

        });
    }

    var queryToGetTenantObj = {_id: ObjectId(jobObj.tenantID)};
    var tenantData = await MongoDB.getAllData(AppConstants.DB_NAME, AppConstants.TENANT_LIST, queryToGetTenantObj);

    var totalPointsRemain = tenantData[0].points.pointsRemain -
                                    (AppConstants.TOTAL_MILLISECONDS_PER_MONTH / jobObj.recursiveSelect.value);

    if (totalPointsRemain >= 0) {

        if (jobObj.testType === AppConstants.ONE_TIME_TEST_TYPE) {
            var authKey = crypto.randomBytes(30).toString('hex');
            jobInsertObj.authKey = authKey;
            this.executeOneTimeJob(jobObj.tenantID, jobInsertObj);
        }

        await MongoDB.insertData(jobObj.tenantID, AppConstants.DB_JOB_LIST, jobInsertObj);

        TenantApi.updateTenantPoints(jobObj.jobId, jobObj.tenantID, true);

        return true;
    } else {
        return false;
    }

}

exports.sendEmailToScriptedUsers = async function (context) {
    var userData = await MongoDB.getAllData(AppConstants.DB_NAME, AppConstants.USER_LIST, {isScriptedUser: true});

    for (let user of userData) {

        // Send scripted user data to relevant email
        var emailBodyToSend =  'Administrator has invited you to join the ' + user.email + ' account on xSUM.<br>' +
                                'You can login to xSUM by using <b>your email as username</b> and following password. <br>' +
                                'Your password is: <b>' + user.passTocken + '<b> <br>' +
                                'Use following URL to login to xSUM<br>' +
                                '<a href="' + config.API_URL + '/#/login' + '">Navigate to xSUM Login</a> <br>' +
                                'Thank you';
/*        context.sendEmailAs (
            user.email,
            'xSUM - Login Details',
            emailBodyToSend,
            AppConstants.ADMIN_EMAIL_TYPE
        );
*/
        // Get the job list for current tenant
        var jobList = await MongoDB.getAllData(String(user.tenants[0].tenantID), AppConstants.DB_JOB_LIST, {isScriptedJob: true});
        await context.sendEmailRegardingOneTimeJob(user, String(user.tenants[0].tenantID), jobList[0], user.email)
        console.log("Send emails Successfully for " + user.email);
    }

}

exports.hashPassword = function(password) {
    return new Promise((resolve) => {
        bcrypt.hash(password, 10, (err, hash) => {
            resolve(hash);
        });
    });
}
