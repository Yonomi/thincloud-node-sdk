# Thincloud Node SDK

Helps connect the device to ThinCloud

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Yo need to have the certificates of the device
Three certificates are required:

* aws-root-ca.pem
* certificate.pem.crt
* private.pem.key

### Installing

Add the dependency in your package json

```
"@yonomi/thincloud-device-sdk": "git+ssh://git@github.com/Yonomi/thincloud-device-sdk.git"
```

and then run npm install

### First Steps - Uses and Examples

First you need require the module

```
const sdk = require('@yonomi/thincloud-device-sdk');
```

get an instance of the sdk

```
const client = new sdk();
```

configuration values are required, in thincloud-testclient is an example with a config.js (and a configuration loader)

```
const configuration = {
  keyPath: device private keyPath,
  certPath: device certificate path,
  caPath: root CA certificate path,
  clientId: client identifier,
  region: aws region to connect,
  physicalId: device specification. Used in commissioning method,
  deviceType: device specification. Used in commissioning method,
  shadow: boolean value. Indicates to connect to a aws as a device or thingshadow,
  timeoutCommission: timeout for a commission request. Default value set in 10 seconds,
  timeoutRequest: timeout for a device request. Default value set in 10 seconds
};


client.setConfiguration(configuration);
```

init the commissioning device, will return a promise to continue working

```
client.init()
```

to request a device two can use two options, rpc (which uses the timeout and wait for a response)

```
client.request.rpc(method, payload)
```

Example:

```
client.request.rpc('get', [{data: {"hello": "world"}}])
    .then((data)=>console.log(data), (err)=> console.log(err));
}, (err)=>{
  console.log(err);
});
```

and asynchronous (don't use the timeout and not wait for a response)

```
client.request.publish(method, payload)
```

Example:

```
client.request.publish('get', []).then(data => console.log(data), err => console.log(err));
```

Add a listener for a command device

```
client.eventSource.on('commands', (data) => {
  data.respond([id|null], payload).then(function (err, res));
});
```

Add a listener for subscription

```
client.eventSource.on('subscription', function (err, res))
```

Add a listener for request

```
client.eventSource.on('requests', function (err, res))
```


### Managing Child/Related Devices

Related Device accessor

```
client.relatedDeviceMap[{deviceId}]
```

Add a Child device

```
client.relatedDevices.add({deviceId}, {deviceType}, {physicalId})
```

Remove a Child device

```
client.relatedDevices.remove({deviceId}, {deviceType}, {physicalId})
```

Update Related Device State (publish)

```
client.relatedDevicesMap[{deviceId}].request.publish({method}, {params})
```

Update Related Device State (RPC)

```
client.relatedDevicesMap[{deviceId}].request.rpc({method}, {params})
```

Related Device Management

Get Related devices from cloud

```
client.relatedDeviceManager.getRelatedDevices()
```

Get Related device Ids from cloud

```
client.relatedDeviceManager.getRelatedDeviceIds()
```

Get Related device

```
client.relatedDeviceManager.getRelatedDevice({Id})
```

Related Device Synchronization
 
```
client.relatedDevices.sync()
```