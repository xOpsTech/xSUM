const Influx = require('influx');
var config = require('../config/config');

function InfluxDB() {}

InfluxDB.prototype.createDatabase = function(databaseName) {
    const influx = new Influx.InfluxDB({
        host: config.INFLUXDB_IP
    });
    console.log('Database created: ' + databaseName);
    influx.createDatabase(databaseName);
};

InfluxDB.prototype.removeDatabase = function(databaseName) {
    const influx = new Influx.InfluxDB({
        host: config.INFLUXDB_IP
    });
    console.log('Database has been deleted: ' + databaseName);
    influx.dropDatabase(databaseName);
};

InfluxDB.prototype.insertData = async function(
    databaseName,
    tableName,
    tagsObj,
    valuesToInsert
) {
    const influx = new Influx.InfluxDB({
        host: config.INFLUXDB_IP,
        database: databaseName
    });
    return influx.writeMeasurement(tableName, [
        { tags: tagsObj, fields: valuesToInsert }
    ]);
};

InfluxDB.prototype.getAllData = function(databaseName, query) {
    const influx = new Influx.InfluxDB({
        host: config.INFLUXDB_IP,
        database: databaseName
    });
    return influx.query(query);
};

InfluxDB.prototype.removeData = async function(databaseName, query) {
    const influx = new Influx.InfluxDB({
        host: config.INFLUXDB_IP,
        database: databaseName
    });
    influx.query(query);
};

InfluxDB.prototype.getAllDataFor = async function(databaseName, query) {
    const influx = new Influx.InfluxDB({
        host: config.INFLUXDB_IP,
        database: databaseName
    });
    return new Promise(resolve => {
        influx
            .query(query)
            .then(result => {
                resolve(result);
            })
            .catch(error => {
                resolve(error);
            });
    });
};

InfluxDB.prototype.configureRetensionPolicy = function(databaseName) {
    const influx = new Influx.InfluxDB({
        host: config.INFLUXDB_IP,
        database: databaseName
    });

    return influx.alterRetentionPolicy('autogen', {
        duration: retension,
        replication: 1
    });
};

InfluxDB.prototype.getRetensionDuration = function(databaseName) {
    const influx = new Influx.InfluxDB({
        host: config.INFLUXDB_IP,
        database: databaseName
    });

    return influx.showRetentionPolicies(databaseName);
};

module.exports = new InfluxDB();
