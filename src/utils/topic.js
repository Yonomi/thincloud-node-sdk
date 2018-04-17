'use strict';

class Topic {

  constructor(topic) {
    this._self = topic;
    this.type = topic.split('/')[1];
    this.deviceId = topic.split('/')[2];
    this.action = topic.split('/')[3];
    // actionId is the request or the commandId
    this.actionId = topic.split('/')[4];
  }

  toString() {
    return this._self;
  }

}

module.exports = Topic;
