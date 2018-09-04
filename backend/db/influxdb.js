const Influx = require('influx');
const influx = new Influx.InfluxDB({
    host: 'localhost',
    database: 'xsum'
});

function InfluxDB(){};

InfluxDB.prototype.getAllData = function(query) {
    return influx.query(query);
}

InfluxDB.prototype.removeData = function(query) {
    influx.query(query);
}

module.exports = new InfluxDB();
