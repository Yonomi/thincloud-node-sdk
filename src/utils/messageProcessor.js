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
    log.info(`get a json from ${topic} and is ${payload.toString()}`);

    try {
      json = JSON.parse(payload.toString());
    } catch (e) {
      log.info(`invalid json from ${topic}, json data: ${payload.toString()}`);
      return this._client.eventSource.emit('error', new Message(uuid.v4(), {message: 'invalid json'}, 'error', 400).toJSON());
    }

    if (_topic.type === Constants.Topic.REGISTRATION) {
      this._client.deviceId = json.result.deviceId || null;
      log.info(`will emit a subscription event`);
      this.eventSource.emit(Constants.DeviceEvents.DEVICE_SUBSCRIPTION, json);
    }

    if (_topic.type === Constants.Topic.DEVICE && _topic.action === Constants.Topic.DEVICE_REQUEST) {
      log.info(`will emit a device event`);
      this.eventSource.emit(Constants.DeviceEvents.DEVICE_REQUEST, json);
      this.eventSource.emit(`${Constants.DeviceEvents.DEVICE_REQUEST}/${json.id}`, json);
    }

    if (_topic.type === Constants.Topic.DEVICE && _topic.action === Constants.Topic.DEVICE_COMMAND) {
      log.info(`will emit a device command event`);
      this.eventSource.emit(Constants.DeviceEvents.DEVICE_COMMAND, new Command(json, this._client));
    }
  }
}

module.exports = MessageProcessor;