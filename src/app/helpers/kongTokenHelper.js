/**
 * @file - Responsible for generating kong token
 * @since release-3.5.0
 * @version 1.0
 */
// ******************************************************************************************************
// ******************************************************************************************************
// check where all tokens used - generate report
// What todo when kong device register fails to respond / service down
//  - Shld we throw exception (or) just us fallback for using PORTAL_AUTH_TOKEN
//  - Change in `getPortalAuthToken` method remove LHS (or) use if else also log which token used

// +++++++++++++++++++++++ TTL for non-logged in user +++++++++++++++++++++++
// +++++++++++++++++++++++ Update TTL in server js and kongtokenhelper +++++++++++++++++++++++

// ******************************************************************************************************
// ******************************************************************************************************
'use strict';

const _                                 = require('lodash');
const uuidv1                            = require('uuid/v1');
const { logger }                        = require('@project-sunbird/logger');

const { sendRequest }                   = require('./httpRequestHandler');
const PORTAL_BASE_URL                   = require('./environmentVariablesHelper.js').SUNBIRD_PORTAL_BASE_URL;
const PORTAL_API_AUTH_TOKEN             = require('./environmentVariablesHelper.js').PORTAL_API_AUTH_TOKEN;
const KONG_DEVICE_REGISTER_TOKEN        = require('./environmentVariablesHelper.js').KONG_DEVICE_REGISTER_TOKEN;
const KONG_DEVICE_REGISTER_AUTH_TOKEN   = require('./environmentVariablesHelper.js').KONG_DEVICE_REGISTER_AUTH_TOKEN;

const KONG_SESSION_TOKEN                = 'kongDeviceToken';
const BLACKLISTED_URL                   = ['/service/health', '/health'];

const generateKongToken = async (req) => {
  return new Promise((resolve, reject) => {
    try {
      var options = {
        method: 'POST',
        url: PORTAL_BASE_URL + '/api/api-manager/v2/consumer/portal/credential/register',
        headers: {
          'Authorization': 'Bearer ' + KONG_DEVICE_REGISTER_AUTH_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          request: {
            key: _.get(req, 'sessionID') || 'no_key'
          }
        })
      };
      sendRequest(options).then((response) => {
        const responseData = JSON.parse(response);
        if (_.get(responseData, 'params.status') === 'successful') {
          _log(req, 'KONG_TOKEN :: token generated success using key ' + _.get(req, 'sessionID') || 'no_key');
          resolve(responseData);
        } else {
          resolve(false);
        }
      }).catch((error) => {
        reject(error);
      });
    } catch (error) {
      throw new Error(error);
    }
  });
};

const registerDeviceWithKong = () => {
  return function (req, res, next) {
    _log(req, 'KONG_TOKEN :: requesting device register with kong');
    // Check if URL is blacklisted; forward request in case blacklisted
    if (!unless(req)) {
      if (KONG_DEVICE_REGISTER_TOKEN !== 'false' && !getKongTokenFromSession(req)) {
        generateKongToken(req).then((kongToken) => {
          if (_.get(kongToken, 'result.token')) {
            req.session[KONG_SESSION_TOKEN] = _.get(kongToken, 'result.token');
            req.session.save((err) => {
              if (err) {
                next(err);
              } else {
                next();
              }
            });
          } else {
            logger.error({
              'id': 'api.kong.tokenManager', 'ts': new Date(),
              'params': {
                'resmsgid': uuidv1(),
                'msgid': uuidv1(),
                'err': 'Internal Server Error',
                'status': 'Internal Server Error',
                'errmsg': 'Internal Server Error'
              },
              'responseCode': 'Internal Server Error',
              'result': {}
            });
            next(new Error('api.kong.tokenManager:: Internal Server Error'));
          }
        }).catch((err) => {
          next(err);
        });
      } else {
        let _msg = getKongTokenFromSession(req) ? 'using existing token' : 'no token from session'
        _log(req, 'KONG_TOKEN :: request denied - either flag is set to false or ' + _msg);
        next();
      }
    } else {
      _log(req, 'KONG_TOKEN :: request denied - URL blacklisted');
      next();
    }
  }
};

const getKongTokenFromSession = (req) => {
  return _.get(req, 'session.' + KONG_SESSION_TOKEN);
};

const unless = (req) => {
  const existsIndex = _.indexOf(BLACKLISTED_URL, _.get(req, 'originalUrl'));
  return existsIndex > -1 ? true : false;
};

const getPortalAuthToken = (req) => {
  _log(req, (KONG_DEVICE_REGISTER_TOKEN === 'true') ? 'USE_KONG_TOKEN' : 'USE_PORTAL_TOKEN');
  return (KONG_DEVICE_REGISTER_TOKEN === 'true') ? _.get(req, 'session.' + KONG_SESSION_TOKEN) : PORTAL_API_AUTH_TOKEN;
};

const _log = (req, message) => {
  logger.info({
    msg: message,
    route: _.get(req, 'path') || 'no_route',
    originalUrl: _.get(req, 'originalUrl') || 'no_originalUrl',
    baseUrl: _.get(req, 'baseUrl') || 'baseUrl',
    token: _.get(req, 'session.' + KONG_SESSION_TOKEN)
  });
};

module.exports = {
  registerDeviceWithKong,
  getPortalAuthToken
};
