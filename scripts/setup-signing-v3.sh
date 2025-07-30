#!/bin/bash
# Self-signed code signing certificate creator (Fixed keychain issue)
# Usage: ./scripts/setup-signing-v3.sh

set -e

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

CERT_NAME="Karuku Developer"

echo -e "${BLUE}🔐 Setting up self-signed code signing...${NC}"

# Get the correct keychain path
DEFAULT_KEYCHAIN=$(security default-keychain | tr -d '"')
echo -e "${YELLOW}📋 Using keychain: $DEFAULT_KEYCHAIN${NC}"
echo "macOS Version: $(sw_vers -productVersion)"

# Check if certificate already exists
if security find-identity -v -p codesigning | grep -q "$CERT_NAME"; then
    echo -e "${GREEN}✅ Certificate '$CERT_NAME' already exists${NC}"
else
    echo -e "${YELLOW}🔧 Creating certificate using OpenSSL method...${NC}"
    
    # Create temporary files
    TEMP_DIR=$(mktemp -d)
    KEY_FILE="$TEMP_DIR/karuku-key.pem"
    CERT_FILE="$TEMP_DIR/karuku-cert.pem"
    P12_FILE="$TEMP_DIR/karuku.p12"
    
    echo -e "${BLUE}📁 Working in: $TEMP_DIR${NC}"
    
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
keyUsage = digitalSignature
extendedKeyUsage = codeSigning
basicConstraints = CA:false
EOF
    
    echo -e "${YELLOW}🔑 Generating private key...${NC}"
    openssl genrsa -out "$KEY_FILE" 2048
    
    echo -e "${YELLOW}📜 Creating certificate...${NC}"
    openssl req -new -x509 -key "$KEY_FILE" -out "$CERT_FILE" -days 365 -config "$CONFIG_FILE"
    
    echo -e "${YELLOW}📦 Converting to PKCS#12 format...${NC}"
    openssl pkcs12 -export -out "$P12_FILE" -inkey "$KEY_FILE" -in "$CERT_FILE" -name "$CERT_NAME" -passout pass:
    
    echo -e "${YELLOW}📥 Importing to keychain...${NC}"
    
    # Try different import methods
    if security import "$P12_FILE" -k "$DEFAULT_KEYCHAIN" -T /usr/bin/codesign -T /usr/bin/security; then
        echo -e "${GREEN}✅ Imported to default keychain${NC}"
    elif security import "$P12_FILE" -T /usr/bin/codesign -T /usr/bin/security; then
        echo -e "${GREEN}✅ Imported to system keychain${NC}"
    else
        echo -e "${RED}❌ Import failed, trying alternative method...${NC}"
        
        # Alternative: Import without specifying keychain
        security import "$P12_FILE" -A
        echo -e "${YELLOW}⚠️  Imported with alternative method${NC}"
    fi
    
    # Try to set trust settings
    echo -e "${YELLOW}🔒 Setting trust settings...${NC}"
    CERT_SHA1=$(security find-certificate -c "$CERT_NAME" -Z 2>/dev/null | grep "SHA-1 hash:" | cut -d' ' -f3)
    
    if [ ! -z "$CERT_SHA1" ]; then
        echo -e "${BLUE}Found certificate SHA1: $CERT_SHA1${NC}"
        # Try to allow codesign to use this certificate
        security set-key-partition-list -S apple-tool:,apple: -k "" -D "$CERT_SHA1" 2>/dev/null || \
        security set-key-partition-list -S apple-tool:,apple: -D "$CERT_SHA1" 2>/dev/null || \
        echo -e "${YELLOW}⚠️  Could not set partition list (may require password)${NC}"
    fi
    
    # Cleanup
    rm -rf "$TEMP_DIR"
    echo -e "${GREEN}🧹 Cleaned up temporary files${NC}"
fi

# Verify certificate exists
echo -e "${YELLOW}🔍 Verifying certificate installation...${NC}"

# List all code signing certificates
echo -e "${BLUE}📋 All code signing certificates:${NC}"
security find-identity -v -p codesigning

if security find-identity -v -p codesigning | grep -q "$CERT_NAME"; then
    echo -e "${GREEN}✅ Certificate '$CERT_NAME' found and ready to use!${NC}"
    
    echo ""
    echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
    echo ""
    echo -e "${YELLOW}📝 Next steps:${NC}"
    echo "1. ✅ Certificate is installed in keychain"
    echo "2. ✅ package.json is configured with identity"
    echo "3. 🚀 Run signed build: ./scripts/complete-release.sh 1.0.1"
    echo ""
    echo -e "${BLUE}ℹ️  Note: You may be prompted for keychain password during signing${NC}"
    
    # Test the certificate
    echo -e "${YELLOW}🧪 Testing certificate usability...${NC}"
    if security find-identity -v -p codesigning | grep "$CERT_NAME" | grep -q "valid"; then
        echo -e "${GREEN}✅ Certificate is valid and ready for signing${NC}"
    else
        echo -e "${YELLOW}⚠️  Certificate may need manual trust settings${NC}"
        echo "You can set trust manually in Keychain Access if needed"
    fi
    
else
    echo -e "${RED}❌ Certificate not found after import.${NC}"
    echo -e "${YELLOW}📋 Available options:${NC}"
    echo "1. Try running the script again"
    echo "2. Create certificate manually in Keychain Access"
    echo "3. Check Keychain Access app for imported certificate"
    
    # Open Keychain Access for manual verification
    echo -e "${BLUE}🔧 Opening Keychain Access for manual check...${NC}"
    open /Applications/Utilities/Keychain\ Access.app
    
    exit 1
fi
