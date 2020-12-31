/**
 * @file
 * 1. Connects to Redis DataStore with specified configuration
 * 2. Creates Redis Store instance with `express-session`
 * @since release-2.9.0
 * @version 1.0
 */

const redis       = require('redis');
const { logger } = require('@project-sunbird/logger');
const envHelper   = require('./environmentVariablesHelper.js');
const Redis       = require("ioredis");
// if (!envHelper.PORTAL_REDIS_URL || !envHelper.PORTAL_REDIS_PORT) throw new Error('Redis Host and PORT configuration required.');
// const redisClient = redis.createClient({
//   host: envHelper.PORTAL_REDIS_URL,
//   port: envHelper.PORTAL_REDIS_PORT,
//   retry_strategy: (options) => {
//     return 5000; //in ms
//   }
// });
// const redisClient = redis.createClient(envHelper.PORTAL_REDIS_CONNECTION_STRING);

var cluster;
console.log('___________________________________________________'); // TODO: log!
console.log('envHelper.PORTAL_REDIS_PASSWORD ', envHelper.PORTAL_REDIS_PASSWORD); // TODO: log!
// ++++++++++++++++++++++++++++
// default - sentinel
// ++++++++++++++++++++++++++++
if (envHelper.PORTAL_REDIS_TYPE == 'sentinel') {
  console.log('Connecting to redis for type ' , envHelper.PORTAL_REDIS_TYPE); // TODO: log!
  cluster = new Redis({
    sentinels: [
      {
        port: envHelper.PORTAL_REDIS_PORT,
        host: envHelper.PORTAL_REDIS_URL,
      }
    ],
    name: "mymaster",
    password: envHelper.PORTAL_REDIS_PASSWORD
  });
} else if (envHelper.PORTAL_REDIS_TYPE == 'cluster') {
  console.log('Connecting to redis for type ' , envHelper.PORTAL_REDIS_TYPE); // TODO: log!
  cluster = new Redis.Cluster([
    {
      port: envHelper.PORTAL_REDIS_PORT,
      host: envHelper.PORTAL_REDIS_URL,
    }
  ], {
    redisOptions: {
      password: envHelper.PORTAL_REDIS_PASSWORD,
    },
  });
} else {
  console.log('Connecting to redis for type ' , envHelper.PORTAL_REDIS_TYPE); // TODO: log!
  console.log(envHelper.PORTAL_REDIS_CONNECTION_STRING); // TODO: log!
  cluster = new Redis(envHelper.PORTAL_REDIS_CONNECTION_STRING.toString());
}

console.log('Connecting to redis with below connection string'); // TODO: log!
console.log(envHelper.PORTAL_REDIS_URL + ':' + envHelper.PORTAL_REDIS_PORT); // TODO: log!
console.log('___________________________________________________'); // TODO: log!

// /**
//  * Redis Event listener for `connect` event
//  */
// redisClient.on('connect', function () {
//   logger.info({msg: `✅ Redis Server connecting to [${envHelper.PORTAL_REDIS_URL}:${envHelper.PORTAL_REDIS_PORT}]`});
// });

// /**
//  * Redis Event listener for `ready` event
//  */
// redisClient.on('ready', function () {
//   logger.info({msg: `✅ Redis Server connected to [${envHelper.PORTAL_REDIS_URL}:${envHelper.PORTAL_REDIS_PORT}]`});
// });

// /**
//  * Redis Event listener for `reconnecting` event
//  */
// redisClient.on('reconnecting', function () {
//   logger.info({msg: `❌ Redis Server reconnecting to [${envHelper.PORTAL_REDIS_URL}:${envHelper.PORTAL_REDIS_PORT}]`});
//   // throw new Error('Redis Client - Connection failure');
// });

// /**
//  * Redis Event listener for `error` event
//  */
// redisClient.on('error', function (error) {
//   logger.info({
//     msg: `❌ Redis Server error while connecting to [${envHelper.PORTAL_REDIS_URL}:${envHelper.PORTAL_REDIS_PORT}]`,
//     error: error
//   });
//   // throw new Error(error);
// });

/**
 * @param  {any} param - An argument of any type
 * @throws {InvalidArgumentException} - Will throw an error if the argument is missing
 * @description Validates a single argument
 */
function valueRequired (param) {
  const errorObject   = new Error();
  errorObject.name    = 'InvalidArgumentException';
  errorObject.message = `${param} is required.`;
  throw errorObject;
};

/**
 * @param  {Object} session - Express Session Object
 * @returns {Object} - Redis Store with configured client
 */
/* istanbul ignore next */
function getRedisStoreInstance (session = valueRequired('session')) {
  const RedisStore = require('connect-redis')(session);
  // return new RedisStore({ client: redisClient });
  return new RedisStore({ client: cluster });
};

module.exports = {
  getRedisStoreInstance
};
