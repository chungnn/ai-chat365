/**
 * English language translations
 */
module.exports = {
  common: {
    success: 'Operation successful',
    error: 'An error occurred',
    notFound: 'Resource not found',
    unauthorized: 'Unauthorized access',
    forbidden: 'Forbidden action',
    validationError: 'Validation error',
    serverError: 'Server error',
    missingFields: 'Required fields are missing'
  },
  auth: {
    loginSuccess: 'Logged in successfully',
    loginFailed: 'Login failed',
    registerSuccess: 'Registered successfully',
    registerFailed: 'Registration failed',
    logoutSuccess: 'Logged out successfully',
    invalidCredentials: 'Invalid email or password',
    passwordResetSent: 'Password reset link has been sent to your email',
    passwordResetSuccess: 'Password has been reset successfully',
    tokenExpired: 'Authentication token expired',
    tokenInvalid: 'Invalid authentication token',
    accountCreated: 'Account created successfully'
  },
  chat: {
    sessionCreated: 'Chat session created successfully',
    messageProcessed: 'Message processed successfully',
    messageFailed: 'Failed to process message',
    sessionNotFound: 'Chat session not found',
    userInfoUpdated: 'User information updated successfully',
    transferRequested: 'Transfer to human agent requested',
    transferFailed: 'Failed to transfer to human agent',
    chatEnded: 'Chat session ended',
    chatHistory: 'Chat history retrieved successfully',
    aiGreeting: 'Hello! How can I assist you today?',
    aiTransferSuggestion: 'I suggest transferring to a human agent for better assistance with your issue.',
    aiError: 'I apologize, but I encountered an error processing your request. Please try again or contact support.'
  },
  ticket: {
    ticketCreated: 'Support ticket created successfully',
    ticketUpdated: 'Support ticket updated successfully',
    ticketNotFound: 'Support ticket not found',
    ticketDeleted: 'Support ticket deleted successfully',
    ticketStatusChanged: 'Ticket status updated successfully',
    ticketDetailsRetrieved: 'Ticket details retrieved successfully'
  },
  errors: {
    processingMessage: 'Error processing your message',
    internalError: 'Internal server error',
    databaseError: 'Database error',
    apiError: 'API error',
    validationFailed: 'Validation failed'
  }
};
