'use strict';

const Constants = require('./constants');

/**
 * Abstract class TopicBuilder
 */
class TopicBuilder {
  constructor(deviceId, requestId){
    this.deviceId = deviceId;
    this.requestId = requestId || '+'
  }

  get topicRootPath () {
    return Constants.Topic.ROOT;
  }

  get request(){
    return `${this.topicRootPath}/${this.subPath}/${this.deviceId}/${this.type}`
  }

  get response(){
    return `${this.topicRootPath}/${this.subPath}/${this.deviceId}/${this.type}/${this.requestId}/response`
  }
}

class RegistrationTopic extends TopicBuilder {

  constructor(deviceId, requestId){
    super(deviceId, requestId);
  }

  get type(){
    return Constants.Topic.DEVICE_REQUEST;
  }

  get subPath(){
    return Constants.Topic.REGISTRATION;
  }

  get eventPath(){
    return `${Constants.Topic.SUBSCRIPTION}/${this.requestId}`;
  }

}

class CommandTopic extends TopicBuilder {

  constructor(deviceId, requestId){
    super(deviceId, requestId)
  }

  get type(){
    return Constants.Topic.DEVICE_COMMAND
  }

  get subPath(){
    return Constants.Topic.DEVICE;
  }

}

class RequestTopic extends TopicBuilder {
  constructor(deviceId, requestId){
    super(deviceId, requestId);
  }
  
  get type(){
    return Constants.Topic.DEVICE_REQUEST;
  }

  get subPath(){
    return Constants.Topic.DEVICE;
  }

  get eventPath(){
    return `${this.type}/${this.requestId}`
  }

}

module.exports = {
  RegistrationTopic,
  CommandTopic,
  RequestTopic
};