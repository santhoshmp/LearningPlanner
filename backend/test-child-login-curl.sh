#!/bin/bash

echo "Testing child login with curl..."

# Test the legacy endpoint first
echo "Testing legacy endpoint..."
curl -X POST http://localhost:3001/api/auth/child/login-legacy \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testchild",
    "pin": "1234"
  }' \
  -v

echo -e "\n\nTesting enhanced endpoint..."
curl -X POST http://localhost:3001/api/auth/child/login \
  -H "Content-Type: application/json" \
  -d '{
    "credentials": {
      "username": "testchild",
      "pin": "1234"
    },
    "deviceInfo": {
      "userAgent": "Test Browser",
      "platform": "Test Platform",
      "isMobile": false,
      "screenResolution": "1920x1080",
      "timezone": "America/New_York",
      "language": "en-US"
    },
    "ipAddress": "127.0.0.1"
  }' \
  -v