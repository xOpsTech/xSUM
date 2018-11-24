var MongoClient = require('mongodb').MongoClient;
var InfluxDB = require('./influxdb');
var AppConstants = require('../constants/AppConstants');
var config = require('../config/config');
var dbName = 'xsum';
var url = 'mongodb://' + config.MONGODB_IP + ':27017/' + dbName;
const bcrypt = require('bcryptjs');

function MongoDB(){};

MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    console.log("Database created!");
    db.close();
});

function connectMongoDB() {
    return MongoClient.connect(url);
}

function connectDB() {
    return new Promise((resolve) => {
        connectMongoDB().then((db) => {
            resolve(db);
        });
    });
}

function getResult(db, collectionName, query) {
    return new Promise((resolve) => {
        var dbo = db.db(dbName);
        dbo.collection(collectionName).find(query).toArray((error, result) => {

            if (error) {
                resolve(error);
            }

            resolve(result);
        });
    });
}

function insertDataInto(db, collectionName, objectToInsert) {
    return new Promise((resolve) => {
        var dbo = db.db(dbName);
        dbo.collection(collectionName).insertOne(objectToInsert, (error, result) => {
            console.log("one row added for " + collectionName);
            if (error) {
                resolve(error);
            }

            resolve(result);
        });
    });
}

function insertDataTo(db, collectionName, objectToInsert, callBackFunction) {
    return new Promise((resolve) => {
        var dbo = db.db(dbName);
        dbo.collection(collectionName).insertOne(objectToInsert, (err, res) => {
            if (err) resolve(err);
            console.log("one row added for " + collectionName);
            callBackFunction && callBackFunction(collectionName, objectToInsert);
            resolve(res);
        });
    });
}

MongoDB.prototype.fetchData = function(collectionName, query, response) {

    connectMongoDB().then((db) => {
        var dbo = db.db(dbName);
        dbo.collection(collectionName).find(query).toArray((error, result) => {
            db.close();
            response.send(result);
            if (error) {
                response.send(error);
            }
        });
    }).catch((err) => {
        response.send(err);
    });

}

MongoDB.prototype.checkUserExists = async function(collectionName, query, typedPassword, response) {
    var dbObject = await connectDB();
    var userData = await getResult(dbObject, collectionName, query);

    if (userData.length > 0) {
        var storedPassword = userData[0].password;

        if (userData[0].isActive) {
            if (bcrypt.compareSync(typedPassword, storedPassword)) {
                response.send({message: AppConstants.RESPONSE_SUCCESS, user: {email: userData[0].email}});
            } else {
                response.send({message: AppConstants.EMAIL_AND_PASSWORD_NOT_MATCH});
            }
        } else {
            response.send({message: AppConstants.USER_INACTIVE});
        }


    } else {
        response.send({message: AppConstants.EMAIL_NOT_EXISTS});
    }

}

MongoDB.prototype.insertData = function(collectionName, objectToInsert, response, callBackFunction) {
    connectMongoDB().then((db) => {
        var dbo = db.db(dbName);

        dbo.collection(collectionName).insertOne(objectToInsert, (err, res) => {
            if (err) throw err;

            console.log("one row added for " + collectionName);
            response.send(objectToInsert);
            callBackFunction && callBackFunction(collectionName, objectToInsert);

        });
    }).catch((err) => {
        response.send(err);
    });

}

MongoDB.prototype.insertJobWithUserCheck = function(collectionName, objectToInsert, response, callBackFunction) {
    connectMongoDB().then((db) => {
        var dbo = db.db(dbName);

        dbo.collection(collectionName).find({userEmail: objectToInsert.userEmail}).toArray((error, result) => {

            if (error) response.send(error);

            if (result.length < 5) {
                dbo.collection(collectionName).insertOne(objectToInsert, (err, res) => {
                    if (err) throw err;

                    console.log("one row added for " + collectionName);
                    response.send(objectToInsert);
                    callBackFunction(collectionName, objectToInsert);
                });
            } else {
                response.send({error: 'You can add only five jobs'})
            }

        });

    }).catch((err) => {
        response.send(err);
    });

}

MongoDB.prototype.updateData = function(collectionName, updateIdObject, newObjectWithValues) {

    connectMongoDB().then((db) => {
        var dbo = db.db(dbName);
        dbo.collection(collectionName).updateOne(updateIdObject,
            {
                $set: newObjectWithValues
            }
        );
        db.close();

    });

}

MongoDB.prototype.deleteOneData = function(collectionName, query, response) {

    connectMongoDB().then((db) => {
        var dbo = db.db(dbName);
        dbo.collection(collectionName).remove(
            query,
            {justOne: true}
        );
        db.close();

        response.send(query)
    });

}

MongoDB.prototype.fetchDataWithInflux = function(collectionName, query, response) {

    connectMongoDB().then((db) => {
        var dbo = db.db(dbName);
        dbo.collection(collectionName).find(query).toArray((error, result) => {
            db.close();

            InfluxDB.getAllData(
                "SELECT * FROM pageLoadTime"
            ).then((pageLoadData) => {

                for (var i = 0; i < result.length; i++) {
                    for(var j = 0; j < pageLoadData.length; j++) {

                        if (result[i].jobId === pageLoadData[j].jobid) {

                            // Check Result ID exists
                            var isResultIdFound = result[i].result.find(function(jobResult) {
                                return jobResult.resultID === pageLoadData[j].resultID;
                            });

                            if (!isResultIdFound) {
                                result[i].result.push({
                                    resultID: pageLoadData[j].resultID,
                                    executedDate: pageLoadData[j].time
                                });
                            }

                            continue;
                        }

                    }

                }

                response.send(result);

            }).catch((errorInPageLoad) => {
                res.send(errorInPageLoad);
            });

            if (error) {
                response.send(error);
            }
        });
    }).catch((err) => {
        response.send(err);
    });

}

MongoDB.prototype.getAllData = async function(collectionName, query) {
    var dbObject = await connectDB();
    var allresults = await getResult(dbObject, collectionName, query);

    return new Promise((resolve) => {
        resolve(allresults);
    });
}

MongoDB.prototype.insertData = async function(collectionName, objectToInsert) {
    var dbObject = await connectDB();
    var insertedObject = await insertDataInto(dbObject, collectionName, objectToInsert);

    return new Promise((resolve) => {
        resolve(objectToInsert);
    });
}

module.exports = new MongoDB();
