'use strict';

const bunyan = require('bunyan');

module.exports = (() => {

  const logger = bunyan.createLogger({name: "thincloud-device-sdk"});
  return logger;

})();
