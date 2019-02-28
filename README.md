# xSumFE
### Pre-requisite
Need to have mongodb, influxdb on your machine.
Linux would be the most suitable OS.
Need to have npm and node install on your machine
### Guide
Clone the project
```sh
$ git clone https://github.com/xOpsTech/xSUM.git
```
Go to xSUM folder and run
```sh
$ npm install
```

Go to src/config folder and run
```sh
$ ln -s dev-config.js config.js
```

Then go back to xSUM folder and run to build
```sh
$ npm run build
```

You can start dev server with
```sh
$ npm start
```

Then go to backend folder and run
```sh
$ npm install
```

Then go to backend/config folder and run
```sh
$ ln -s dev-config.js config.js
```

Then go to back to backend folder and run (This will start the service)
```sh
$ npm run service
```

Other commands
```
$ npm run scheduler              ## To start scheduler(Inside backend folder)
$ npm run execute create-tenants ## To create influxdb tenants(Inside backend folder)
$ npm run execute update-points  ## To update points with relevant to already added jobs(Inside backend folder)
```
