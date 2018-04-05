'use strict';

const {CommandTopic} = require('./topicBuilder');
const Message = require('./message');
const log = require('./logger');

class Command {
  constructor(command, client){
    Object.assign(this, command);
    this.validate();
    this._self = command;
    this._client = client;
    this._topic = new CommandTopic(this._client.deviceId, this.id);
  }
  
  respond(err, data){
    if(err) return this.error(err);
    else return this.success(data);
  }

  success(payload) {
    let message = new Message(this.id, {body: payload}, 'success', 200);
    return this._client.publish(this._topic.response, message.toString());
  }

  error(payload){
    let message = new Message(this.id, {body: payload}, 'error', 400);
    return this._client.publish(this._topic.response, message.toString());
  }

  toJSON(){
    return this._self;
  }

  get _isValid(){
    return this.id && this.method
  }

  validate() {
    if(!this._isValid){
      throw Error('commandValidationException', 'missing parameters, id, method');
    } else {
      return this._isValid;
    }
  }

};

module.exports = Command;