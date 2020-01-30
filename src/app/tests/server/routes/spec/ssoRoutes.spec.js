const mock = require('mock-require');
const mockFunction = function () {
};
const mockSsoHelper = {
  verifySignature: mockFunction,
  verifyIdentifier: mockFunction,
};
mock('../../../../helpers/ssoHelper', mockSsoHelper);

const httpMocks         = require('node-mocks-http');
let chai                = require('chai');
const expect            = chai.expect;
const sinon             = require('sinon');

const ssoRoutes         = require('../../../../routes/ssoRoutes');
const ssoController     = require('../../../../controllers/ssoController');
const crypto            = require('../../../../helpers/crypto');
const generic           = require('../../helpers/generics/genericHelper');
const telemetryHelper   = require('../../../../helpers/telemetryHelper');
const ssoRouteTestData  = require('../testData/ssoRoutesTestData');

const mockEnv = {
  PORTAL_AUTH_SERVER_URL: 'auth/server/url',
  PORTAL_REALM: 'realm',
  PORTAL_SESSION_STORE_TYPE: 'in-memory',
  PORTAL_TRAMPOLINE_CLIENT_ID: 'trampoline_client_id',
  PORTAL_CASSANDRA_URLS: "PORTAL_CASSANDRA_URLS",
  PORTAL_CASSANDRA_CONSISTENCY_LEVEL: "PORTAL_CASSANDRA_CONSISTENCY_LEVEL",
  PORTAL_CASSANDRA_REPLICATION_STRATEGY: '{"class": "SimpleStrategy", "replication_factor": 2}',
  CRYPTO_ENCRYPTION_KEY: "8887a2bc869998be22221b9b1bb42555"
};


describe('Sso routes Test Cases', function () {

  beforeEach(function () {
    // mock('../../../../helpers/ssoHelper', mockSsoHelper);
    // mock('../../../../helpers/environmentVariablesHelper', mockEnv);
  });

  afterEach(function () {
    // mock.stop('../../../../helpers/ssoHelper');
    // mock.stop('../../../../helpers/environmentVariablesHelper');
    sinon.stub.reset();
  });

  it('should not migrate user as nonStateUserToken not present', function (done) {
    const req = generic.constructReqBody({ session: { test: 'mock' } });
    const res = generic.getResponseObject();
    ssoController.ssoValidations(req, res);
    expect(res.statusCode).to.eql(401);
    expect(res._getData()).to.eql({
      responseCode: 'UNAUTHORIZED'
    });
    done();
  });

  it('should not migrate user as migrate user info not present', function (done) {
    const req = generic.constructReqBody({ session: { nonStateUserToken: 'mock' } });
    const res = generic.getResponseObject();
    ssoController.ssoValidations(req, res);
    expect(res.statusCode).to.eql(401);
    expect(res._getData()).to.eql({
      responseCode: 'UNAUTHORIZED'
    });
    done();
  });

  it('should fail for creating user session', function (done) {
    sinon.stub(telemetryHelper, "logApiErrorEventV2").returns(true);
    sinon.stub(mockSsoHelper, "verifySignature").returns(true);
    const req = generic.constructReqBody(
      {
        hostname: 'http://diksha.in',
        query: {
          token: ssoRouteTestData.invalidToken
        },
        session: {
          rootOrghashTagId: 'abc123'
        }
      }
    );
    const res = generic.getResponseObject();
    ssoController.userSessionCreate(req, res);
    expect(res.statusCode).to.eql(200);
    done();
  });
});
