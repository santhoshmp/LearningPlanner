import React, { useState, useEffect } from 'react';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  field: string;
  oldValue?: string;
  newValue?: string;
  userAgent?: string;
  ipAddress?: string;
}

interface ProfileAuditTrailProps {
  userId: string;
}

const ProfileAuditTrail: React.FC<ProfileAuditTrailProps> = ({ userId }) => {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'profile' | 'settings' | 'security'>('all');

  useEffect(() => {
    loadAuditLogs();
  }, [userId]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock data for now - in real implementation, this would call an API
      const mockLogs: AuditLogEntry[] = [
        {
          id: '1',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
          action: 'profile_update',
          field: 'firstName',
          oldValue: 'John',
          newValue: 'Jonathan',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          ipAddress: '192.168.1.100'
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          action: 'settings_update',
          field: 'theme',
          oldValue: 'light',
          newValue: 'dark',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          ipAddress: '192.168.1.100'
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
          action: 'avatar_upload',
          field: 'profilePicture',
          newValue: 'avatar_12345.jpg',
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
          ipAddress: '192.168.1.101'
        },
        {
          id: '4',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
          action: 'social_account_linked',
          field: 'socialProviders',
          newValue: 'google',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          ipAddress: '192.168.1.102'
        },
        {
          id: '5',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 1 week ago
          action: 'settings_update',
          field: 'emailNotifications',
          oldValue: 'true',
          newValue: 'false',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          ipAddress: '192.168.1.100'
        }
      ];

      setAuditLogs(mockLogs);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      setError('Failed to load audit trail');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredLogs = () => {
    if (filter === 'all') return auditLogs;
    
    return auditLogs.filter(log => {
      switch (filter) {
        case 'profile':
          return ['profile_update', 'avatar_upload', 'avatar_delete'].includes(log.action);
        case 'settings':
          return log.action === 'settings_update';
        case 'security':
          return ['social_account_linked', 'social_account_unlinked', 'password_change'].includes(log.action);
        default:
          return true;
      }
    });
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'profile_update':
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </div>
        );
      case 'settings_update':
        return (
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'avatar_upload':
      case 'avatar_delete':
        return (
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'social_account_linked':
      case 'social_account_unlinked':
        return (
          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
        );
    }
  };

  const getActionDescription = (log: AuditLogEntry) => {
    switch (log.action) {
      case 'profile_update':
        return `Updated ${log.field} from "${log.oldValue}" to "${log.newValue}"`;
      case 'settings_update':
        return `Changed ${log.field} from "${log.oldValue}" to "${log.newValue}"`;
      case 'avatar_upload':
        return 'Uploaded new profile picture';
      case 'avatar_delete':
        return 'Removed profile picture';
      case 'social_account_linked':
        return `Linked ${log.newValue} account`;
      case 'social_account_unlinked':
        return `Unlinked ${log.oldValue} account`;
      default:
        return log.action.replace('_', ' ');
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  const filteredLogs = getFilteredLogs();

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Tabs">
          {[
            { key: 'all', label: 'All Changes' },
            { key: 'profile', label: 'Profile' },
            { key: 'settings', label: 'Settings' },
            { key: 'security', label: 'Security' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                filter === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Audit Log List */}
      {filteredLogs.length === 0 ? (
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No audit logs</h3>
          <p className="mt-1 text-sm text-gray-500">
            No changes have been recorded for the selected filter.
          </p>
        </div>
      ) : (
        <div className="flow-root">
          <ul className="-mb-8">
            {filteredLogs.map((log, logIdx) => (
              <li key={log.id}>
                <div className="relative pb-8">
                  {logIdx !== filteredLogs.length - 1 ? (
                    <span
                      className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                      aria-hidden="true"
                    />
                  ) : null}
                  <div className="relative flex space-x-3">
                    <div>{getActionIcon(log.action)}</div>
                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                      <div>
                        <p className="text-sm text-gray-900">
                          {getActionDescription(log)}
                        </p>
                        <div className="mt-2 text-xs text-gray-500 space-y-1">
                          <div>
                            <span className="font-medium">Time:</span> {formatTimestamp(log.timestamp)}
                          </div>
                          {log.ipAddress && (
                            <div>
                              <span className="font-medium">IP:</span> {log.ipAddress}
                            </div>
                          )}
                          {log.userAgent && (
                            <div>
                              <span className="font-medium">Device:</span>{' '}
                              {log.userAgent.includes('iPhone') ? 'iPhone' :
                               log.userAgent.includes('Android') ? 'Android' :
                               log.userAgent.includes('Macintosh') ? 'Mac' :
                               log.userAgent.includes('Windows') ? 'Windows' : 'Unknown'}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-sm whitespace-nowrap text-gray-500">
                        {new Date(log.timestamp).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Information Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              About Audit Trail
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                This audit trail shows all changes made to your profile and settings. 
                Each entry includes the timestamp, what was changed, and device information 
                to help you track account activity and ensure security.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileAuditTrail;