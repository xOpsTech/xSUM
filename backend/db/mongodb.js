var MongoClient = require('mongodb').MongoClient;
var InfluxDB = require('./influxdb');
var AppConstants = require('../constants/AppConstants');
var config = require('../config/config');
var dbName = 'xsum';
var url = 'mongodb://' + config.MONGODB_IP + ':27017/';
const bcrypt = require('bcryptjs');

function MongoDB(){};

MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    console.log("Database created!");
    db.close();
});

function connectMongoDB(database) {
    return MongoClient.connect(url + database);
}

function connectDB(database) {
    return new Promise((resolve) => {
        connectMongoDB(database).then((db) => {
            resolve(db);
        });
    });
}

MongoDB.prototype.removeDatabase = async function(databaseName) {
    connectMongoDB(databaseName).then((db) => {
        var dbo = db.db(databaseName);
        dbo.dropDatabase(function(error, result) {

            if (error) {
                console.log('Error in deleting Database : ' + error);
            } else {
                console.log('Database deletion success');
            }

            // After all the operations with db, close it.
            db.close();
        });

    });
}

function getResult(db, databaseName, collectionName, query) {
    return new Promise((resolve) => {
        var dbo = db.db(databaseName);
        dbo.collection(collectionName).find(query).toArray((error, result) => {

            if (error) {
                resolve(error);
            }

            resolve(result);
            db.close();
        });
    });
}

function insertDataInto(db, databaseName, collectionName, objectToInsert) {
    return new Promise((resolve) => {
        var dbo = db.db(databaseName);
        dbo.collection(collectionName).insertOne(objectToInsert, (error, result) => {
            console.log("one row added for " + collectionName + ' in ' + databaseName);
            if (error) {
                resolve(error);
            }

            resolve(result);
            db.close();
        });
    });
}

MongoDB.prototype.updateData = async function(databaseName, collectionName, updateIdObject, newObjectWithValues) {

    connectMongoDB(databaseName).then((db) => {
        var dbo = db.db(databaseName);
        dbo.collection(collectionName).updateOne(updateIdObject,
            {
                $set: newObjectWithValues
            }
        );
        db.close();

    });

}

MongoDB.prototype.deleteOneData = function(databaseName, collectionName, query, response) {

    connectMongoDB(databaseName).then((db) => {
        var dbo = db.db(databaseName);
        dbo.collection(collectionName).remove(
            query,
            {justOne: true}
        );
        db.close();
    });

}

MongoDB.prototype.getAllData = async function(databaseName, collectionName, query) {
    var dbObject = await connectDB(databaseName);
    var allresults = await getResult(dbObject, databaseName, collectionName, query);

    return new Promise((resolve) => {
        resolve(allresults);
    });
}

MongoDB.prototype.insertData = async function(databaseName, collectionName, objectToInsert) {
    var dbObject = await connectDB(databaseName);
    var insertedObject = await insertDataInto(dbObject, databaseName, collectionName, objectToInsert);

    return new Promise((resolve) => {
        resolve(objectToInsert);
    });
}

module.exports = new MongoDB();
