import React, { useState, useEffect } from 'react';
import { SocialAuthProvider } from '../../types/profile';
import { oauthApi } from '../../services/api';

interface AccountLinkingProps {
  socialProviders: SocialAuthProvider[];
  onAccountLinked: () => void;
}

interface ProviderConfig {
  id: 'google' | 'apple' | 'instagram';
  name: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const AccountLinking: React.FC<AccountLinkingProps> = ({
  socialProviders,
  onAccountLinked,
}) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [linkedAccounts, setLinkedAccounts] = useState<{ providers: Array<{ provider: string; providerEmail?: string; linkedAt: string }> }>({ providers: [] });

  const providerConfigs: ProviderConfig[] = [
    {
      id: 'google',
      name: 'Google',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      ),
      color: 'text-gray-700',
      bgColor: 'bg-white border-gray-300',
    },
    {
      id: 'apple',
      name: 'Apple',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
        </svg>
      ),
      color: 'text-white',
      bgColor: 'bg-black',
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      ),
      color: 'text-white',
      bgColor: 'bg-gradient-to-r from-purple-500 to-pink-500',
    },
  ];

  useEffect(() => {
    loadLinkedAccounts();
  }, []);

  const loadLinkedAccounts = async () => {
    try {
      const accounts = await oauthApi.getLinkedAccounts();
      setLinkedAccounts(accounts);
    } catch (err) {
      console.error('Failed to load linked accounts:', err);
    }
  };

  const handleLinkAccount = async (provider: 'google' | 'apple' | 'instagram') => {
    try {
      setLoading(provider);
      setError(null);

      const { authUrl } = await oauthApi.initiateAuth(provider, true);
      
      // Open OAuth popup
      const popup = window.open(
        authUrl,
        'oauth-popup',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      // Listen for popup completion
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          setLoading(null);
          // Refresh linked accounts and profile
          loadLinkedAccounts();
          onAccountLinked();
        }
      }, 1000);

    } catch (err: any) {
      console.error('Failed to link account:', err);
      setError(err.response?.data?.message || 'Failed to link account. Please try again.');
      setLoading(null);
    }
  };

  const handleUnlinkAccount = async (provider: 'google' | 'apple' | 'instagram') => {
    if (!confirm(`Are you sure you want to unlink your ${provider} account?`)) {
      return;
    }

    try {
      setLoading(provider);
      setError(null);

      await oauthApi.unlinkAccount(provider);
      
      // Refresh linked accounts and profile
      await loadLinkedAccounts();
      onAccountLinked();
    } catch (err: any) {
      console.error('Failed to unlink account:', err);
      setError(err.response?.data?.message || 'Failed to unlink account. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const isProviderLinked = (providerId: string): boolean => {
    return linkedAccounts.providers.some(p => p.provider === providerId);
  };

  const getLinkedProvider = (providerId: string) => {
    return linkedAccounts.providers.find(p => p.provider === providerId);
  };

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Provider List */}
      <div className="space-y-4">
        {providerConfigs.map((provider) => {
          const isLinked = isProviderLinked(provider.id);
          const linkedProvider = getLinkedProvider(provider.id);
          const isLoading = loading === provider.id;

          return (
            <div
              key={provider.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
            >
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${provider.bgColor}`}>
                  <div className={provider.color}>
                    {provider.icon}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    {provider.name}
                  </h4>
                  {isLinked && linkedProvider ? (
                    <div className="text-sm text-gray-600">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Connected
                      </div>
                      {linkedProvider.providerEmail && (
                        <div className="text-xs text-gray-500 mt-1">
                          {linkedProvider.providerEmail}
                        </div>
                      )}
                      <div className="text-xs text-gray-500">
                        Linked {new Date(linkedProvider.linkedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">
                      Not connected
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {isLinked ? (
                  <button
                    onClick={() => handleUnlinkAccount(provider.id)}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 disabled:opacity-50 transition-colors"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                        Unlinking...
                      </div>
                    ) : (
                      'Unlink'
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => handleLinkAccount(provider.id)}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 disabled:opacity-50 transition-colors"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        Connecting...
                      </div>
                    ) : (
                      'Connect'
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

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
              About Connected Accounts
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Connected accounts allow you to sign in quickly without entering your password</li>
                <li>You can connect multiple accounts and use any of them to sign in</li>
                <li>Unlinking an account won't delete your profile data</li>
                <li>You'll always be able to sign in with your email and password</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Security Reminder
            </h3>
            <p className="mt-1 text-sm text-yellow-700">
              Only connect accounts that you own and trust. If you suspect unauthorized access to any connected account, unlink it immediately and change your passwords.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountLinking;