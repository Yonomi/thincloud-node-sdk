'use strict';

const awsIot = require('aws-iot-device-sdk');
const Utils = require('./utils');
const {RegistrationTopic, RequestTopic, CommandTopic} = require('./utils/topicBuilder');
const log = require('./utils').Logger

class Client {

  constructor(config) {
    this._config = config;
  }

  get eventSource() {
    return this._self;
  }

  setConfiguration(config) {
    this._config = config;
  }

  get config() {
    return this._config;
  }

  get deviceId() {
    return this._deviceId;
  }

  set deviceId(id) {
    this._deviceId = id;
  }

  getCommissionTimeout() {
    return !this.config.timeoutCommission ? Utils.Constants.defaults.timeout : this.config.timeoutCommission;
  }

  getRequestTimeout() {
    return !this.config.timeoutRequest ? Utils.Constants.defaults.timeout : this.config.timeoutRequest;
  }

  init() {
    log.info('initialize aws-iot connector');
    return new Promise((resolve, reject) => {
      if (!this._config) {
        log.error('can\'t connect to AWS because no configuration data was provided');
        throw new Error('configuration data not set. Can\'t connect to aws');
      }

      if (!this._config.shadow) {
        log.info('connect to AWS as a device');
        this._self = awsIot.device(this._config);
      }
      else {
        log.info('connect to AWS as a thingshadow');
        this._self = awsIot.thingShadow(this._config);
      }

      //set a processor to filter the messages
      const messageProcessor = new Utils.MessageProcessor(this);
      this._self.on('message', (topic, payload) => {
        messageProcessor.process(topic, payload);
      });

      this._self.on('connect', () => {
        this._commissioningDevice().then(resolve, reject);
      });

      this._self.on('error', reject)

    });
  }

  _commissioningDevice() {
    const commissionRequest = new Utils.Request('commission', [{
      data: {
        deviceType: this.config.deviceType,
        physicalId: this.config.physicalId
      }
    }]);
    const commissionTopic = new RegistrationTopic(`${this.config.deviceType}_${this.config.physicalId}`, commissionRequest.id);


    this._self.subscribe(commissionTopic.response);

    return new Utils.RequestManager(commissionTopic, commissionRequest, this, this.getCommissionTimeout())
      .rpc()
      .then((data) => {
        this._self.subscribe(new RequestTopic(this.deviceId).response);
        this._self.subscribe(new CommandTopic(this.deviceId).request);
        return data;
      });
  }

  get request() {
    return {
      publish: (method, params) => {
        const request = new Utils.Request(method, params);
        return new Utils.RequestManager(new RequestTopic(this.deviceId, request.id), request, this).publish()
      },
      rpc: (method, params, duration) => {
        const request = new Utils.Request(method, params);
        return new Utils.RequestManager(new RequestTopic(this.deviceId, request.id), request, this, duration || this.getRequestTimeout()).rpc()
      }
    }
  }

  //TODO: work in progress, need to abstact publish and subscribe as promises
  // Need to respect the existing function signature with support of callback and promise
  // add an event log
  publish(topic, payload, opts, cb) {
    return new Promise((resolve, reject) => {
      this._self.publish(topic, payload, opts || null, (err) => {
        if (err) reject(err);
        else resolve()
      })
    })
  }

  //TODO: write abstraction for subscribe;
  subscribe(topic, opts, cb) {
    return new Promise((resolve, reject) => {
      if(topic === '' || topic === null) {
        log.error({eventType : 'subscribe', topic : 'topic', data : opts});
        this.disconnect();
        throw new Error('subscriptionFailure', 'subscriptionFailure')
      }

      this._self.subscribe(topic, opts, (err) => {
        if(err) {
          log.error({eventType : 'subscribe', topic : 'topic', data : opts});
          this.disconnect();
          throw new Error('subscriptionFailure')
        } else {
          log.info({eventType : 'subscribe', topic : 'topic', data : opts});
          resolve();
        }
      })
    })



  }

  disconnect(opts) {
    return new Promise((resolve, reject) => {
      this._self.end(opts, (err,data)=>{
        if(err) reject(err);
        else resolve()
      });
    })
  };

}

module.exports = Client;