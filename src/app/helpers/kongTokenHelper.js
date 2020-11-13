/**
 * @file - Responsible for generating kong token
 * @since release-3.5.0
 * @version 1.0
 */

'use strict';

const _                                 = require('lodash');
const uuidv1                            = require('uuid/v1');
const { logger }                        = require('@project-sunbird/logger');
const { sendRequest }                   = require('./httpRequestHandler');
const PORTAL_BASE_URL                   = require('./environmentVariablesHelper.js').sunbird_portal_base_url;
const PORTAL_API_AUTH_TOKEN             = require('./environmentVariablesHelper.js').PORTAL_API_AUTH_TOKEN;
const KONG_DEVICE_REGISTER_TOKEN        = require('./environmentVariablesHelper.js').KONG_DEVICE_REGISTER_TOKEN;
const KONG_DEVICE_REGISTER_AUTH_TOKEN   = require('./environmentVariablesHelper.js').KONG_DEVICE_REGISTER_AUTH_TOKEN;

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
            key: _.get(req, 'headers.x-device-id')
          }
        })
      };
      sendRequest(options).then((response) => {
        const responseData = JSON.parse(response);
        if (_.get(responseData, 'params.status') === 'successful') {
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
}

const saveKongTokenSession = () => {
  return (req, res) => {
    if (KONG_DEVICE_REGISTER_TOKEN !== 'false' && !getKongTokenFromSession(req)) {
      generateKongToken(req).then((kongToken) => {
        if (_.get(kongToken, 'result.token')) {
          req.session['kongToken'] = _.get(kongToken, 'result.token');
          req.session['kongDeviceId'] = _.get(kongToken, 'result.key');
          req.session.save((err) => {
            if (err) {
              res.writeHead(500, { 'content-type': 'text/json' });
              res.write(JSON.stringify({
                'id': 'api.kong.tokenManager',
                'ts': new Date(),
                'params': {
                  'resmsgid': uuidv1(),
                  'msgid': uuidv1(),
                  'err': 'Internal Server Error',
                  'status': 'Internal Server Error',
                  'errmsg': 'Internal Server Error'
                },
                'responseCode': 'Internal Server Error',
                'result': {}
              }));
              res.status(500)
              res.end('\n');
            } else {
              res.writeHead(200, { 'content-type': 'text/json' });
              res.write(JSON.stringify({
                'id': 'api.kong.tokenManager',
                'ts': new Date(),
                'params': {
                  'resmsgid': uuidv1(),
                  'msgid': uuidv1(),
                  'err': '',
                  'status': 'OK',
                  'errmsg': 'OK'
                },
                'responseCode': 'OK',
                'result': {}
              }));
              res.status(200)
              res.end('\n');
            }
          });
        } else {
          res.writeHead(500, { 'content-type': 'text/json' });
          res.write(JSON.stringify({
            'id': 'api.kong.tokenManager',
            'ts': new Date(),
            'params': {
              'resmsgid': uuidv1(),
              'msgid': uuidv1(),
              'err': 'Internal Server Error',
              'status': 'Internal Server Error',
              'errmsg': 'Internal Server Error'
            },
            'responseCode': 'Internal Server Error',
            'result': {}
          }));
          res.status(500)
          res.end('\n');
        }
      }).catch((err) => {
        res.writeHead(500, { 'content-type': 'text/json' });
        res.write(JSON.stringify({
          'id': 'api.kong.tokenManager',
          'ts': new Date(),
          'params': {
            'resmsgid': uuidv1(),
            'msgid': uuidv1(),
            'err': 'Internal Server Error',
            'status': 'Internal Server Error',
            'errmsg': 'Internal Server Error'
          },
          'responseCode': 'Internal Server Error',
          'result': _.get(err, 'message')
        }));
        res.status(500)
        res.end('\n');
      });
    } else {
      res.writeHead(304, { 'content-type': 'text/json' });
      res.status(304)
      res.end('\n');
    }
  }
}


const getKongTokenFromSession = (req) => {
 return _.get(req, 'session.kongToken');
};

const getPortalAuthToken = (req) => {
  logger.info({
    msg: (KONG_DEVICE_REGISTER_TOKEN === 'true') ? 'KONG_TOKEN' : 'PORTAL_TOKEN',
    route: _.get(req, 'path'),
    token: _.get(req, 'session.kongToken')
  });
  return (KONG_DEVICE_REGISTER_TOKEN === 'true') ? _.get(req, 'session.kongToken') : PORTAL_API_AUTH_TOKEN;
}

module.exports = {
  saveKongTokenSession,
  getPortalAuthToken
};
