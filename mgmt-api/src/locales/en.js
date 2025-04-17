module.exports = {
  errors: {
    notFound: 'Resource not found',
    unauthorized: 'Unauthorized access',
    forbidden: 'Forbidden access',
    badRequest: 'Bad request',
    internalServer: 'Internal server error',
    validation: 'Validation error'
  },
  auth: {
    loginSuccess: 'Login successful',
    loginFailed: 'Invalid email or password',
    logoutSuccess: 'Logout successful',
    tokenExpired: 'Token has expired, please login again',
    invalidToken: 'Invalid token',
    unauthorized: 'Unauthorized access'
  },
  chat: {
    created: 'Chat created successfully',
    updated: 'Chat updated successfully',
    deleted: 'Chat deleted successfully',
    notFound: 'Chat not found',
    assigned: 'Chat assigned successfully',
    categoryUpdated: 'Category updated successfully',
    priorityUpdated: 'Priority updated successfully',
    tagsUpdated: 'Tags updated successfully',
    statusUpdated: 'Status updated successfully'
  },
  user: {
    created: 'User created successfully',
    updated: 'User updated successfully',
    deleted: 'User deleted successfully',
    notFound: 'User not found',
    alreadyExists: 'User with this email already exists'
  },
  category: {
    created: 'Category created successfully',
    updated: 'Category updated successfully',
    deleted: 'Category deleted successfully',
    notFound: 'Category not found'
  },
  tag: {
    created: 'Tag created successfully',
    updated: 'Tag updated successfully',
    deleted: 'Tag deleted successfully',
    notFound: 'Tag not found'
  }
}
