const jwt             = require('jsonwebtoken');
const _               = require('lodash');

const logger          = require('sb_logger_util_v2');
const errorUrl        = '/sso/sign-in/error';
const telemetryHelper = require('../helpers/telemetryHelper');
const {
  verifySignature, verifyIdentifier, verifyToken, fetchUserWithExternalId, createUser, fetchUserDetails,
  createSession, updateContact, updateRoles, sendSsoKafkaMessage, migrateUser, freeUpUser, getIdentifier
} = require('./../helpers/ssoHelper');

const ssoValidations = async (req, res) => {
  let stateUserData, stateJwtPayload, errType, response, statusCode;
  // to support mobile flow
  if (req.query.client_id === 'android') {
    console.log('req.query.client_id', req.query.client_id);
    req.session.migrateAccountInfo = {
      encryptedData: parseJson(decodeURIComponent(req.get('x-authenticated-user-data')))
    };
  }
  req.session.nonStateUserToken = req.session.nonStateUserToken || req.get('x-authenticated-user-token');
  if (!req.session.nonStateUserToken || !(req.session.migrateAccountInfo && req.session.migrateAccountInfo.encryptedData)) {
    res.status(401).send({
      responseCode: 'UNAUTHORIZED'
    });
    return false;
  }
  console.log('migration initiated', req.session.nonStateUserToken, JSON.stringify(req.session.migrateAccountInfo));
  try {
    console.log('decryption started');
    const decryptedData = decrypt(req.session.migrateAccountInfo.encryptedData);
    stateUserData = parseJson(decryptedData);
    errType = 'VERIFY_SIGNATURE';
    console.log('validating state token', JSON.stringify(stateUserData));
    await verifySignature(stateUserData.stateToken);
    errType = 'JWT_DECODE';
    stateJwtPayload = jwt.decode(stateUserData.stateToken);
    errType = 'VERIFY_TOKEN';
    verifyToken(stateJwtPayload);
    console.log('state token validated success');
    errType = 'ERROR_FETCHING_USER_DETAILS';
    const nonStateUserData = await fetchUserDetails(req.session.nonStateUserToken);
    errType = 'ERROR_VERIFYING_IDENTITY';
    const isMigrationAllowed = verifyIdentifier(stateUserData.identifierValue, nonStateUserData[stateUserData.identifier], stateUserData.identifier);
    console.log('ismigration allowed', isMigrationAllowed);
    if (isMigrationAllowed) {
      errType = 'MIGRATE_USER';
      req.query.userId = getUserIdFromToken(req.session.nonStateUserToken);
      console.log('userId fetched', req.query.userId);
      await migrateUser(req, stateJwtPayload);
      await delay();
      console.log('migration success');
      errType = 'ERROR_FETCHING_USER_DETAILS';
      const userDetails = await fetchUserWithExternalId(stateJwtPayload, req); // to get userName
      console.log('userDetails fetched from external ID', JSON.stringify(userDetails));
      if (_.isEmpty(userDetails)) {
        errType = 'USER_DETAILS_EMPTY';
        throw 'USER_DETAILS_IS_EMPTY';
      }
      if (stateJwtPayload.roles && stateJwtPayload.roles.length) {
        errType = 'UPDATE_USER_ROLES';
        // await updateRoles(req, req.query.userId, stateJwtPayload).catch(handleProfileUpdateError);
      }
      req.session.userDetails = userDetails;
      if (stateUserData.tncAccepted === 'true') {
        errType = 'ACCEPT_TNC';
        await acceptTncAndGenerateToken(stateUserData.identifierValue, stateUserData.tncVersion).catch(handleProfileUpdateError);
      }
      redirectUrl = '/accountMerge?status=success&merge_type=auto&redirect_uri=/resources';
      if (req.query.client_id === 'android') {
        response = {
          "id": "api.user.migrate", "params": {
            "resmsgid": null, "err": null, "status": "success",
            "errmsg": null
          }, "responseCode": "OK", "result": { "response": "SUCCESS", }
        };
        statusCode = 200
      }
    } else {
      errType = 'UNAUTHORIZED';
      throw 'USER_DETAILS_DID_NOT_MATCH';
    }
  } catch (error) {
    redirectUrl = '/accountMerge?status=error&merge_type=auto&redirect_uri=/resources';
    if (req.query.client_id === 'android') {
      response = {
        "id": "api.user.migrate", "params": {
          "resmsgid": null, "err": JSON.stringify(error), "status": "error",
          "errType": errType
        }, "responseCode": "INTERNAL_SERVER_ERROR", "result": { "response": "ERROR", }
      };
      statusCode = 500
    }
    logger.error({
      msg: 'sso session create v2 api failed',
      "error": JSON.stringify(error),
      additionalInfo: {
        errorType: errType,
        stateUserData: stateUserData,
        stateJwtPayload: stateJwtPayload,
        redirectUrl: redirectUrl
      }
    });
    logErrorEvent(req, errType, error);
  } finally {
    req.session.migrateAccountInfo = null;
    req.session.nonStateUserToken = null;
    if (req.query.client_id === 'android') {
      res.status(statusCode).send(response)
    } else {
      res.redirect(redirectUrl || errorUrl);

    }
  }
};

const userSessionCreate = async (req, res) => {
  // updating api version to 2
  logger.info({ msg: '/v2/user/session/create called' });
  let jwtPayload, userDetails, redirectUrl, errType;
  try {
    errType = 'VERIFY_SIGNATURE';
    await verifySignature(req.query.token);
    jwtPayload = jwt.decode(req.query.token);
    if (!jwtPayload.state_id || !jwtPayload.school_id || !jwtPayload.name || !jwtPayload.sub) {
      errType = 'PAYLOAD_DATA_MISSING';
      throw 'some of the JWT payload is missing';
    }
    req.session.jwtPayload = jwtPayload;
    req.session.migrateAccountInfo = {
      stateToken: req.query.token
    };
    errType = 'VERIFY_TOKEN';
    verifyToken(jwtPayload);
    errType = 'USER_FETCH_API';
    userDetails = await fetchUserWithExternalId(jwtPayload, req);
    req.session.userDetails = userDetails;
    logger.info({ msg: "userDetails fetched" + userDetails });
    if (!_.isEmpty(userDetails) && (userDetails.phone || userDetails.email)) {
      redirectUrl = successUrl + getQueryParams({ id: userDetails.userName });
      logger.info({
        msg: 'sso session create v2 api, successfully redirected to success page',
        additionalInfo: {
          state_id: jwtPayload.state_id,
          jwtPayload: jwtPayload,
          query: req.query,
          userDetails: userDetails,
          redirectUrl: redirectUrl
        }
      })
    } else {
      redirectUrl = updateContactUrl; // verify phone then create user
      logger.info({
        msg: 'sso session create v2 api, successfully redirected to update phone page',
        additionalInfo: {
          state_id: jwtPayload.state_id,
          jwtPayload: jwtPayload,
          query: req.query,
          userDetails: userDetails,
          redirectUrl: redirectUrl
        }
      })
    }
  } catch (error) {
    redirectUrl = `${errorUrl}?error_message=` + getErrorMessage(error, errType);
    logger.error({
      msg: 'sso session create v2 api failed',
      error,
      additionalInfo: {
        errorType: errType,
        jwtPayload: jwtPayload,
        query: req.query,
        userDetails: userDetails,
        redirectUrl: redirectUrl
      }
    })
    logErrorEvent(req, errType, error);
  } finally {
    res.redirect(redirectUrl || errorUrl);
  }
};

const getErrorMessage = (error, errorType) => {
  if (_.get(error, 'params.err') === 'USER_ACCOUNT_BLOCKED') {
    return 'User account is blocked. Please contact admin';
  } else if (['VERIFY_SIGNATURE', 'PAYLOAD_DATA_MISSING', 'VERIFY_TOKEN'].includes(errorType)) {
    return 'Your account could not be signed in to DIKSHA due to invalid credentials provided. Please try again with valid credentials.';
  } else {
    return 'Your account could not be signed in to DIKSHA due to technical issue. Please try again after some time';
  }
};

const logErrorEvent = (req, type, error) => {
  let stacktrace;
  if (error instanceof Error) {
    stacktrace = error.message;
  } else {
    stacktrace = JSON.stringify(error)
    if (stacktrace === '{}') {
      stacktrace = 'STRINGIFY_FAILED'
    }
  }
  const edata = {
    err: 'SSO_SIGN_IN_ERROR',
    type,
    stacktrace
  }
  const context = {
    env: 'SSO_SIGN_IN'
  }
  telemetryHelper.logApiErrorEventV2(req, { edata, context });
};

module.exports = {
  ssoValidations: ssoValidations,
  userSessionCreate: userSessionCreate
};
