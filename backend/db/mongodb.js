var MongoClient = require('mongodb').MongoClient;
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

module.exports = new MongoDB();
