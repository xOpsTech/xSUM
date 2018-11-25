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
    var tenantData = await MongoDB.getAllData(AppConstants.TENANT_LIST, {});
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
    var tenantData = await MongoDB.getAllData(AppConstants.TENANT_LIST, {});
    var userData = await MongoDB.getAllData(AppConstants.USER_LIST, {});
    var matchedTenants = [];

    for (let tenant of tenantData) {

        for (let user of tenant.users) {

            if (user.userID == userObj.userID) {
                delete tenant.password;
                matchedTenants.push(tenant);
                break;
            }

        }

    }

    for (let tenant of matchedTenants) {
        var userList = [];

        for (let user of tenant.users) {

            // Get other user list
            for (let dbUser of userData) {

                if (JSON.stringify(user.userID) == JSON.stringify(dbUser._id)) {
                    delete dbUser.password;
                    userList.push(dbUser);
                }

            }
        }

        tenant.userList = userList;
    }

    res.send(matchedTenants);
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
    await MongoDB.insertData(AppConstants.TENANT_LIST, tenantInsertObj);
    return tenantInsertObj;
}

TenantApi.prototype.addTenantEmailData = async function(req, res) {
    var tenantObj = req.body;
    var queryObj = {_id: ObjectId(tenantObj.id)};
    var tenantUpdateObj = {
        email: tenantObj.email,
        password: tenantObj.password
    };
    MongoDB.updateData(AppConstants.TENANT_LIST, queryObj, tenantUpdateObj);
    res.send({message: AppConstants.RESPONSE_SUCCESS, tenant: {email: tenantUpdateObj.email}});
}

module.exports = new TenantApi();
