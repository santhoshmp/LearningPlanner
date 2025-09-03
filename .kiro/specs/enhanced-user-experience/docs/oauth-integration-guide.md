# OAuth Integration Guide

## Overview

This guide provides detailed instructions for integrating with Google, Apple, and Instagram OAuth providers in the Enhanced User Experience system. Each provider has specific requirements and implementation details.

## Table of Contents

1. [General OAuth Flow](#general-oauth-flow)
2. [Google OAuth Integration](#google-oauth-integration)
3. [Apple OAuth Integration](#apple-oauth-integration)
4. [Instagram OAuth Integration](#instagram-oauth-integration)
5. [Security Best Practices](#security-best-practices)
6. [Troubleshooting](#troubleshooting)

---

## General OAuth Flow

### PKCE (Proof Key for Code Exchange) Flow

All OAuth integrations use the PKCE flow for enhanced security:

1. **Generate Code Verifier and Challenge**
   ```javascript
   const codeVerifier = generateRandomString(128);
   const codeChallenge = base64URLEncode(sha256(codeVerifier));
   ```

2. **Initiate Authorization**
   - Redirect user to provider's authorization URL
   - Include code_challenge and code_challenge_method=S256

3. **Handle Callback**
   - Receive authorization code
   - Exchange code for tokens using code_verifier

4. **Token Management**
   - Store tokens securely (encrypted)
   - Handle token refresh
   - Implement token revocation

### Common Parameters

| Parameter | Description | Required |
|-----------|-------------|----------|
| `client_id` | OAuth application ID | Yes |
| `redirect_uri` | Callback URL | Yes |
| `scope` | Requested permissions | Yes |
| `state` | CSRF protection | Recommended |
| `code_challenge` | PKCE challenge | Yes |
| `code_challenge_method` | Always "S256" | Yes |

---

## Google OAuth Integration

### Prerequisites

1. **Google Cloud Console Setup**
   - Create a project in Google Cloud Console
   - Enable Google+ API and Google Identity API
   - Create OAuth 2.0 credentials

2. **Required Scopes**
   ```
   openid
   email
   profile
   ```

### Configuration

```javascript
const googleConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI,
  scope: 'openid email profile',
  authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo'
};
```

### Implementation Steps

#### 1. Authorization URL Generation

```javascript
function generateGoogleAuthUrl(codeChallenge, state) {
  const params = new URLSearchParams({
    client_id: googleConfig.clientId,
    redirect_uri: googleConfig.redirectUri,
    response_type: 'code',
    scope: googleConfig.scope,
    access_type: 'offline',
    prompt: 'consent',
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256'
  });
  
  return `${googleConfig.authUrl}?${params.toString()}`;
}
```

#### 2. Token Exchange

```javascript
async function exchangeGoogleCode(code, codeVerifier) {
  const response = await fetch(googleConfig.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: googleConfig.clientId,
      client_secret: googleConfig.clientSecret,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: googleConfig.redirectUri,
      code_verifier: codeVerifier
    })
  });
  
  return await response.json();
}
```

#### 3. User Information Retrieval

```javascript
async function getGoogleUserInfo(accessToken) {
  const response = await fetch(googleConfig.userInfoUrl, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  const userInfo = await response.json();
  
  return {
    providerUserId: userInfo.id,
    email: userInfo.email,
    name: userInfo.name,
    picture: userInfo.picture,
    verified: userInfo.verified_email
  };
}
```

### Google-Specific Considerations

- **Refresh Tokens**: Only provided on first authorization or when `prompt=consent`
- **Token Expiry**: Access tokens expire in 1 hour
- **Rate Limits**: 100 requests per 100 seconds per user
- **Verification**: Check `verified_email` field for email verification status

---

## Apple OAuth Integration

### Prerequisites

1. **Apple Developer Account**
   - Enroll in Apple Developer Program
   - Create App ID with Sign in with Apple capability
   - Generate Service ID for web authentication

2. **Required Configuration**
   - Service ID (client_id)
   - Team ID
   - Key ID
   - Private key (.p8 file)

### Configuration

```javascript
const appleConfig = {
  clientId: process.env.APPLE_CLIENT_ID, // Service ID
  teamId: process.env.APPLE_TEAM_ID,
  keyId: process.env.APPLE_KEY_ID,
  privateKey: process.env.APPLE_PRIVATE_KEY,
  redirectUri: process.env.APPLE_REDIRECT_URI,
  scope: 'name email',
  authUrl: 'https://appleid.apple.com/auth/authorize',
  tokenUrl: 'https://appleid.apple.com/auth/token'
};
```

### Implementation Steps

#### 1. Client Secret Generation

Apple requires a JWT client secret:

```javascript
const jwt = require('jsonwebtoken');

function generateAppleClientSecret() {
  const payload = {
    iss: appleConfig.teamId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    aud: 'https://appleid.apple.com',
    sub: appleConfig.clientId
  };
  
  return jwt.sign(payload, appleConfig.privateKey, {
    algorithm: 'ES256',
    header: {
      kid: appleConfig.keyId
    }
  });
}
```

#### 2. Authorization URL Generation

```javascript
function generateAppleAuthUrl(codeChallenge, state) {
  const params = new URLSearchParams({
    client_id: appleConfig.clientId,
    redirect_uri: appleConfig.redirectUri,
    response_type: 'code',
    scope: appleConfig.scope,
    response_mode: 'form_post',
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256'
  });
  
  return `${appleConfig.authUrl}?${params.toString()}`;
}
```

#### 3. Token Exchange

```javascript
async function exchangeAppleCode(code, codeVerifier) {
  const clientSecret = generateAppleClientSecret();
  
  const response = await fetch(appleConfig.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: appleConfig.clientId,
      client_secret: clientSecret,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: appleConfig.redirectUri,
      code_verifier: codeVerifier
    })
  });
  
  return await response.json();
}
```

#### 4. User Information Extraction

Apple provides user info in the ID token:

```javascript
function parseAppleIdToken(idToken) {
  const decoded = jwt.decode(idToken);
  
  return {
    providerUserId: decoded.sub,
    email: decoded.email,
    emailVerified: decoded.email_verified,
    name: decoded.name // Only available on first sign-in
  };
}
```

### Apple-Specific Considerations

- **User Information**: Only provided on first authorization
- **Email Privacy**: Users can choose to hide their email
- **Response Mode**: Uses `form_post` instead of query parameters
- **Client Secret**: Must be regenerated periodically (JWT expires)
- **No Refresh Tokens**: Apple doesn't provide refresh tokens

---

## Instagram OAuth Integration

### Prerequisites

1. **Facebook Developer Account**
   - Create Facebook App
   - Add Instagram Basic Display product
   - Configure OAuth redirect URIs

2. **Required Scopes**
   ```
   user_profile
   user_media
   ```

### Configuration

```javascript
const instagramConfig = {
  clientId: process.env.INSTAGRAM_CLIENT_ID,
  clientSecret: process.env.INSTAGRAM_CLIENT_SECRET,
  redirectUri: process.env.INSTAGRAM_REDIRECT_URI,
  scope: 'user_profile,user_media',
  authUrl: 'https://api.instagram.com/oauth/authorize',
  tokenUrl: 'https://api.instagram.com/oauth/access_token',
  userInfoUrl: 'https://graph.instagram.com/me'
};
```

### Implementation Steps

#### 1. Authorization URL Generation

```javascript
function generateInstagramAuthUrl(codeChallenge, state) {
  const params = new URLSearchParams({
    client_id: instagramConfig.clientId,
    redirect_uri: instagramConfig.redirectUri,
    scope: instagramConfig.scope,
    response_type: 'code',
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256'
  });
  
  return `${instagramConfig.authUrl}?${params.toString()}`;
}
```

#### 2. Token Exchange

```javascript
async function exchangeInstagramCode(code, codeVerifier) {
  const response = await fetch(instagramConfig.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: instagramConfig.clientId,
      client_secret: instagramConfig.clientSecret,
      grant_type: 'authorization_code',
      redirect_uri: instagramConfig.redirectUri,
      code: code,
      code_verifier: codeVerifier
    })
  });
  
  return await response.json();
}
```

#### 3. User Information Retrieval

```javascript
async function getInstagramUserInfo(accessToken) {
  const response = await fetch(`${instagramConfig.userInfoUrl}?fields=id,username,account_type&access_token=${accessToken}`);
  
  const userInfo = await response.json();
  
  return {
    providerUserId: userInfo.id,
    username: userInfo.username,
    accountType: userInfo.account_type
  };
}
```

#### 4. Long-Lived Token Exchange

Instagram short-lived tokens expire in 1 hour. Exchange for long-lived tokens:

```javascript
async function exchangeForLongLivedToken(shortLivedToken) {
  const response = await fetch('https://graph.instagram.com/access_token', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'ig_exchange_token',
      client_secret: instagramConfig.clientSecret,
      access_token: shortLivedToken
    })
  });
  
  return await response.json();
}
```

### Instagram-Specific Considerations

- **Token Types**: Short-lived (1 hour) and long-lived (60 days)
- **Limited User Data**: Only provides ID, username, and account type
- **No Email**: Instagram doesn't provide email addresses
- **Rate Limits**: 200 calls per hour per user
- **Business vs Personal**: Different capabilities based on account type

---

## Security Best Practices

### 1. PKCE Implementation

Always use PKCE for OAuth flows:

```javascript
// Generate secure random string
function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64URLEncode(array);
}

// Generate code challenge
function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = crypto.subtle.digest('SHA-256', data);
  return base64URLEncode(new Uint8Array(digest));
}
```

### 2. State Parameter

Use state parameter for CSRF protection:

```javascript
function generateState() {
  return crypto.randomUUID();
}

// Validate state in callback
function validateState(receivedState, expectedState) {
  return receivedState === expectedState;
}
```

### 3. Token Security

Encrypt tokens before storage:

```javascript
const crypto = require('crypto');

function encryptToken(token, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

function decryptToken(encryptedData, key) {
  const decipher = crypto.createDecipher('aes-256-gcm', key, Buffer.from(encryptedData.iv, 'hex'));
  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
  
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

### 4. Redirect URI Validation

Validate redirect URIs to prevent open redirect attacks:

```javascript
const allowedRedirectUris = [
  'https://app.studyplanner.com/auth/callback',
  'https://staging.studyplanner.com/auth/callback'
];

function validateRedirectUri(uri) {
  return allowedRedirectUris.includes(uri);
}
```

### 5. Token Expiration Handling

Implement automatic token refresh:

```javascript
async function refreshTokenIfNeeded(tokenData) {
  const now = Date.now();
  const expiresAt = tokenData.expiresAt;
  
  // Refresh if token expires in next 5 minutes
  if (expiresAt - now < 5 * 60 * 1000) {
    return await refreshToken(tokenData.refreshToken);
  }
  
  return tokenData;
}
```

---

## Troubleshooting

### Common Issues

#### 1. Invalid Client Error

**Symptoms**: `invalid_client` error during token exchange

**Solutions**:
- Verify client ID and secret are correct
- Check redirect URI matches exactly
- Ensure OAuth app is properly configured

#### 2. Invalid Grant Error

**Symptoms**: `invalid_grant` error during token exchange

**Solutions**:
- Check authorization code hasn't expired
- Verify code_verifier matches code_challenge
- Ensure redirect_uri is identical in both requests

#### 3. Scope Issues

**Symptoms**: Missing user information or permissions

**Solutions**:
- Verify requested scopes are approved by provider
- Check user granted all requested permissions
- Review provider-specific scope requirements

#### 4. State Mismatch

**Symptoms**: CSRF protection errors

**Solutions**:
- Ensure state parameter is properly stored and validated
- Check for URL encoding issues
- Verify state hasn't expired

### Provider-Specific Issues

#### Google Issues

- **Refresh Token Missing**: Add `access_type=offline` and `prompt=consent`
- **Invalid Audience**: Check client ID configuration
- **Quota Exceeded**: Implement exponential backoff

#### Apple Issues

- **Invalid Client Secret**: Regenerate JWT client secret
- **Missing User Info**: Only available on first authorization
- **Invalid Key**: Verify .p8 file and Key ID

#### Instagram Issues

- **Token Expired**: Exchange for long-lived token
- **Missing Email**: Instagram doesn't provide email
- **Rate Limited**: Implement request throttling

### Debugging Tips

1. **Log All Requests**: Log OAuth requests and responses (excluding sensitive data)
2. **Validate Tokens**: Use provider's token validation endpoints
3. **Test with Postman**: Use OAuth 2.0 flow in Postman for testing
4. **Check Provider Status**: Monitor provider status pages for outages
5. **Use Provider Tools**: Utilize provider debugging tools and consoles

### Error Handling Best Practices

```javascript
async function handleOAuthError(error, provider) {
  const errorMap = {
    'invalid_client': 'OAuth configuration error',
    'invalid_grant': 'Authorization code expired or invalid',
    'invalid_scope': 'Requested permissions not available',
    'access_denied': 'User denied authorization'
  };
  
  const userMessage = errorMap[error.error] || 'Authentication failed';
  
  // Log detailed error for debugging
  console.error(`OAuth error for ${provider}:`, error);
  
  // Return user-friendly message
  return {
    success: false,
    error: userMessage,
    provider: provider
  };
}
```

This guide provides comprehensive information for implementing OAuth integration with Google, Apple, and Instagram. Follow the security best practices and troubleshooting guidelines to ensure a robust and secure implementation.