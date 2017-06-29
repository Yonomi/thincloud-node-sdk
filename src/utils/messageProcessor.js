'use strict';

const Topic = require('./topic');
const Constants = require('./constants');
const Message = require('./message');
const Command = require('./command');
const uuid = require('uuid');
const log = require('./logger')

class MessageProcessor {

  constructor(client) {
    this._client = client;
    this._eventSource = client.eventSource;
  }

  get eventSource() {
    return this._eventSource;
  }

  process(topic, payload) {
    const _topic = new Topic(topic);
    let json;
    log.info({eventType : 'message', topic : _topic, data : payload});

    try {
      json = JSON.parse(payload.toString());
    } catch (e) {
      let message = new Message(uuid.v4(), {message: 'invalid json'}, 'error', 400);
      log.error({eventType : 'emit', topic : _topic, data: message.toString()});
      return this._client.eventSource.emit('error', message.toJSON());
    }

    if (_topic.type === Constants.Topic.REGISTRATION) {
      this._client.deviceId = json.result.deviceId || null;
      log.info({eventType : 'emit', topic : _topic, data : json, listener : Constants.DeviceEvents.DEVICE_SUBSCRIPTION});
      this.eventSource.emit(Constants.DeviceEvents.DEVICE_SUBSCRIPTION, json);
    }

    if (_topic.type === Constants.Topic.DEVICE && _topic.action === Constants.Topic.DEVICE_REQUEST) {
      log.info({eventType : 'emit', topic : _topic, data : json, listener : Constants.DeviceEvents.DEVICE_REQUEST});
      log.info({eventType : 'emit', topic : _topic, data : json, listener : `${Constants.DeviceEvents.DEVICE_REQUEST}/${json.id}`);
      this.eventSource.emit(Constants.DeviceEvents.DEVICE_REQUEST, json);
      this.eventSource.emit(`${Constants.DeviceEvents.DEVICE_REQUEST}/${json.id}`, json);
    }

    if (_topic.type === Constants.Topic.DEVICE && _topic.action === Constants.Topic.DEVICE_COMMAND) {
      try {
        let command = new Command(json, this._client);
        log.info({eventType : 'emit', topic : _topic, data : json, listener : Constants.DeviceEvents.DEVICE_COMMAND});
        this.eventSource.emit(Constants.DeviceEvents.DEVICE_COMMAND, command);
      } catch(err){
        log.error({eventType: 'command', topic : _topic, data: err})
      };

    }
  }
}

module.exports = MessageProcessor;