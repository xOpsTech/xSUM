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

MongoDB.prototype.insertData = function(collectionName, objectToInsert, response) {

    connectMongoDB().then((db) => {
        var dbo = db.db(dbName);
        dbo.collection(collectionName).insertOne(objectToInsert, (err, res) => {
            if (err) throw err;

            console.log("1 url data has been inserted");
            response.send(objectToInsert);

            // Send process request to docker

            // TODO: need to remove this code block after docker implemented
            setTimeout(() => {
                dbo.collection(collectionName).updateOne({ID: objectToInsert.ID},
                    {
                        $set: {
                            status: 'Done'
                        }
                    }
                );
                db.close();
            }, 30000);
            // TODO: need to remove this code block after docker implemented

        });
    }).catch((err) => {
        response.send(err);
    });

}

module.exports = new MongoDB();
