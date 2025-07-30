#!/bin/bash
# Recreate certificate properly for code signing
# Usage: ./scripts/recreate-certificate.sh

set -e

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

CERT_NAME="Karuku Developer"

echo -e "${BLUE}🔄 Recreating code signing certificate properly...${NC}"

# Clean up any existing certificates
echo -e "${YELLOW}🧹 Cleaning up existing certificates...${NC}"
security delete-certificate -c "$CERT_NAME" 2>/dev/null || echo "No existing certificate to delete"

# Create proper certificate using OpenSSL with correct extensions
echo -e "${YELLOW}🔧 Creating certificate with proper code signing extensions...${NC}"

TEMP_DIR=$(mktemp -d)
KEY_FILE="$TEMP_DIR/karuku-key.pem"
CERT_FILE="$TEMP_DIR/karuku-cert.pem"
P12_FILE="$TEMP_DIR/karuku.p12"

# Create config with proper code signing extensions
CONFIG_FILE="$TEMP_DIR/cert.conf"
cat > "$CONFIG_FILE" << EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
CN = $CERT_NAME
OU = Development
O = katoken03
C = JP

[v3_req]
keyUsage = critical, digitalSignature
extendedKeyUsage = critical, codeSigning
basicConstraints = critical, CA:false
subjectKeyIdentifier = hash
EOF

echo -e "${YELLOW}🔑 Generating RSA key pair...${NC}"
openssl genrsa -out "$KEY_FILE" 2048

echo -e "${YELLOW}📜 Creating certificate with code signing extensions...${NC}"
openssl req -new -x509 -key "$KEY_FILE" -out "$CERT_FILE" -days 365 -config "$CONFIG_FILE" -extensions v3_req

echo -e "${YELLOW}📦 Converting to PKCS#12...${NC}"
openssl pkcs12 -export -out "$P12_FILE" -inkey "$KEY_FILE" -in "$CERT_FILE" -name "$CERT_NAME" -passout pass:

echo -e "${YELLOW}📥 Importing to keychain...${NC}"
security import "$P12_FILE" -A -T /usr/bin/codesign -T /usr/bin/security

# Set the certificate as trusted for code signing
echo -e "${YELLOW}🔒 Setting trust policy...${NC}"
CERT_SHA1=$(security find-certificate -c "$CERT_NAME" -Z | grep "SHA-1 hash:" | cut -d' ' -f3)
if [ ! -z "$CERT_SHA1" ]; then
    echo -e "${BLUE}Certificate SHA1: $CERT_SHA1${NC}"
    
    # Create trust settings for code signing
    security set-key-partition-list -S apple-tool:,apple: -k "" -D "$CERT_SHA1" 2>/dev/null || \
    echo -e "${YELLOW}⚠️  Manual trust setting may be required${NC}"
    
    # Try to modify trust settings for code signing
    security add-trusted-cert -d -r trustRoot -k ~/Library/Keychains/login.keychain-db "$CERT_FILE" 2>/dev/null || \
    echo -e "${YELLOW}⚠️  Could not automatically set as trusted${NC}"
fi

# Cleanup
rm -rf "$TEMP_DIR"

echo -e "${YELLOW}🔍 Verifying certificate...${NC}"
if security find-identity -v -p codesigning | grep -q "$CERT_NAME"; then
    echo -e "${GREEN}✅ SUCCESS! Certificate '$CERT_NAME' is ready for code signing!${NC}"
    
    echo ""
    echo -e "${BLUE}📋 Available code signing certificates:${NC}"
    security find-identity -v -p codesigning
    
    echo ""
    echo -e "${GREEN}🚀 You can now run the signed build:${NC}"
    echo "./scripts/complete-release.sh 1.0.1"
else
    echo -e "${RED}❌ Certificate creation failed${NC}"
    echo ""
    echo -e "${YELLOW}📝 Manual steps required:${NC}"
    echo "1. Open Keychain Access"
    echo "2. Find the '$CERT_NAME' certificate"
    echo "3. Double-click it > Trust > Code Signing: Always Trust"
    echo "4. Enter your keychain password to save"
    
    # Open Keychain Access
    open /Applications/Utilities/Keychain\ Access.app
fi
