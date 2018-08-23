const Influx = require('influx');
const influx = new Influx.InfluxDB({
    host: 'localhost',
    database: 'xsum'
});

function InfluxDB(){};

InfluxDB.prototype.getAllData = function(query, response) {

    influx.query(query).then((result) => {
        response.send(result);
    }).catch((error) => {
        response.send(error);
    });

}

module.exports = new InfluxDB();
