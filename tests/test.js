'use strict';

const SDK = require('../src/thincloud-device-sdk');

const config = {
  "deviceType": "br400",
  "physicalId": "100000",
  "requestTimeout": 5000,
  "log": {
    "level": "trace"
  },
  "certs": {
    "keyPath": "./certs/private.pem.key",
    "certPath": "./certs/certificate.pem.crt",
    "caPath": "./certs/aws-root-ca.pem"
  },
  "iotConnection": {
    "shadow": true,
    "port": 8883,
    "host": "a30sls2kwzsz93.iot.us-west-2.amazonaws.com",
    "region": "us-west-2"
  }
}

const configuration = {
  keyPath: config.certs.keyPath,
  certPath: config.certs.certPath,
  caPath: config.certs.caPath,
  clientId: config.iotConnection.clientId,
  region: config.iotConnection.region,
  physicalId: config.physicalId,

  deviceType: config.deviceType,
  shadow: config.iotConnection.shadow,
  timeoutCommission: config.timeoutCommission,
  timeoutRequest: config.timeoutRequest
};

const client = new SDK();
client.setConfiguration(configuration);
client.init({
  autoCommission: false
}).then((data) => {

  client.eventSource.on('commands', (data) => {
    data.respond(null, {"message": "get command call"}).then(data=> console.log(data), err => console.log('get err'));
  });

  client.eventSource.on('subscription', (data)=> {
    console.log(`get subscription response ok ${data}`);
  });

}, (err)=> {
  console.log(err);
});







