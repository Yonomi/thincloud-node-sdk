const Constants = {
  Topic: {
    ROOT: 'thincloud',
    REGISTRATION: 'registration',
    SUBSCRIPTION: 'subscription',
    DEVICE: 'devices',
    DEVICE_REQUEST: 'requests',
    DEVICE_COMMAND: 'command'
  },
  DeviceEvents: {
    DEVICE_SUBSCRIPTION: 'subscription',
    DEVICE_REQUEST: 'requests',
    DEVICE_COMMAND: 'command'
  },
  Status: {
    SUCCESS: 'success',
    ERROR: 'error'
  },
  defaults: {
    timeout: 10000
  }
};

module.exports = Constants;
