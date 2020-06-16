module.exports = {
  hasAccess: {
    'course/create': ['CONTENT_CREATOR', 'CONTENT_CREATION', 'CONTENT_REVIEWER'],
    'course/update': ['CONTENT_CREATOR', 'CONTENT_CREATION', 'CONTENT_REVIEWER', 'OWNER'],
    'course/review': ['CONTENT_CREATOR', 'CONTENT_CREATION', 'CONTENT_REVIEWER', 'CONTENT_REVIEW'],
    'course/publish': ['CONTENT_REVIEWER', 'CONTENT_REVIEW'],
    'course/state/update': ['COURSE_ENROLL_OWNER']
  },
  'course/update': {
    checksNeeded: ['ROLE_CHECK','OWNER_CHECK'],
    ROLE_CHECK: ['CONTENT_CREATOR', 'CONTENT_CREATION', 'CONTENT_REVIEWER'],
    OWNER_CHECK: ['OWNER']
  }
};

const _ = require('lodash')
let URL = 'course/create';

// --------------------------- checkRole middleware ---------------------------
// Check incoming URL needs to be validated for `ROLES`
if (_.get(this.hasAccess, URL)) {
  
  // Check request session roles has atleast one defined roles in `hasAccess`
  if (_.intersection(this.hasAccess, req.session['roles']).length > 0) {
    
    // +++++ Consider the request to be `VALID` and `AUTHENTIC`

  } else {
    // +++++ 403 Forbidden ACCESS
  }
} else if (_.get(this.isPublic, URL)) { // Check whether incoming URL is defined for `PUBLIC` access

  // +++++ Consider the request to be `VALID` and `AUTHENTIC`

} else {
  // +++++ 403 Forbidden ACCESS
  // Since the API is not listed in any of the above mentioned category
  // the request is considered to be unauthorized
}


// --------------------------- checkOwner middleware ---------------------------
// Check incoming URL needs to be validated for `OWNER_CHECK`
if (_.get(this.hasAccess, URL)) {
  // Based on type of check
  // Example
  // `COURSE_ENROLL_OWNER`
  // `CONTENT_OWNER`
  // `USER_OWNER`
  // Take necessary action based on above type of check
} else {
  // +++++ 403 Forbidden ACCESS
}
