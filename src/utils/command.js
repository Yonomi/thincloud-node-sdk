'use strict';

const {CommandTopic} = require('./topicBuilder');
const Message = require('./message');
const log = require('./logger');

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
      log.info('publish a msg error');
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
      log.info(`receive a command with an error: json can not be empty`);
      client.eventSource.emit('error', new Message(this.id, {message: 'json can not be empty'}, 'error', 400).toJSON());
      return this.error(JSON.stringify(`{message: 'json can not be empty'}`));
    }
    if(request && !request.id) {
      log.info(`receive a command with an error: id can not be empty`);
      client.eventSource.emit('error', new Message(this.id, {message: 'id can not be empty'}, 'error', 400).toJSON());
      return this.error(JSON.stringify(`{message: 'id can not be empty'}`));
    }
    if(request && !request.method) {
      log.info(`receive a command with an error: method can not be empty`);
      client.eventSource.emit('error', new Message(this.id, {message: 'method can not be empty'}, 'error', 400).toJSON());
      return this.error(JSON.stringify(`{message: 'method can not be empty'}`));
    }
  }

};

module.exports = Command;