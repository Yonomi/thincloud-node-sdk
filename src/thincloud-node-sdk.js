'use strict';

const awsIot = require('aws-iot-device-sdk');
const Utils = require('./utils');
const {
  RegistrationTopic,
  RequestTopic,
  CommandTopic
} = require('./utils/topicBuilder');
const log = require('./utils').Logger;
const RelatedDevices = require('./utils/relatedDevices');

class Client {

  constructor(config) {
    this._config = config;
    this.relatedDevicesMap = {};
    this._self = null;
    this._isCommissioned = false;
    this._isConnected = false;
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

  set config(config) {
    this._config = config;
  }

  get deviceId() {
    return this._deviceId;
  }

  set deviceId(id) {
    this._deviceId = id;
  }

  get isCommissioned() {
    return this._isCommissioned;
  }

  set isCommissioned(val) {
    this._isCommissioned = val;
  }

  get isConnected() {
    return this._isConnected;
  }

  set isConnected(val) {
    this._isConnected = val;
  }

  get relatedDeviceManager() {
    return new RelatedDevices(this);
  }

  getCommissionTimeout() {
    return !this.config.timeoutCommission ?
      Utils.Constants.defaults.timeout :
      this.config.timeoutCommission;
  }

  getRequestTimeout() {
    return !this.config.timeoutRequest ?
      Utils.Constants.defaults.timeout :
      this.config.timeoutRequest;
  }

  init(opts) {
    if (!opts) opts = {};

    if (opts.autoCommission == null) opts.autoCommission = true;

    log.info('initialize aws-iot connector');
    return new Promise((resolve, reject) => {
      if (!this._config) {
        log.error("can't connect to AWS because no configuration data was provided");
        throw new Error("configuration data not set. Can't connect to aws");
      }

      return this.connect().then(() => {
        // set a processor to filter the messages
        const messageProcessor = new Utils.MessageProcessor(this);
        this._self.on('message', (topic, payload) => {
          messageProcessor.process(topic, payload);
        });

        this._self.on('connect', () => {
          this.isConnected = true;

          if(opts.syncRelatedDevices){
            this.relatedDevices.sync();
          }

          opts.autoCommission ? this.commission(resolve, reject) : resolve();

        });

        this._self.on('error', reject);
      });
    });
  }

  commission(opts) {
    if (!opts) opts = {};
    opts.retry = false;

    if (this.isCommissioned && !opts.force) {
      return Promise.resolve();
    }

    let _retryCount = opts.retryCount || 10;

    let _commission = () => {
      const commissionRequest = new Utils.Request('commission', [{
        data: {
          deviceType: this.config.deviceType,
          physicalId: this.config.physicalId
        }
      }]);
      const commissionTopic = new RegistrationTopic(
        `${this.config.deviceType}_${this.config.physicalId}`,
        commissionRequest.id
      );

      return new Utils.RequestManager(
        commissionTopic,
        commissionRequest,
        this,
        this.getCommissionTimeout()
      )
        .rpc()
        .then(
          data => {
            this.deviceId = data.result.deviceId;
            this.isCommissioned = true;
            this.subscribe(new CommandTopic(this.deviceId).request);
            return data;
          },
          err => {
            this.isCommissioned = false;
            _retryCount--;
            if (opts.retry && _retryCount >= 0) return _commission();
            else {
              return Promise.reject(err);
            }
          }
        );
    };

    return _commission();
  }

  get request() {
    return {
      publish: (method, params) => {
        const request = new Utils.Request(method, params);
        return new Utils.RequestManager(
          new RequestTopic(this.deviceId, request.id),
          request,
          this
        ).publish();
      },
      rpc: (method, params, duration) => {
        const request = new Utils.Request(method, params);
        return new Utils.RequestManager(
          new RequestTopic(this.deviceId, request.id),
          request,
          this,
          duration || this.getRequestTimeout()
        ).rpc();
      }
    };
  }

  get relatedDevice() {
    return {
      add: (deviceId, deviceType, physicalId) => {
        let relatedDevice = new Utils.RelatedDevice(this, deviceId, deviceType, physicalId);
        return relatedDevice.commission()
          .then((device) => {
            this.relatedDevicesMap[device.deviceId] = relatedDevice;
            return device;
          })
      },
      remove: (deviceId, deviceType, physicalId) => {
        let relatedDevice = new Utils.RelatedDevice(this, deviceId, deviceType, physicalId);
        return relatedDevice.decommission()
          .then((device) => {
            delete this.relatedDevicesMap[device.deviceId];
            return device;
          })
      }
    }
  }

  get relatedDevices() {
    return {
      sync: () => {
        return this.relatedDeviceManager.load()
          .then(relatedDevices => {
            relatedDevices.forEach((relatedDevice) => {
              this.relatedDevicesMap[relatedDevice.deviceId] = relatedDevice;
            });
            return relatedDevices;
          })
      }
    }
  }

  publish(topic, payload, opts, cb) {
    return new Promise((resolve, reject) => {
      if (topic === '' || topic === null) {
        log.error({
          eventType: 'publish',
          topic,
          data: payload
        });
        throw new Error('publishFailure', 'publishFailure');
      }

      this._self.publish(topic, payload, opts || null, err => {
        if (err) {
          log.error({
            eventType: 'publish',
            topic,
            data: payload
          });
          reject(err);
          throw new Error('publishFailure', 'publishFailure');
        } else {
          log.info({
            eventType: 'publish',
            topic,
            data: payload,
            opts
          });
          resolve();
        }
      });
    });
  }

  subscribe(topic, opts) {
    return new Promise((resolve, reject) => {
      if (topic === '' || topic === null) {
        log.error({
          eventType: 'subscribe',
          topic,
          opts
        });
        this.disconnect();
        throw new Error('subscriptionFailure', 'subscriptionFailure');
      }

      this._self.subscribe(topic, opts, err => {
        if (err) {
          log.error({
            eventType: 'subscribe',
            topic,
            opts
          });
          this.disconnect();
          throw new Error('subscriptionFailure');
        } else {
          log.info({
            eventType: 'subscribe',
            topic,
            opts
          });
          resolve();
        }
      });
    });
  }

  unsubscribe(topic, opts) {
    return new Promise((resolve, reject) => {
      if (topic === '' || topic === null) {
        log.error({
          eventType: 'unsubscribe',
          topic,
          opts
        });
        this.disconnect();
        throw new Error('unsubscribeFailure', 'unsubscribeFailure');
      }
      this._self.unsubscribe(topic, err => {
        if (err) {
          log.error({
            eventType: 'unsubscribe',
            topic,
            opts
          });
          throw new Error('unsubscribeFailure');
        } else {
          log.info({
            eventType: 'unsubscribe',
            topic,
            opts
          });
          resolve();
        }
      });
    });
  }

  connect(opts) {
    return new Promise((resolve, reject) => {
      if (this._self != null) {
        this._self.end();
        this._self = null;
      }

      try {
        if (!this._config.shadow) {
          log.info('connect to AWS as a device');
          this._self = awsIot.device(this._config);
          resolve();
        } else {
          log.info('connect to AWS as a thingshadow');
          this._self = awsIot.thingShadow(this._config);
          resolve();
        }
      } catch (ex) {
        reject(ex);
      }
    });
  }

  disconnect(opts) {
    return new Promise((resolve, reject) => {
      this._self.end(opts, (err, data) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

}

module.exports = Client;