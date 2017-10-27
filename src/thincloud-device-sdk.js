'use strict';

const awsIot = require('aws-iot-device-sdk');
const Utils = require('./utils');
const {RegistrationTopic, RequestTopic, CommandTopic} = require('./utils/topicBuilder');
const log = require('./utils').Logger;

class Client {

  constructor(config) {
    this._config = config;
    this._relatedDevices = [];
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
        this.commission(this.config).then(resolve, reject);
      });

      this._self.on('error', (err) => {
        console.log('init error', err)
      })

    });
  }


  commission(deviceInfo, opts) {

    if(!opts) opts = {};
    opts.retry = true;

    let _retryCount = opts.retryCount || 10;

    let _commission = () => {
      const commissionRequest = new Utils.Request('commission', [{
        data: {
          deviceType: deviceInfo.deviceType,
          physicalId: deviceInfo.physicalId
        }
      }]);
      const commissionTopic = new RegistrationTopic(`${deviceInfo.deviceType}_${deviceInfo.physicalId}`, commissionRequest.id);

      return new Utils.RequestManager(commissionTopic, commissionRequest, this, this.getCommissionTimeout())
        .rpc()
        .then((data) => {
          this._self.subscribe(new CommandTopic(this.deviceId).request);
          return data;
        }, (err) => {
          _retryCount -- ;
          if(opts.retry && _retryCount >= 0) return _commission();
        })
    };

    return _commission();
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

  addRelatedDevice() {

  }


  publish(topic, payload, opts, cb) {
    return new Promise((resolve, reject) => {
      if (topic === '' || topic === null) {
        log.error({eventType: 'publish', topic: topic, data: payload});
        throw new Error('publishFailure', 'publishFailure')
      }

      this._self.publish(topic, payload, opts || null, (err) => {
        if (err) {
          log.error({eventType: 'publish', topic: topic, data: payload});
          reject(err);
          throw new Error('publishFailure', 'publishFailure')
        }
        else {
          log.info({eventType: 'publish', topic: topic, data: payload, opts: opts});
          resolve()
        }
      })
    })
  }

  //TODO: write abstraction for subscribe;
  subscribe(topic, opts) {
    return new Promise((resolve, reject) => {
      if (topic === '' || topic === null) {
        log.error({eventType: 'subscribe', topic: topic, opts: opts});
        this.disconnect();
        throw new Error('subscriptionFailure', 'subscriptionFailure')
      }

      this._self.subscribe(topic, opts, (err) => {
        if (err) {
          log.error({eventType: 'subscribe', topic: topic, opts: opts});
          this.disconnect();
          throw new Error('subscriptionFailure')
        } else {
          log.info({eventType: 'subscribe', topic: topic, opts: opts});
          resolve();
        }
      })
    })
  }

  unsubscribe(topic, opts) {
    return new Promise((resolve, reject) => {
      if (topic === '' || topic === null) {
        log.error({eventType: 'unsubscribe', topic: topic, opts: opts});
        this.disconnect();
        throw new Error('unsubscribeFailure', 'unsubscribeFailure')
      }
      this._self.unsubscribe(topic, (err) => {
        if (err) {
          log.error({eventType: 'unsubscribe', topic: topic, opts: opts});
          throw new Error('unsubscribeFailure');
        } else {
          log.info({eventType: 'unsubscribe', topic: topic, opts: opts});
          resolve();
        }
      })
    })
  }

  disconnect(opts) {
    return new Promise((resolve, reject) => {
      this._self.end(opts, (err, data) => {
        if (err) reject(err);
        else resolve()
      });
    })
  };

}

module.exports = Client;