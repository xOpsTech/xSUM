var MongoClient = require('mongodb').MongoClient;
var InfluxDB = require('./influxdb');
var AppConstants = require('../constants/AppConstants');
var config = require('../config/config');
var dbName = 'xsum';
var url = 'mongodb://' + config.MONGODB_IP + ':27017/';
const bcrypt = require('bcryptjs');

function MongoDB() {}

MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    console.log('Database created!');
    db.close();
});

function connectMongoDB(database) {
    return MongoClient.connect(url + database);
}

function connectDB(database) {
    return new Promise(resolve => {
        connectMongoDB(database).then(db => {
            resolve(db);
        });
    });
}

MongoDB.prototype.removeDatabase = async function(databaseName) {
    connectMongoDB(databaseName).then(db => {
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
};




//getAccountResult
function getAccountResult(db, databaseName, collectionName) {
 return new Promise(
     resolve => {
        var dbo = db.db(databaseName);
        dbo.collection(collectionName).find({})
        .toArray((error , result)=>{
            if(error){
                resolve(error);
            }
            resolve(result);
            console.log('mongodb.js')
            console.log(result)
            db.close();
        })
     }
 )
}
function updateResultFor (db , databaseName  , collectionName , query){
    return new Promise(resolve => {
       console.log('updateResultFor');
      
       var dbo = db.db(databaseName);
    var userList = dbo.collection(collectionName).find({_id:query._id})
     // console.log(userList);
     let data = {
         _id:query._id,
         mailStatus:false
     }
     if(userList){
         dbo.collection(collectionName).updateOne(
            {
                _id: query._id
            },
            {
                $set: data
            }, function (err, responses) {
                if (err) {
                    console.log(err);
                }
            }
         )
     }
     else{
         console.log('sdsd')
     }

    });
}

function updateResult (db , databaseName  , collectionName , query){
    return new Promise(resolve => {
       console.log('Hello Mongodb');
      
       var dbo = db.db(databaseName);
    var userList = dbo.collection(collectionName).find({_id:query._id})
     // console.log(userList);
     let data = {
         _id:query._id,
         mailStatus:true
     }
     if(userList){
         dbo.collection(collectionName).updateOne(
            {
                _id: query._id
            },
            {
                $set: data
            }, function (err, responses) {
                if (err) {
                    console.log(err);
                }
            }
         )
     }
     else{
         console.log('sdsd')
     }

    });
}

function getResult(db, databaseName, collectionName, query) {
    return new Promise(resolve => {
        var dbo = db.db(databaseName);
        dbo.collection(collectionName)
            .find(query)
            .toArray((error, result) => {
                if (error) {
                    resolve(error);
                }

                resolve(result);
                db.close();
            });
    });
}

function insertDataInto(db, databaseName, collectionName, objectToInsert) {
    return new Promise(resolve => {
        var dbo = db.db(databaseName);
        dbo.collection(collectionName).insertOne(
            objectToInsert,
            (error, result) => {
                console.log(
                    'one row added for ' +
                        collectionName +
                        ' in ' +
                        databaseName
                );
                if (error) {
                    resolve(error);
                }

                resolve(result);
                db.close();
            }
        );
    });
}

MongoDB.prototype.updateData = async function(
    databaseName,
    collectionName,
    updateIdObject,
    newObjectWithValues
) {
    connectMongoDB(databaseName).then(db => {
        var dbo = db.db(databaseName);
        dbo.collection(collectionName).updateOne(updateIdObject, {
            $set: newObjectWithValues
        });
        db.close();
    });
};

MongoDB.prototype.deleteOneData = function(
    databaseName,
    collectionName,
    query,
    response
) {
    connectMongoDB(databaseName).then(db => {
        var dbo = db.db(databaseName);
        dbo.collection(collectionName).remove(query, { justOne: true });
        db.close();
    });
};
MongoDB.prototype.getAccountData = async function (databaseName,
    collectionName){
        var dbObject = await connectDB(databaseName);
        var allresults = await getAccountResult(
            dbObject,
            databaseName,
            collectionName,
        
        );
        return new Promise(resolve => {
            resolve(allresults);
            console.log('Resolve')
            console.log(allresults);
        });
}
MongoDB.prototype.updateUserListfor = async function(
    databaseName,
    collectionName,
    query
){
    var dbObject = await connectDB(databaseName);
    var updateresults = await updateResultFor(
        dbObject,
        databaseName,
        collectionName,
        query
    );
    return new Promise(resolve => {
        resolve(updateresults);
    });
}

MongoDB.prototype.updateUserList = async function(
    databaseName,
    collectionName,
    query
){
    var dbObject = await connectDB(databaseName);
    var updateresults = await updateResult(
        dbObject,
        databaseName,
        collectionName,
        query
    );
    return new Promise(resolve => {
        resolve(updateresults);
    });
}


MongoDB.prototype.getAllData = async function(
    databaseName,
    collectionName,
    query
) {
    var dbObject = await connectDB(databaseName);
    var allresults = await getResult(
        dbObject,
        databaseName,
        collectionName,
        query
    );
    //console.log("TENANTSUSER");
    //console.log(allresults);

    return new Promise(resolve => {
        resolve(allresults);
    });
};

MongoDB.prototype.insertData = async function(
    databaseName,
    collectionName,
    objectToInsert
) {
    var dbObject = await connectDB(databaseName);
    var insertedObject = await insertDataInto(
        dbObject,
        databaseName,
        collectionName,
        objectToInsert
    );

    return new Promise(resolve => {
        resolve(objectToInsert);
    });
};

module.exports = new MongoDB();
