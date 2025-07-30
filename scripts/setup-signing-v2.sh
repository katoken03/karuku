#!/bin/bash
# Self-signed code signing certificate creator (macOS compatible)
# Usage: ./scripts/setup-signing-v2.sh

set -e

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

CERT_NAME="Karuku Developer"
KEYCHAIN="login"

echo -e "${BLUE}🔐 Setting up self-signed code signing...${NC}"

# Check macOS version and available commands
echo -e "${YELLOW}📋 Checking system compatibility...${NC}"
echo "macOS Version: $(sw_vers -productVersion)"

# Check if certificate already exists
if security find-identity -v -p codesigning | grep -q "$CERT_NAME"; then
    echo -e "${GREEN}✅ Certificate '$CERT_NAME' already exists${NC}"
else
    echo -e "${YELLOW}🔍 Trying Method 1: security create-certificate...${NC}"
    
    # Try with different syntax variations
    if security create-certificate \
        -c -k "$KEYCHAIN" \
        -A -z sha256 \
        -a rsa -s 2048 \
        -f kSecKeyUsageDigitalSignature \
        -S "/CN=$CERT_NAME/OU=Development/O=katoken03/C=JP" \
        "$CERT_NAME" 2>/dev/null; then
        
        echo -e "${GREEN}✅ Certificate created with create-certificate${NC}"
        
    elif security create-certificate \
        -c -k "$KEYCHAIN" \
        -A \
        -S "/CN=$CERT_NAME/OU=Development/O=katoken03/C=JP" \
        "$CERT_NAME" 2>/dev/null; then
        
        echo -e "${GREEN}✅ Certificate created with simplified create-certificate${NC}"
        
    else
        echo -e "${YELLOW}⚠️  create-certificate failed, trying OpenSSL method...${NC}"
        
        # Method 2: Use OpenSSL
        if command -v openssl >/dev/null 2>&1; then
            echo -e "${YELLOW}🔧 Using OpenSSL method...${NC}"
            
            # Create temporary files
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
keyUsage = digitalSignature
extendedKeyUsage = codeSigning
EOF
            
            # Generate key and certificate
            openssl genrsa -out "$KEY_FILE" 2048
            openssl req -new -x509 -key "$KEY_FILE" -out "$CERT_FILE" -days 365 -config "$CONFIG_FILE"
            
            # Convert to p12 and import
            openssl pkcs12 -export -out "$P12_FILE" -inkey "$KEY_FILE" -in "$CERT_FILE" -name "$CERT_NAME" -passout pass:
            security import "$P12_FILE" -k "$KEYCHAIN" -T /usr/bin/codesign -T /usr/bin/security
            
            # Set trust settings for code signing
            CERT_SHA1=$(security find-certificate -c "$CERT_NAME" -Z | grep SHA-1 | cut -d' ' -f3)
            if [ ! -z "$CERT_SHA1" ]; then
                security set-key-partition-list -S apple-tool:,apple: -k "" -D "$CERT_SHA1" "$KEYCHAIN" 2>/dev/null || true
            fi
            
            # Cleanup
            rm -rf "$TEMP_DIR"
            
            echo -e "${GREEN}✅ Certificate created using OpenSSL method${NC}"
        else
            echo -e "${RED}❌ OpenSSL not available${NC}"
            echo -e "${YELLOW}📋 Manual creation required...${NC}"
            
            # Method 3: Manual creation guide
            echo -e "${BLUE}📝 Manual certificate creation steps:${NC}"
            echo "1. Open Keychain Access: open /Applications/Utilities/Keychain\\ Access.app"
            echo "2. Select 'login' keychain in left sidebar"
            echo "3. Menu: Keychain Access > Certificate Assistant > Create a Certificate..."
            echo "4. Name: $CERT_NAME"
            echo "5. Identity Type: Self Signed Root"
            echo "6. Certificate Type: Code Signing"
            echo "7. Check 'Let me override defaults'"
            echo "8. Continue through steps with defaults"
            echo ""
            
            # Open Keychain Access
            open /Applications/Utilities/Keychain\ Access.app
            
            read -p "Press Enter after creating the certificate manually..."
        fi
    fi
fi

# Verify certificate exists
echo -e "${YELLOW}🔍 Verifying certificate installation...${NC}"
if security find-identity -v -p codesigning | grep -q "$CERT_NAME"; then
    echo -e "${GREEN}✅ Certificate '$CERT_NAME' found and ready to use${NC}"
    
    # Show available certificates
    echo -e "${BLUE}📋 Available code signing certificates:${NC}"
    security find-identity -v -p codesigning
    
    echo ""
    echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
    echo ""
    echo -e "${YELLOW}📝 Next steps:${NC}"
    echo "1. Certificate is installed in keychain"
    echo "2. package.json is configured with identity"
    echo "3. Run signed build: ./scripts/complete-release.sh 1.0.1"
    echo ""
    echo -e "${BLUE}ℹ️  Note: Self-signed apps may still show warnings on first launch${NC}"
else
    echo -e "${RED}❌ Certificate not found. Please try manual creation.${NC}"
    exit 1
fi
