/**
 * @file - Responsible for generating kong token
 * @since release-3.5.0
 * @version 1.0
 */
// ******************************************************************************************************
// ******************************************************************************************************
// change device id to session id
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
            key: _.get(req, 'sessionID') || 'no_token'
          }
        })
      };
      sendRequest(options).then((response) => {
        const responseData = JSON.parse(response);
        if (_.get(responseData, 'params.status') === 'successful') {
          logger.info({
            msg: 'KONG_TOKEN :: token generated using key ' + _.get(req, 'sessionID') || 'portal',
            route: _.get(req, 'path')
          });
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

// const saveKongTokenSession = () => {
//   return (req, res) => {
//     logger.info({
//       msg: 'KONG_TOKEN :: saveKongTokenSession called with session id ' + _.get(req, 'sessionID'),
//       route: _.get(req, 'path'),
//       sessionId: _.get(req, 'sessionID')
//     });
//     if (KONG_DEVICE_REGISTER_TOKEN !== 'false' && !getKongTokenFromSession(req)) {
//       // req.session.save((err) => {
//       //   if (err) {
//       //     res.writeHead(500, { 'content-type': 'text/json' });
//       //     res.write(JSON.stringify({
//       //       'id': 'api.kong.tokenManager',
//       //       'ts': new Date(),
//       //       'params': {
//       //         'resmsgid': uuidv1(),
//       //         'msgid': uuidv1(),
//       //         'err': 'Internal Server Error',
//       //         'status': 'Internal Server Error',
//       //         'errmsg': 'Internal Server Error'
//       //       },
//       //       'responseCode': 'Internal Server Error',
//       //       'result': {}
//       //     }));
//       //     res.status(500)
//       //     res.end('\n');
//       //   } else {
//           generateKongToken(req).then((kongToken) => {
//             if (_.get(kongToken, 'result.token')) {
//               req.session['kongToken'] = _.get(kongToken, 'result.token');
//               req.session['kongDeviceId'] = _.get(kongToken, 'result.key');
//               req.session.save((err) => {
//                 if (err) {
//                   res.writeHead(500, { 'content-type': 'text/json' });
//                   res.write(JSON.stringify({
//                     'id': 'api.kong.tokenManager',
//                     'ts': new Date(),
//                     'params': {
//                       'resmsgid': uuidv1(),
//                       'msgid': uuidv1(),
//                       'err': 'Internal Server Error',
//                       'status': 'Internal Server Error',
//                       'errmsg': 'Internal Server Error'
//                     },
//                     'responseCode': 'Internal Server Error',
//                     'result': {}
//                   }));
//                   res.status(500)
//                   res.end('\n');
//                 } else {
//                   res.writeHead(200, { 'content-type': 'text/json' });
//                   res.write(JSON.stringify({
//                     'id': 'api.kong.tokenManager',
//                     'ts': new Date(),
//                     'params': {
//                       'resmsgid': uuidv1(),
//                       'msgid': uuidv1(),
//                       'err': '',
//                       'status': 'OK',
//                       'errmsg': 'OK'
//                     },
//                     'responseCode': 'OK',
//                     'result': {}
//                   }));
//                   res.status(200)
//                   res.end('\n');
//                 }
//               });
//             } else {
//               res.writeHead(500, { 'content-type': 'text/json' });
//               res.write(JSON.stringify({
//                 'id': 'api.kong.tokenManager',
//                 'ts': new Date(),
//                 'params': {
//                   'resmsgid': uuidv1(),
//                   'msgid': uuidv1(),
//                   'err': 'Internal Server Error',
//                   'status': 'Internal Server Error',
//                   'errmsg': 'Internal Server Error'
//                 },
//                 'responseCode': 'Internal Server Error',
//                 'result': {}
//               }));
//               res.status(500)
//               res.end('\n');
//             }
//           }).catch((err) => {
//             res.writeHead(500, { 'content-type': 'text/json' });
//             res.write(JSON.stringify({
//               'id': 'api.kong.tokenManager',
//               'ts': new Date(),
//               'params': {
//                 'resmsgid': uuidv1(),
//                 'msgid': uuidv1(),
//                 'err': 'Internal Server Error',
//                 'status': 'Internal Server Error',
//                 'errmsg': 'Internal Server Error'
//               },
//               'responseCode': 'Internal Server Error',
//               'result': _.get(err, 'message')
//             }));
//             res.status(500)
//             res.end('\n');
//           });
//       //   }
//       // });

//     } else {
//       res.writeHead(304, { 'content-type': 'text/json' });
//       res.status(304)
//       res.end('\n');
//     }
//   }
// }

const registerDeviceWithKong = () => {
  return function (req, res, next) {
    logger.info({
      msg: 'KONG_TOKEN :: registerDeviceWithKong called',
      route: _.get(req, 'path') || 'no_route',
      originalUrl: _.get(req, 'originalUrl') || 'no_originalUrl',
      sessionId: _.get(req, 'sessionID')
    });
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
          });
          next(new Error('api.kong.tokenManager:: Internal Server Error'));
        }
      }).catch((err) => {
        next(err);
      });
    } else {
      next();
    }
  }
}

const getKongTokenFromSession = (req) => {
 return _.get(req, 'session.' + KONG_SESSION_TOKEN);
};

const getPortalAuthToken = (req) => {
  logger.info({
    msg: (KONG_DEVICE_REGISTER_TOKEN === 'true') ? 'USE_KONG_TOKEN' : 'USE_PORTAL_TOKEN',
    route: _.get(req, 'path') || 'no_route',
    originalUrl: _.get(req, 'originalUrl') || 'no_originalUrl',
    token: _.get(req, 'session.' + KONG_SESSION_TOKEN)
  });
  return (KONG_DEVICE_REGISTER_TOKEN === 'true') ? _.get(req, 'session.' + KONG_SESSION_TOKEN) : PORTAL_API_AUTH_TOKEN;
}

module.exports = {
  registerDeviceWithKong,
  getPortalAuthToken
};
