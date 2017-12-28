'use strict';

const bunyan = require('bunyan');

module.exports = (() => {

  const logger = bunyan.createLogger({name: "thincloud-device-sdk"});
  logger.level("info");
  return logger;

})();
