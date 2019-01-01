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

    for (var i = 0; i < tenantData.length; i++) {

        for (var j = 0; j < tenantData[i].users.length; j++) {

            if (tenantData[i].users[j].userID == userObj.userID) {
                delete tenantData[i].password;
                matchedTenants.push(tenantData[i]);
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
        }

        res.send(tenantsArray);
    } else {
        res.send({message: AppConstants.RESPONSE_ERROR});
    }

}

TenantApi.prototype.insertTenantData = async function(userID) {
    var tenantInsertObj = {
        name: '',
        ownerId: userID,
        email: '',
        password: '',
        users: [
            {
                userID: userID
            }
        ]
    };
    await MongoDB.insertData(AppConstants.DB_NAME, AppConstants.TENANT_LIST, tenantInsertObj);
    return tenantInsertObj;
}

TenantApi.prototype.addTenantEmailData = async function(req, res) {
    var tenantObj = req.body;
    var queryObj = {_id: ObjectId(tenantObj.id)};
    var tenantUpdateObj = {
        email: tenantObj.email,
        password: tenantObj.password,
        name: tenantObj.name
    };
    MongoDB.updateData(AppConstants.DB_NAME, AppConstants.TENANT_LIST, queryObj, tenantUpdateObj);
    res.send({message: AppConstants.RESPONSE_SUCCESS, tenant: {email: tenantUpdateObj.email}});
}

module.exports = new TenantApi();
