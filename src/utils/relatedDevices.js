'use strict';
const Utils = require('./../utils');
const { RequestTopic } = require('./../utils/topicBuilder');

class RelatedDevices {
  constructor(parent) {
    this._parent = parent;
  }

  load(){
    return this.getRelatedDevices();
  }

  getRelatedDevices(){
    return this.getRelatedDeviceIds()
      .then(relatedDeviceIds => Promise.all(relatedDeviceIds.map((id) => {
        return this.getRelatedDevice(id)
      })));
  }

  getRelatedDevice(relatedDeviceId){
    const request = new Utils.Request('get', [{}]);
    return new Utils.RequestManager(
      new RequestTopic(relatedDeviceId, request.id),
      request,
      this,
      300000
    )
      .rpc()
      .then(device => {
        return new Utils.RelatedDevice(this._parent, device.deviceId, device.deviceType, device.physicalId);
      })
  }

  getRelatedDeviceIds(){
    const request = new Utils.Request('get', [{}]);
    return new Utils.RequestManager(
      new RequestTopic(this._parent.deviceId, request.id),
      request,
      this,
      300000
    )
      .rpc()
      .then(device => {
        return device.relatedDevices;
      })
  }

}

module.exports = RelatedDevices;