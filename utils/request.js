'use strict';

let uuid = require('uuid');

class Request {
  constructor(method, params){
    this.id = uuid.v4();
    this.method = method;
    this.params = params;
  }

  toJSON(){
    return {
      id: this.id,
      method : this.method,
      params :this.params
    }
  }

  toString(){
    return JSON.stringify(this.toJSON());
  }
}

module.exports = Request;