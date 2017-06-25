'use strict';

const {CommandTopic} = require('./topicBuilder');
const Message = require('./message');

class Command {
  constructor(command, client){
    this.validate(command, client);
    Object.assign(this, command);
    this._self = command;
    this._client = client;
    this._topic = new CommandTopic(this._client.deviceId, this.id);
  }
  
  respond(err, data){
    if(err) return this.error(err);
    else return this.success(data);
  }

  success(payload) {
    return new Promise((resolve, reject)=> {
      this._client.eventSource.publish(this._topic.response, new Message(this.id, payload, 'success', 200).toString(), (err)=> {
        if(err) reject(err);
        else resolve()
      });
    });
  }

  error(payload){
    return new Promise((resolve, reject)=> {
      this._client.eventSource.publish(this._topic.response, new Message(this.id, payload, 'error', 400).toString(), (err)=> {
        if(err) reject(err);
        else resolve()
      });
    });
  }

  toJSON(){
    return this._self;
  }

  validate(request, client) {
    if(!request) {
      return client.eventSource.emit('error', new Message(this.id, {message: 'json can not be empty'}, 'error', 400).toJSON());
    }
    if(request && !request.id) {
      return client.eventSource.emit('error', new Message(this.id, {message: 'id can not be empty'}, 'error', 400).toJSON());
    }
    if(request && !request.method) {
      return client.eventSource.emit('error', new Message(this.id, {message: 'method can not be empty'}, 'error', 400).toJSON());
    }
  }

};

module.exports = Command;