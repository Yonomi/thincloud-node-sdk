'use strict';

const Request = require('./request');
const RequestManager = require('./requestManager');
const { RegistrationTopic, RequestTopic, CommandTopic } = require('./topicBuilder');

//TODO: add ability to subscirbe/unsubscribe to commands and route them properly

class RelatedDevice {
  constructor(device, parent){
    this._parent = parent;
    this._self = device;
    Object.assign(this, device)
  }

  get request() {
    return {
      publish: (method, params) => {
        const request = new Request(method, params);
        return new RequestManager(
          new RequestTopic(this.deviceId, request.id),
          request,
          this._parent
        ).publish();
      },
      rpc: (method, params, duration) => {
        const request = new Request(method, params);
        return new RequestManager(
          new RequestTopic(this.deviceId, request.id),
          request,
          this._parent,
          duration || 30000
        ).rpc();
      }
    };
  }

  commission(opts){
    if(!opts) opts = {};
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
      .then(
        data => {
          this.deviceId = data.result.deviceId;
          this._parent.subscribe(new CommandTopic(this.deviceId).request);
          return this.toJSON();
        }
      )
  }

  decommission(opts){
    if(!opts) opts = {};
    let _method = 'decommission';
    if(opts.purge) _method = _method.concat("?purge=true");

    const request = new Request(_method, [
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
      .then(
        (data) => {
          this._parent.unsubscribe(new CommandTopic(this.deviceId).request);
          return this.toJSON();
        }
      );
  }

  toJSON(){
    return this._self;
  }


}

module.exports = RelatedDevice;