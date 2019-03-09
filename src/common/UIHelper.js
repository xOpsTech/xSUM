import createHashHistory from 'history/lib/createHashHistory';
import {useRouterHistory} from 'react-router';
import moment from 'moment';
import {randomBytes} from 'crypto';
import {browserHistory} from 'react-router';

import userApi from '../api/userApi';
import tenantApi from '../api/tenantApi';

import * as Config from '../config/config';
import * as AppConstants from '../constants/AppConstants';
import * as MessageConstants from '../constants/MessageConstants';

// Redirect to any route
export function redirectTo(route, data, isRefresh) {
    useRouterHistory(createHashHistory)().push({
        pathname: route,
        query: data
    });
    isRefresh && window.location.reload();
}

// Redirect to login page if user not logged in
export function redirectLogin() {
    redirectTo(AppConstants.LOGIN_ROUTE, {}, true);
}

// Go to previous page in browser history
export function goToPreviousPage() {
    browserHistory.goBack();
}

// Cookies
export function setCookie(cname, cvalue, exmins) {
    var d = new Date();
    d.setTime(d.getTime() + (exmins * 60 * 1000));
    var expires = 'expires=' + d.toUTCString();

    if (typeof document !== 'undefined') {
        document.cookie = cname + '=' + cvalue + ';' + expires + ';path=/';
    }

}

export function getCookie(cname) {
    var name = cname + '=';

    if (typeof document !== 'undefined') {
        var ca = document.cookie.split(';');

        for(var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }

    }

    return '';
}

export function deleteCookie(cname) {
    var d = new Date(); //Create an date object
    d.setTime(d.getTime() - (1000*60*60*24)); //Set the time to the past. 1000 milliseonds = 1 second
    var expires = "expires=" + d.toGMTString(); //Compose the expirartion date
    document.cookie = cname+"="+"; "+expires;//Set the cookie with name and the expiration date
}

// Set local storage value
// Key and value are strings
export function setLocalStorageValue(key, value) {
    localStorage.setItem(key, value);
}

export function getLocalStorageValue(key) {
    return localStorage.getItem(key);
}

export function getLeftState() {
    var isNavCollapse = getLocalStorageValue(AppConstants.LEFTNAV_COLLAPSE_STATE);

    if (isNavCollapse == 'true') {
        return true;
    } else {
        return false;
    }
}

export function roundValueToTwoDecimals (value) {
    return Math.round(value * 100) / 100;
}

export function removeLocalStorageValue(key) {
    localStorage.removeItem(key);
}

export function toTitleCase(str) {

    if (str === undefined) {
        return '';
    } else {
        return str.replace(
            /\w\S*/g,
            function(txt) {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            }
        );
    }

}

export function isNameHasError(value) {
    return !RegExp(AppConstants.NAME_PATTERN).test(value);
}

export function isUrlHasError(value) {
    return !RegExp(AppConstants.URL_PATTERN).test(value);
}

export function isEmailHasError(value) {
    return !RegExp(AppConstants.EMAIL_PATTERN).test(value);
}

export function isPasswordHasError(value) {
    return !RegExp(AppConstants.PASSWORD_PATTERN).test(value);
}

export function getRandomHexaValue() {
    return randomBytes(10).toString('hex');
}

export function replaceCharacter(stringToReplace, replace, replaceFrom) {
    return stringToReplace.replace(new RegExp(replace, 'g'), replaceFrom);
}

export function getRoleForUserFromTenant(tenantID, userObject, isTitle) {
    var role;

    for (let tenant of userObject.tenants) {

        if (tenant.tenantID === tenantID) {
            role = tenant.role;
        }

    }

    return (isTitle) ? toTitleCase(role) : role;
}


// isContinueLoad used for indicate continue the loading screen or not
export function getUserData(loggedUserObj, context, callBackFunction, isContinueLoad) {
    var urlToGetUserData = Config.API_URL + AppConstants.GET_USER_DATA_API;

    context.setState({isLoading: true, alertData:context.state.alertData, loadingMessage: MessageConstants.FETCHING_USER});
    userApi.getUser(urlToGetUserData, {email: loggedUserObj.email}).then((data) => {

        loggedUserObj = data.user;

        context.setState (
            {
                isLoading: (isContinueLoad) ? isContinueLoad : false,
                loadingMessage: (isContinueLoad) ? context.state.loadingMessage : '',
                loggedUserObj,
                alertData: context.state.alertData
            }
        );

        callBackFunction && callBackFunction(data.user, context);
    });
}

export function getAllTenantsData(user, context, callBackFunction, isContinueLoad) {
    var urlToGetTenantData = Config.API_URL + AppConstants.GET_TENANTS_WITH_USERS_API;

    if (user.isSuperUser) {
        urlToGetTenantData = Config.API_URL + AppConstants.GET_ALL_USERS_WITH_TENANTS_API;
    }

    context.setState({isLoading: true, loadingMessage: MessageConstants.FETCHING_TENANTS});
    tenantApi.getAllTenantsFrom(urlToGetTenantData, {userID: user._id}).then((data) => {
        var tenantList = [];
        var selectedTenant = context.state.selectedTenant;
        var selectedTenantID = getLocalStorageValue(AppConstants.SELECTED_TENANT_ID);

        if (user.isSuperUser) {

            if (selectedTenantID) {

                for (let tenant of data) {
                    tenant.email = {value: tenant.email, error: {}};
                    tenant.password = {value: '', error: {}};
                    tenantList.push(tenant);

                    if (tenant._id === selectedTenantID) {
                        selectedTenant = tenant;
                    }

                }

            } else {
                selectedTenant = data[0];
            }

        } else {
            for (let tenant of data) {
                tenant.email = {value: tenant.email, error: {}};
                tenant.password = {value: '', error: {}};
                tenantList.push(tenant);

                if (context.props.location.query.userObj) {
                    var userObj = JSON.parse(context.props.location.query.userObj);

                    if (userObj.tenantID === tenant._id) {
                        selectedTenant = tenant;
                    }

                }

            }

            if (selectedTenant) {
                selectedTenant = tenantList[0];
            }

        }

        callBackFunction && callBackFunction(user, selectedTenant, context);

        context.setState (
            {
                isLoading: (isContinueLoad) ? isContinueLoad : false,
                loadingMessage: (isContinueLoad) ? context.state.loadingMessage : '',
                tenantList: tenantList,
                selectedTenant: selectedTenant,
                alertData: context.state.alertData
            }
        );

    });
}

export function getArrangedBarChartData(job, selectedChartIndex, context) {
    var savedDateTime, criticalThreshold, warningThreshold;

    for (var thresHold of context.state.alertData) {

        if (thresHold.jobId == job.jobId) {
            criticalThreshold = thresHold.criticalThreshold;
            warningThreshold = thresHold.warningThreshold;
            savedDateTime = thresHold.savedDateTime;
        }

    }

    var resultArray = [];

    if (job.result.length === 0) {
        resultArray.push({
            execution: moment().format(AppConstants.DATE_TIME_FORMAT),
            responseTime: 0,
            color: '#eb00ff',
            resultID: -1
        });
        job.pieChartColor = '#eb00ff';
    }

    for (let currentResult of job.result) {

        if (job.testType === AppConstants.PERFORMANCE_TEST_TYPE) {

            // Check Result ID exists
            var isResultIdFound = resultArray.find(function(jobObj) {
                return jobObj.resultID === currentResult.resultID;
            });

            if (!isResultIdFound) {
                resultArray.push({
                    execution: moment(currentResult.time).format(AppConstants.DATE_TIME_FORMAT),
                    responseTime: currentResult[AppConstants.CHART_TYPES_ARRAY[selectedChartIndex].value]/1000,
                    color: '#eb00ff',
                    resultID: currentResult.resultID
                });
                job.pieChartColor = '#eb00ff';
            }

        } else if (job.testType === AppConstants.PING_TEST_TYPE) {
            var barColor;
            var responseTime = roundValueToTwoDecimals(currentResult.response / 1000);
            var dnsLookUpTime = roundValueToTwoDecimals(currentResult.lookup / 1000);
            var tcpConnectTime = roundValueToTwoDecimals(currentResult.connect / 1000);
            var lastByteRecieveTime = roundValueToTwoDecimals(currentResult.end / 1000);
            var socketTime = roundValueToTwoDecimals(currentResult.socket / 1000);

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
    }
    return resultArray;
}
