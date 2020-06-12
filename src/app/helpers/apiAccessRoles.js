module.exports = {
  hasAccess: {
    'course/create': ['CONTENT_CREATOR', 'CONTENT_CREATION', 'CONTENT_REVIEWER'],
    'course/update': ['CONTENT_CREATOR', 'CONTENT_CREATION', 'CONTENT_REVIEWER', 'OWNER'],
    'course/review': ['CONTENT_CREATOR', 'CONTENT_CREATION', 'CONTENT_REVIEWER', 'CONTENT_REVIEW'],
    'course/publish': ['CONTENT_REVIEWER', 'CONTENT_REVIEW'],
    'course/state/update': ['OWNER']
  },
  isPublic: {
    '/learner/data/v1/system/settings/get/custodianOrgId': ['PUBLIC'],
    '/learner/data/v1/system/settings/get/ntp': ['PUBLIC']
  }
};

const _ = require('lodash')
let URL = 'course/create';

// Check incoming URL needs to be validated for `ROLES`
if (_.get(this.hasAccess, URL)) {
  
  // Check request session roles has atleast one defined roles in `hasAccess`
  if (_.intersection(this.hasAccess, req.session['roles']).length > 0) {
    
    // +++++ Consider the request to be `VALID` and `AUTHENTIC`
    

  } else {
    // +++++ 401 UNAUTHORIZED ACCESS
  }
}

// Check whether incoming URL is defined for `PUBLIC` access
else if (_.get(this.isPublic, URL)) {

  // +++++ Consider the request to be `VALID` and `AUTHENTIC`

} else {
  // +++++ 401 UNAUTHORIZED ACCESS
  // Since the API is not listed in any of the above mentioned category
  // the request is considered to be unauthorized
}
