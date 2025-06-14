const fs = require('fs');
const path = require('path');

/**
 * Simple audit logger to track administrative actions
 */
const auditLogger = {
  /**
   * Log an action to the audit file
   * @param {Object} options - Logging options
   * @param {string} options.action - The action performed (e.g., 'delete', 'update')
   * @param {string} options.resourceType - Type of resource affected (e.g., 'tutorial', 'exercise')
   * @param {string} options.resourceId - ID of the affected resource
   * @param {Object} options.user - The user who performed the action
   * @param {Object} options.details - Additional details about the action
   */
  log: (options) => {
    const { action, resourceType, resourceId, user, details = {} } = options;
    
    if (!action || !resourceType || !resourceId || !user) {
      console.error('Missing required parameters for audit logging');
      return;
    }
    
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      action,
      resourceType,
      resourceId,
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      },
      details
    };
    
    // Log to console
    console.log(`[AUDIT] ${timestamp} - ${user.username} (${user.role}) ${action} ${resourceType} ${resourceId}`);
    
    // Determine log file path
    const logDir = path.join(__dirname, '../../logs');
    const logFile = path.join(logDir, 'audit.log');
    
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    // Write to audit log file
    const logLine = JSON.stringify(logEntry) + '\n';
    fs.appendFile(logFile, logLine, (err) => {
      if (err) {
        console.error('Error writing to audit log:', err);
      }
    });
  }
};

module.exports = auditLogger; 