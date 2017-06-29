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
      /*
       TODO: the command object passed into the event on next line needs to be wrapped in try catch before we pass it
       TODO: to the event emitter. also, need to change the command, so that rather then sending a message there, we are
       TODO: going to throw the error from the command.js if the validation failed and catch here then send an error instead
       */
      // // something like this
      // try {
      //// the real deal is that the command show throw an error when its initialized as an object that it failed validation
      //   let command = new Command(json, this._client);
      //   this.eventSource.emit(Constants.DeviceEvents.DEVICE_COMMAND, new Command(json, this._client));
      // } catch (ex => {
      //   this.eventSource.emit('error', {}.toString());
      // });


      this.eventSource.emit(Constants.DeviceEvents.DEVICE_COMMAND, new Command(json, this._client));
    }
  }
}

module.exports = MessageProcessor;