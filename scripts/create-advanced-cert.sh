#!/bin/bash
# Advanced self-signed certificate with entitlements
# Usage: ./scripts/create-advanced-cert.sh

set -e

CERT_NAME="Developer ID Application: katoken03"
CERT_NAME_INSTALLER="Developer ID Installer: katoken03"

echo "🔐 Creating advanced self-signed certificates..."

# Create Application certificate
security create-certificate \
    -t 1 \
    -c \
    -k "login" \
    -A \
    -Z sha256 \
    -a "rsa" \
    -s 2048 \
    -f kSecKeyUsageDigitalSignature \
    -S "/CN=${CERT_NAME}/OU=Development/O=katoken03/C=JP" \
    "${CERT_NAME}"

# Create Installer certificate  
security create-certificate \
    -t 1 \
    -c \
    -k "login" \
    -A \
    -Z sha256 \
    -a "rsa" \
    -s 2048 \
    -f kSecKeyUsageDigitalSignature \
    -S "/CN=${CERT_NAME_INSTALLER}/OU=Development/O=katoken03/C=JP" \
    "${CERT_NAME_INSTALLER}"

echo "✅ Advanced certificates created"

# Create entitlements file
mkdir -p assets
cat > assets/entitlements.mac.plist << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.cs.allow-jit</key>
    <true/>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
    <key>com.apple.security.cs.disable-library-validation</key>
    <true/>
    <key>com.apple.security.files.user-selected.read-write</key>
    <true/>
</dict>
</plist>
EOF

echo "✅ Entitlements file created: assets/entitlements.mac.plist"

# Update package.json for advanced signing
echo "📝 Update your package.json with:"
echo "\"identity\": \"${CERT_NAME}\""
echo "\"entitlements\": \"assets/entitlements.mac.plist\""
