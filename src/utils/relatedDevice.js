'use strict';

const Request = require('./request');
const RequestManager = require('./requestManager')
const { RegistrationTopic, RequestTopic, CommandTopic } = require('./topicBuilder');

//TODO: add ability to subscirbe/unsubscribe to commands and route them properly

class RelatedDevice {
  constructor(parent, deviceId, deviceType, physicalId){
    this._parent = parent;
    this.deviceId = deviceId;
    this.deviceType = deviceType;
    this.physicalId = physicalId;
  }

  get request() {
    return {
      publish: (method, params) => {
        const request = new Request(method, params);
        return new RequestManager(
          new RequestTopic(this.deviceId, request.id),
          request,
          this
        ).publish();
      },
      rpc: (method, params, duration) => {
        const request = new Request(method, params);
        return new RequestManager(
          new RequestTopic(this.deviceId, request.id),
          request,
          this,
          duration || 30000
        ).rpc();
      }
    };
  }

  commission(){
    const commissionRequest = new Request('commission', [
      {
        data: this.toJSON()
      }
    ]);

    const commissionTopic = new RegistrationTopic(
      `${this.deviceType}_${this.physicalId}`,
      commissionRequest.id
    );
    return new RequestManager(
      commissionTopic,
      commissionRequest,
      this._parent,
      30000
    )
      .rpc()
  }

  decommission(){
    const request = new Request('decommission', [
      {
        data: this.toJSON()
      }
    ]);

    const topic = new RegistrationTopic(`${this.deviceType}_${this.physicalId}`, request.id);

    return new RequestManager(
      topic,
      request,
      this._parent,
      30000
    )
      .rpc()
  }

  toJSON(){
    return {
      deviceId: this.deviceId,
      deviceType: this.deviceType,
      physicalId: this.physicalId,
      relatedDevices: [{
        deviceId: this._parent.deviceId
      }]
    }
  }


}

module.exports = RelatedDevice;