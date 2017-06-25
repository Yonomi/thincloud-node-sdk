'use strict';

const Utils = require('./index');
const uuid = require('uuid');

class MessageProcessor {

  constructor(client) {
    this._client = client;
    this._eventSource = client.eventSource;
  }

  get eventSource() {
    return this._eventSource;
  }

  process(topic, payload) {
    const _topic = new Utils.Topic(topic);
    let json;

    try {
      json = JSON.parse(payload.toString());
    } catch (e) {
      return this._client.eventSource.emit('error', new Utils.Message(uuid.v4(), {message: 'invalid json'}, 'error', 400).toJSON());
    }

    if (_topic.type === Utils.Constants.Topic.REGISTRATION) {
      this._client.deviceId = json.result.deviceId || null;
      this.eventSource.emit(Utils.Constants.DeviceEvents.DEVICE_SUBSCRIPTION, json);
    }

    if (_topic.type === Utils.Constants.Topic.DEVICE && _topic.action === Utils.Constants.Topic.DEVICE_REQUEST) {
      this.eventSource.emit(Utils.Constants.DeviceEvents.DEVICE_REQUEST, json);
      this.eventSource.emit(`${Utils.Constants.DeviceEvents.DEVICE_REQUEST}/${json.id}`, json);
    }

    if (_topic.type === Utils.Constants.Topic.DEVICE && _topic.action === Utils.Constants.Topic.DEVICE_COMMAND) {
      this.eventSource.emit(Utils.Constants.DeviceEvents.DEVICE_COMMAND, new Utils.Command(json, this._client));
    }
  }
}

module.exports = MessageProcessor;