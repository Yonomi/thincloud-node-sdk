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
    log.info({eventType : 'message', topic : _topic.toString(), data : payload.toString()});

    try {
      json = JSON.parse(payload.toString());
    } catch (e) {
      let message = new Message(uuid.v4(), {message: 'invalid json'}, 'error', 400);
      log.error({eventType : 'emit', topic : _topic.toString(), data: message.toString()});
      return this._client.eventSource.emit('error', message.toJSON());
    }

    if (_topic.type === Constants.Topic.REGISTRATION) {
      this._client.deviceId = json && json.result ? json.result.deviceId : null;
      log.info({eventType : 'emit', listener : Constants.DeviceEvents.DEVICE_SUBSCRIPTION, data : json});
      this.eventSource.emit(`${Constants.DeviceEvents.DEVICE_SUBSCRIPTION}/${_topic.requestId}`, json);
    }

    if (_topic.type === Constants.Topic.DEVICE && _topic.action === Constants.Topic.DEVICE_REQUEST) {
      log.info({eventType : 'emit', listener : Constants.DeviceEvents.DEVICE_REQUEST, data : json});
      this.eventSource.emit(Constants.DeviceEvents.DEVICE_REQUEST, json);
      log.info({eventType : 'emit', listener : `${Constants.DeviceEvents.DEVICE_REQUEST}/${json.id}`, data : json});
      this.eventSource.emit(`${Constants.DeviceEvents.DEVICE_REQUEST}/${_topic.requestId}`, json);
    }

    if (_topic.type === Constants.Topic.DEVICE && _topic.action === Constants.Topic.DEVICE_COMMAND) {
      try {
        let command = new Command(json, this._client);
        log.info({eventType : 'emit', listener : Constants.DeviceEvents.DEVICE_COMMAND, data : json});
        this.eventSource.emit(Constants.DeviceEvents.DEVICE_COMMAND, command);
      } catch(err){
        log.error({eventType: 'command', topic : _topic.toString(), err: err})
      }
    }

    else {
      log.info({eventType : 'emit', listener : _topic.toString(), data : json});
      this.eventSource.emit(_topic.toString(), json);
    }
  }
}

module.exports = MessageProcessor;