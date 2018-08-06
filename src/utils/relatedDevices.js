'use strict';
const Utils = require('./../utils');
const { RequestTopic } = require('./../utils/topicBuilder');

class RelatedDevices {
  constructor(client) {
    this.client = client;
  }

  load(){
    return this.getRelatedDevices();
  }

  getRelatedDevices(){
    return this.getRelatedDeviceIds()
      .then(relatedDeviceIds => Promise.all(relatedDeviceIds.map((relatedDevice) => {
        return this.getRelatedDevice(relatedDevice.deviceId)
      })));
  }

  getRelatedDevice(relatedDeviceId){
    const request = new Utils.Request('get', [{}]);
    return new Utils.RequestManager(
      new RequestTopic(relatedDeviceId, request.id),
      request,
      this.client,
      300000
    )
      .rpc()
      .then(response => {
        return response.result.body;
      })
  }

  getRelatedDeviceIds(){
    if(!this.client.deviceId){
      return Promise.resolve([]);
    }

    const request = new Utils.Request('get', [{}]);
    return new Utils.RequestManager(
      new RequestTopic(this.client.deviceId, request.id),
      request,
      this.client,
      300000
    )
      .rpc()
      .then(response => {
        return response.result.body.relatedDevices;
      })
  }

}

module.exports = RelatedDevices;