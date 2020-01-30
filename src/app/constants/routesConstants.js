const PORTAL_PORT = require('../helpers/environmentVariablesHelper').PORTAL_PORT

module.exports = {
    BASE_URL: 'http://localhost:' + PORTAL_PORT,
    ACCOUNT_MERGE: {
        "SESSION_SAVE": "/user/session/save"
    },
    SSO: {
        "USER_SESSION_CREATE": "/v2/user/session/create"
    }
}