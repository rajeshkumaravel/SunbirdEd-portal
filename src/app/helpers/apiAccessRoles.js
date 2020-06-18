module.exports = {
  hasAccess: {
    'course/create': ['CONTENT_CREATOR', 'CONTENT_CREATION', 'CONTENT_REVIEWER'],
    'course/update': ['CONTENT_CREATOR', 'CONTENT_CREATION', 'CONTENT_REVIEWER', 'OWNER'],
    'course/review': ['CONTENT_CREATOR', 'CONTENT_CREATION', 'CONTENT_REVIEWER', 'CONTENT_REVIEW'],
    'course/publish': ['CONTENT_REVIEWER', 'CONTENT_REVIEW'],
    'course/state/update': ['COURSE_ENROLL_OWNER']
  },
  'course/update': {
    checksNeeded: ['ROLE_CHECK', 'OWNER_CHECK'],
    ROLE_CHECK: ['CONTENT_CREATOR', 'CONTENT_CREATION', 'CONTENT_REVIEWER'],
    OWNER_CHECK: ['OWNER']
  }
};






// Master list
const urls = {
  'course/update': {
    checksNeeded: ['ROLE_CHECK', 'OWNER_CHECK', 'XYZ_CHECK'],
    ROLE_CHECK: ['CONTENT_CREATOR', 'CONTENT_CREATION', 'CONTENT_REVIEWER'],
    OWNER_CHECK: ['OWNER']
  },
  '/learner/user/v2/read/:userId': {
    checksNeeded: ['ROLE_CHECK', 'OWNER_CHECK'],
    ROLE_CHECK: ['CONTENT_CREATOR', 'CONTENT_CREATION', 'CONTENT_REVIEWER'],
    OWNER_CHECK: ['OWNER']
  }
};

// npm module

// Intermediate list for handling patter match (URL params)
const patterns = ['/learner/course/v1/hierarchy/:do_id', '/learner/user/v2/read/:userId'];


// '/learner/course/v1/hierarchy/do_29283472984790'
// 'learner/organization/ntp'

var promises = [];
for ( loop; over; object ) {
  checksNeeded.forEach(CHECK => {
    promises.push(new Promise((res, rej) => {
      this.methods[CHECK]()
    }));
  });
}

Promise.all(promises).then(etc, etc);

// Draft
module.exports.methods = {
  ROLE_CHECK: function (roles) {
    // Check roles
  },
  OWNER_CHECK: function (params) {
    // Check Owner
  },
  XYZ_CHECK: function () {
    
  }
}



















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
