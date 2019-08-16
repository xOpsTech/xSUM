var MongoDB = require('../../db/mongodb');
var AppConstants = require('../../constants/AppConstants');
var moment = require('moment');
var { ObjectId } = require('mongodb');

function PaymentApi() {}

PaymentApi.prototype.handlePayment = function(req, res) {
    var action = req.query.action;
    switch (action) {
        case 'getClientToken':
            new PaymentApi().getClientToken(req, res);
            break;
        case 'paymentCheckout':
            new PaymentApi().paymentCheckout(req, res);
            break;
        case 'getSubcriptionsList':
            new PaymentApi().getAllSubscriptionByTenantId(req, res);
            break;

        default:
            res.send('no data');
    }
};

PaymentApi.prototype.getClientToken = async function(req, res) {
    var userObj = req.body;

    var braintree = require('braintree');

    var gateway = braintree.connect({
        environment: braintree.Environment.Sandbox,
        merchantId: 'j5ty3fg2fymksmsk',
        publicKey: 'bbm4s8jfy4rs5ppc',
        privateKey: '530f994a91c068853f904c204cde93c1'
    });

    gateway.clientToken.generate({}, function(err, response) {
        var clientToken = response.clientToken;
        res.send({ clientToken: clientToken });
    });
};

PaymentApi.prototype.paymentCheckout = async function(req, res) {
    var userObj = req.body;

    console.log(213, userObj);

    var braintree = require('braintree');

    var gateway = braintree.connect({
        environment: braintree.Environment.Sandbox,
        merchantId: 'j5ty3fg2fymksmsk',
        publicKey: 'bbm4s8jfy4rs5ppc',
        privateKey: '530f994a91c068853f904c204cde93c1'
    });

    gateway.transaction.sale(
        {
            amount: userObj.amount,
            paymentMethodNonce: userObj.nonce,
            options: {
                submitForSettlement: true
            }
        },
        function(err, result) {
            console.log(3232);
            var currentDateTime = moment().format(
                AppConstants.INFLUXDB_DATETIME_FORMAT
            );
            var obj = {
                userId: userObj.userId,
                tenantId: userObj.tenantId,
                amount: userObj.amount,
                nounce: userObj.nonce,
                updated: currentDateTime,
                result: result
            };
            MongoDB.insertData(
                userObj.tenantId,
                AppConstants.SUBSCRIPTION_LIST,
                obj
            );
        }
    );
};

PaymentApi.prototype.getAllSubscriptionByTenantId = async function(req, res) {
    var userObj = req.body;

    var queryToGetTenantObj = { tenantId: userObj.tenantId };

    var subscriptionList = await MongoDB.getAllData(
        userObj.tenantId,
        AppConstants.SUBSCRIPTION_LIST,
        queryToGetTenantObj
    );
    console.log(3, subscriptionList);
    res.send({ subscriptions: subscriptionList });
};

module.exports = new PaymentApi();
