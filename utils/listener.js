'use strict';

class Listener {
  constructor(name, handler, source){
    this.name = name;
    this.handler = handler;
    this._eventsource = source;
  }

  attach(){
    this._eventsource.on(this.name, this.handler);
  }

  detach(){
    this._eventsource.removeListener(this.name, this.handler)
  }
}

module.exports = Listener;

