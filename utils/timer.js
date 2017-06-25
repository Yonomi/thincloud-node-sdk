'use strict';

class Timer {

  constructor(duration) {
    this.timer = null;
    this.duration = duration;
  }

  run() {
    return new Promise((resolve, reject)=> {
      this.timer = setTimeout(()=> {
        reject(new Error('timeoutException'))
      }, this.duration)
    })
  }

  destroy() {
    clearTimeout(this.timer);
  }
}

module.exports = Timer;