const httpMocks = require('node-mocks-http');

/**
 * @param { Object } config - Configuration object
 * @description - To construct request body with given configuration
 */
function constructReqBody(config) {
  return httpMocks.createRequest(config);
}

/**
 * @description - To construct response object
 */
function getResponseObject() {
  return httpMocks.createResponse({
    eventEmitter: require('events').EventEmitter
  });
}

/**
 * @param { Boolean } _resolve
 * @description - Return `resolve` or `reject` based on Boolean value
 */
function mockPromise(_resolve) {
  return new Promise((resolve, reject) => {
    if (_resolve) {
      return resolve(_resolve)
    } else {
      return reject();
    }
  });
}

module.exports = {
  constructReqBody: constructReqBody,
  getResponseObject: getResponseObject,
  mockPromise: mockPromise
};
