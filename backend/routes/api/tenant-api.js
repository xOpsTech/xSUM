var MongoDB = require('../../db/mongodb');
var InfluxDB = require('../../db/influxdb');
var AppConstants = require('../../constants/AppConstants');
var config = require('../../config/config');
var path = require('path');
var crypto = require('crypto');
var {ObjectId} = require('mongodb');

function TenantApi(){};


TenantApi.prototype.handleTenantData = function(req, res) {
    var action = req.query.action;
    switch (action) {
        case "addTenantData":
            new TenantApi().addTenantData(req, res);
            break;
        case "getAllTenantsData":
            new TenantApi().getAllTenantsData(req, res);
            break;
        case "getAllTenantsWithUsers":
            new TenantApi().getAllTenantsWithUsers(req, res);
            break;
        case "getAllUsersWithTenants":
            new TenantApi().getAllUsersWithTenants(req, res);
            break;
        case "addTenantEmailData":
            new TenantApi().addTenantEmailData(req, res);
            break;
        case "updateTenantData":
            new TenantApi().updateTenantData(req, res);
            break;
        case "removeTenantData":
            new TenantApi().removeTenantData(req, res);
            break;
        default:
            res.send("no data");
    }
}

TenantApi.prototype.addTenantData = async function(req, res) {

}

TenantApi.prototype.getAllTenantsData = async function(req, res) {
    var userObj = req.body;
    var tenantData = await MongoDB.getAllData(AppConstants.DB_NAME, AppConstants.TENANT_LIST, {});
    var matchedTenants = [];

    for (let tenant of tenantData) {

        for (let user of tenant.users) {

            if (user.userID == userObj.userID) {
                delete tenant.password;

                if (tenant.alert === undefined) {
                    tenant.alert = {
                        warningAlertCount: AppConstants.EMAIL_WARNING_ALERT_COUNT,
                        criticalAlertCount: AppConstants.EMAIL_CRITICAL_ALERT_COUNT,
                        failureAlertCount: AppConstants.EMAIL_FAILURE_ALERT_COUNT
                    }
                }

                if (tenant.points === undefined) {
                    tenant.points = {
                        totalPoints: AppConstants.DEFAULT_POINTS_COUNT,
                        pointsRemain: AppConstants.DEFAULT_POINTS_COUNT
                    }
                }

                if (tenant.userCountLimit === undefined) {
                    tenant.userCountLimit = AppConstants.DEFAULT_USER_COUNT;
                }

                matchedTenants.push(tenant);
                break;
            }

        }

    }

    res.send(matchedTenants);
}

TenantApi.prototype.getAllTenantsWithUsers = async function(req, res) {
    var userObj = req.body;

    var queryObj = {_id: ObjectId(userObj.userID)};
    var userData = await MongoDB.getAllData(AppConstants.DB_NAME, AppConstants.USER_LIST, queryObj);

    var tenantsArray = [];

    for (let tenant of userData[0].tenants) {
        var queryToGetTenant = {_id: ObjectId(tenant.tenantID)};
        var tenantData = await MongoDB.getAllData(AppConstants.DB_NAME, AppConstants.TENANT_LIST, queryToGetTenant);
        var userList = await MongoDB.getAllData(String(tenant.tenantID), AppConstants.USER_LIST, {});

        delete tenantData[0].password;
        for (let user of userList) {
            delete user.password;
        }
        tenantData[0].userList = userList;
        tenantsArray.push(tenantData[0]);
    }

    res.send(tenantsArray);
}

TenantApi.prototype.getAllUsersWithTenants = async function(req, res) {
    var userObj = req.body;

    var queryObj = {_id: ObjectId(userObj.userID)};
    var userData = await MongoDB.getAllData(AppConstants.DB_NAME, AppConstants.USER_LIST, queryObj);

    if (userData[0].tenants[0].role === AppConstants.SUPER_USER) {
        var tenantsArray = await MongoDB.getAllData(AppConstants.DB_NAME, AppConstants.TENANT_LIST, {});

        for (let tenant of tenantsArray) {
            var usersArray = [];
            for (let user of tenant.users) {
                var queryObj = {_id: ObjectId(user.userID)};
                var userData = await MongoDB.getAllData(AppConstants.DB_NAME, AppConstants.USER_LIST, queryObj);
                delete userData[0].password;
                usersArray.push(userData[0]);
            }
            tenant.userList = usersArray;
            if (tenant.alert === undefined) {
                tenant.alert = {
                    warningAlertCount: AppConstants.EMAIL_WARNING_ALERT_COUNT,
                    criticalAlertCount: AppConstants.EMAIL_CRITICAL_ALERT_COUNT,
                    failureAlertCount: AppConstants.EMAIL_FAILURE_ALERT_COUNT
                }
            }

            if (tenant.points === undefined) {
                tenant.points = {
                    totalPoints: AppConstants.DEFAULT_POINTS_COUNT,
                    pointsRemain: AppConstants.DEFAULT_POINTS_COUNT
                }
            }

            if (tenant.userCountLimit === undefined) {
                tenant.userCountLimit = AppConstants.DEFAULT_USER_COUNT;
            }

        }

        res.send(tenantsArray);
    } else {
        res.send({message: AppConstants.RESPONSE_ERROR});
    }

}

TenantApi.prototype.insertTenantData = async function(userID, tenantName) {
    var tenantInsertObj = {
        name: tenantName,
        ownerId: userID,
        email: '',
        password: '',
        users: [
            {
                userID: userID
            }
        ],
        alert: {
            warningAlertCount: AppConstants.EMAIL_WARNING_ALERT_COUNT,
            criticalAlertCount: AppConstants.EMAIL_CRITICAL_ALERT_COUNT,
            failureAlertCount: AppConstants.EMAIL_FAILURE_ALERT_COUNT
        },
        points: {
            totalPoints: AppConstants.DEFAULT_POINTS_COUNT,
            pointsRemain: AppConstants.DEFAULT_POINTS_COUNT
        },
        userCountLimit: AppConstants.DEFAULT_USER_COUNT
    };
    await MongoDB.insertData(AppConstants.DB_NAME, AppConstants.TENANT_LIST, tenantInsertObj);
    return tenantInsertObj;
}

TenantApi.prototype.updateTenantPoints = async function(jobID, tenantID, isInsert) {
    var queryObj = {jobId: jobID};
    var jobData = await MongoDB.getAllData(tenantID, AppConstants.DB_JOB_LIST, queryObj);

    var queryToGetTenantObj = {_id: ObjectId(tenantID)};
    var tenantData = await MongoDB.getAllData(AppConstants.DB_NAME, AppConstants.TENANT_LIST, queryToGetTenantObj);

    var totalPointsRemain;
    if (isInsert) {
        totalPointsRemain = tenantData[0].points.pointsRemain -
                                    (AppConstants.TOTAL_MILLISECONDS_PER_MONTH / jobData[0].recursiveSelect.value);
    } else {
        totalPointsRemain = tenantData[0].points.pointsRemain +
                                    (AppConstants.TOTAL_MILLISECONDS_PER_MONTH / jobData[0].recursiveSelect.value);
    }

    // Update tenant points
    var queryObj = {_id: ObjectId(tenantID)};
    var tenantUpdateObj = {
        points: {
            totalPoints: tenantData[0].points.totalPoints,
            pointsRemain: totalPointsRemain
        }
    };
    MongoDB.updateData(AppConstants.DB_NAME, AppConstants.TENANT_LIST, queryObj, tenantUpdateObj);
}

TenantApi.prototype.addTenantEmailData = async function(req, res) {
    var tenantObj = req.body;
    var queryObj = {_id: ObjectId(tenantObj.id)};
    var tenantUpdateObj = {
        email: tenantObj.email,
        password: tenantObj.password,
        name: tenantObj.name,
        alert: {
            warningAlertCount: tenantObj.warningAlertCount,
            criticalAlertCount: tenantObj.criticalAlertCount,
            failureAlertCount: tenantObj.failureAlertCount
        }
    };
    MongoDB.updateData(AppConstants.DB_NAME, AppConstants.TENANT_LIST, queryObj, tenantUpdateObj);
    res.send({message: AppConstants.RESPONSE_SUCCESS, tenant: {email: tenantUpdateObj.email}});
}

TenantApi.prototype.updateTenantData = async function(req, res) {
    var tenantObj = req.body;
    var queryObj = {_id: ObjectId(tenantObj.id)};
    MongoDB.updateData(AppConstants.DB_NAME, AppConstants.TENANT_LIST, queryObj, tenantObj.updateObj);
    res.send({message: AppConstants.RESPONSE_SUCCESS, tenant: {email: tenantObj.updateObj}});
}

TenantApi.prototype.removeTenantData = async function(req, res) {
    var tenantObj = req.body;

    // Get tenant data
    var queryObj = {_id: ObjectId(tenantObj.id)};
    var tenantData = await MongoDB.getAllData(AppConstants.DB_NAME, AppConstants.TENANT_LIST, queryObj);

    // Remove users
    for (let user of tenantData[0].users) {
        var queryToRemoveUser = {_id: ObjectId(user.userID)};
        MongoDB.deleteOneData(AppConstants.DB_NAME, AppConstants.USER_LIST, queryToRemoveUser);
    }

    // Remove mongo db for relavant tenant
    await MongoDB.removeDatabase(tenantObj.id);

    // Remove influx db for relavant tenant
    InfluxDB.removeDatabase(tenantObj.id);

    // Remove tenant
    var queryToRemoveTenant = {_id: ObjectId(tenantObj.id)};
    MongoDB.deleteOneData(AppConstants.DB_NAME, AppConstants.TENANT_LIST, queryToRemoveTenant);

    res.send({message: AppConstants.RESPONSE_SUCCESS, tenant: tenantObj});
}

module.exports = new TenantApi();
