#!/bin/bash
# Self-signed certificate setup and signed build
# Usage: ./scripts/setup-signing.sh

set -e

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

CERT_NAME="Karuku Developer"

echo -e "${BLUE}🔐 Setting up self-signed code signing...${NC}"

# Check if certificate already exists
if security find-identity -v -p codesigning | grep -q "$CERT_NAME"; then
    echo -e "${GREEN}✅ Certificate '$CERT_NAME' already exists${NC}"
else
    echo -e "${YELLOW}📝 Creating self-signed certificate...${NC}"
    
    # Create the certificate
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
    
    echo -e "${GREEN}✅ Certificate '${CERT_NAME}' created successfully${NC}"
fi

# Show available certificates
echo -e "${BLUE}📋 Available code signing certificates:${NC}"
security find-identity -v -p codesigning

echo ""
echo -e "${GREEN}🎉 Setup completed!${NC}"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. The certificate is now installed in your keychain"
echo "2. package.json has been updated with the identity"
echo "3. Run a signed build with: ./scripts/complete-release.sh 1.0.1"
echo ""
echo -e "${BLUE}ℹ️  Note: Self-signed apps will still show a warning on first launch,${NC}"
echo -e "${BLUE}   but it will be less severe than unsigned apps.${NC}"
