var MongoClient = require('mongodb').MongoClient;
var dbName = 'xsum';
var url = 'mongodb://xview.xops.it:27017/' + dbName;
var cmd = require('node-cmd');

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

MongoDB.prototype.insertData = function(collectionName, objectToInsert, response) {

    connectMongoDB().then((db) => {
        var dbo = db.db(dbName);
        dbo.collection(collectionName).insertOne(objectToInsert, (err, res) => {
            if (err) throw err;

            console.log("1 url data has been inserted");
            response.send(objectToInsert);

            // Send process request to sitespeed
            cmd.get(
                './sitespeed/v7.2.0/bin/sitespeed.js ' + objectToInsert.url, //+ ' ' + 'http://www.yahoo.com',
                function(err, data, stderr) {
                    dbo.collection(collectionName).updateOne({ID: objectToInsert.ID},
                        {
                            $set: {
                                status: 'Done',
                                resultUrl: 'www.google.com'
                            }
                        }
                    );
                    db.close();
                }
            );

        });
    }).catch((err) => {
        response.send(err);
    });

}

module.exports = new MongoDB();
