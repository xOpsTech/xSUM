var MongoDB = require('../../db/mongodb');
var InfluxDB = require('../../db/influxdb');
var AppConstants = require('../../constants/AppConstants');
var config = require('../../config/config');
var path = require('path');
var crypto = require('crypto');

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
                matchedTenants.push(tenantData[i]);
                break;
            }

        }

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

module.exports = new TenantApi();
