#!/bin/bash
# Self-signed code signing certificate creator
# Usage: ./scripts/create-certificate.sh

set -e

CERT_NAME="Karuku Developer"
KEYCHAIN="login"

echo "🔐 Creating self-signed code signing certificate..."

# Create the certificate
security create-certificate \
    -t 1 \
    -c \
    -k "${KEYCHAIN}" \
    -A \
    -Z sha256 \
    -a "rsa" \
    -s 2048 \
    -f kSecKeyUsageDigitalSignature \
    -S "/CN=${CERT_NAME}/OU=Development/O=katoken03/C=JP" \
    "${CERT_NAME}"

echo "✅ Certificate '${CERT_NAME}' created successfully"

# List available certificates
echo "📋 Available code signing certificates:"
security find-identity -v -p codesigning

echo ""
echo "🎯 To use this certificate, update package.json with:"
echo "\"identity\": \"${CERT_NAME}\""
