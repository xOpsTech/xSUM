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
            db.close();
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
            db.close();
        });
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
