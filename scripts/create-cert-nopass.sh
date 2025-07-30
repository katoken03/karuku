#!/bin/bash
# Create certificate without password prompts
# Usage: ./scripts/create-cert-nopass.sh

set -e

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

CERT_NAME="Karuku Developer"

echo -e "${BLUE}🔐 Creating certificate without password...${NC}"

# Clean up existing certificates first
echo -e "${YELLOW}🧹 Cleaning up existing certificates...${NC}"
security delete-certificate -c "$CERT_NAME" 2>/dev/null || echo "No existing certificate to delete"

# Method: Create certificate using OpenSSL and import with empty password
echo -e "${YELLOW}🔧 Creating certificate with empty password...${NC}"

TEMP_DIR=$(mktemp -d)
KEY_FILE="$TEMP_DIR/karuku-key.pem"
CERT_FILE="$TEMP_DIR/karuku-cert.pem"
P12_FILE="$TEMP_DIR/karuku.p12"

# Create config file
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

echo -e "${YELLOW}🔑 Generating key and certificate...${NC}"
openssl genrsa -out "$KEY_FILE" 2048
openssl req -new -x509 -key "$KEY_FILE" -out "$CERT_FILE" -days 365 -config "$CONFIG_FILE" -extensions v3_req

echo -e "${YELLOW}📦 Creating PKCS#12 with EMPTY password...${NC}"
# Use -passout pass: for empty password
openssl pkcs12 -export -out "$P12_FILE" -inkey "$KEY_FILE" -in "$CERT_FILE" -name "$CERT_NAME" -passout pass:

echo -e "${YELLOW}📥 Importing with empty password...${NC}"
# Import with empty password specification
security import "$P12_FILE" -k ~/Library/Keychains/login.keychain-db -T /usr/bin/codesign -T /usr/bin/security -f pkcs12 -P ""

# Alternative method if the above fails
if ! security find-identity -v -p codesigning | grep -q "$CERT_NAME"; then
    echo -e "${YELLOW}🔄 Trying alternative import method...${NC}"
    
    # Import certificate and key separately
    security import "$CERT_FILE" -k ~/Library/Keychains/login.keychain-db -T /usr/bin/codesign
    security import "$KEY_FILE" -k ~/Library/Keychains/login.keychain-db -T /usr/bin/codesign
fi

# Set partition list to allow codesign without prompting
echo -e "${YELLOW}🔒 Setting up access permissions...${NC}"
CERT_SHA1=$(security find-certificate -c "$CERT_NAME" -Z 2>/dev/null | grep "SHA-1 hash:" | cut -d' ' -f3)
if [ ! -z "$CERT_SHA1" ]; then
    echo -e "${BLUE}Found certificate SHA1: $CERT_SHA1${NC}"
    # Allow codesign and security tools to access this certificate
    security set-key-partition-list -S apple-tool:,apple: -k "" -D "$CERT_SHA1" 2>/dev/null || \
    echo -e "${YELLOW}⚠️  Could not set partition list automatically${NC}"
fi

# Cleanup
rm -rf "$TEMP_DIR"

# Verify
echo -e "${YELLOW}🔍 Verifying certificate...${NC}"
if security find-identity -v -p codesigning | grep -q "$CERT_NAME"; then
    echo -e "${GREEN}✅ SUCCESS! Certificate created without password!${NC}"
    
    echo ""
    echo -e "${BLUE}📋 Available code signing certificates:${NC}"
    security find-identity -v -p codesigning
    
    echo ""
    echo -e "${GREEN}🚀 Ready for signed build!${NC}"
    echo "./scripts/complete-release.sh 1.0.1"
else
    echo -e "${RED}❌ Certificate creation failed${NC}"
    echo -e "${YELLOW}💡 Try the manual method instead${NC}"
fi
