'use strict';
const constants = require('./constants');

class Message {
  
  constructor(requestId, data, status, code) {
    this._id = requestId;
    this._data = data || {};
    this._status = status;

    if (this._status === constants.Status.ERROR)
      this._statusCode = code || 400;
    if (this._status === constants.Status.SUCCESS)
      this._statusCode = code || 200;
  }

  payload() {
    let payload = null;

    if (this._status === constants.Status.SUCCESS) {
      payload = {
        id: this._id,
        result: {
          statusCode: this._statusCode
        },
        error: null
      };
      Object.assign(payload.result, this._data);
    }

    if (this._status === constants.Status.ERROR) {
      payload = {
        id: this._id,
        error: {
          statusCode: this._statusCode
        },
        result: null
      };
      Object.assign(payload.error, this._data);
    }

    return payload;

  }

  toJSON(){
    return this.payload();
  }

  toString(){
    return JSON.stringify(this.payload());
  }

}

module.exports = Message;
