'use strict';

const Timer = require('./timer');
const RequestTopic = require('./topicBuilder').RequestTopic;
const Listener = require('./listener');

class Manager {
  constructor(topic, request, client, timeout){
    this.request = request;
    this._client = client;
    this._eventsource = this._client.eventSource;
    this.listeners = [];
    this._timer = new Timer(timeout);
    this.topic = topic;
  }

  async(){
    return new Promise((resolve, reject)=>{
      this._eventsource.publish(new RequestTopic(this._client.deviceId).request, this.request.toString(), (err)=>{
        if(err) reject(err);
        else resolve({
          id : this.request.id
        });
      })
    });
  }

  sync(){
    return new Promise((resolve, reject)=>{

      this.addListener(new Listener('error', (err) => {
        reject(this._errorHandler(err));
      }, this._eventsource));

      this.addListener(new Listener(this.topic.eventPath, (request)=>{
        if(!request.result) reject(this._errorHandler(request));
        else resolve(this._requestHandler(request));
      }, this._eventsource));

      this._timer.run()
        .then(this.attachListeners())
        .then(this._eventsource.publish(this.topic.request, this.request.toString()))
        .catch((ex) => {
          this.detachListeners();
          this._timer.destroy();
          reject(ex)
        })

    });
  }

  addListener(listener){
    this.listeners.push(listener);
  }

  attachListeners(){
    for(let listener in this.listeners){
      this.listeners[listener].attach();
    }
  }

  detachListeners(){
    for(let listener in this.listeners){
      this.listeners[listener].detach();
    }
    this.listeners = [];
  }

  _requestHandler(request){
    this.detachListeners();
    this._timer.destroy();
    return request;
  }

  _errorHandler(error){
    this.detachListeners();
    this._timer.destroy();
    return error
  }

}


module.exports = Manager;