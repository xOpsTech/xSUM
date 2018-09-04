var MongoClient = require('mongodb').MongoClient;
var InfluxDB = require('./influxdb');
var dbName = 'xsum';
var url = 'mongodb://xview.xops.it:27017/' + dbName;

function MongoDB(){};

MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    console.log("Database created!");
    db.close();
});

function connectMongoDB() {
    return MongoClient.connect(url);
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

MongoDB.prototype.insertData = function(collectionName, objectToInsert, response, callBackFunction) {
    connectMongoDB().then((db) => {
        var dbo = db.db(dbName);

        dbo.collection(collectionName).insertOne(objectToInsert, (err, res) => {
            if (err) throw err;

            console.log("one row added for " + collectionName);
            response.send(objectToInsert);
            callBackFunction(collectionName, objectToInsert);

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

module.exports = new MongoDB();
