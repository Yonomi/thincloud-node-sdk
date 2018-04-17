'use strict';

const Constants = require('./constants');

/**
 * Abstract class TopicBuilder
 */
class TopicBuilder {

  constructor(deviceId, requestId) {
    this.deviceId = deviceId;
    this.requestId = requestId || '+';
  }

  get topicRootPath() {
    return Constants.Topic.ROOT;
  }

  get request() {
    return `${this.topicRootPath}/${this.subPath}/${this.deviceId}/${this.type}`;
  }

  get response() {
    return `${this.topicRootPath}/${this.subPath}/${this.deviceId}/${this.type}/${
      this.requestId
    }/response`;
  }

}

class RegistrationTopic extends TopicBuilder {

  get type() {
    return Constants.Topic.DEVICE_REQUEST;
  }

  get subPath() {
    return Constants.Topic.REGISTRATION;
  }

  get eventPath() {
    return Constants.Topic.SUBSCRIPTION;
  }

}

class CommandTopic extends TopicBuilder {

  get type() {
    return Constants.Topic.DEVICE_COMMAND;
  }

  get subPath() {
    return Constants.Topic.DEVICE;
  }

}

class RequestTopic extends TopicBuilder {

  get type() {
    return Constants.Topic.DEVICE_REQUEST;
  }

  get subPath() {
    return Constants.Topic.DEVICE;
  }

  get eventPath() {
    return `${this.type}/${this.requestId}`;
  }

}

module.exports = {
  RegistrationTopic,
  CommandTopic,
  RequestTopic
};
