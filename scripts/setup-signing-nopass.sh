#!/bin/bash
# Password-free certificate creation
# Usage: ./scripts/setup-signing-nopass.sh

set -e

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

CERT_NAME="Karuku Developer"

echo -e "${BLUE}🔐 Creating certificate without password prompts...${NC}"

# Method 1: Try to create a temporary keychain
TEMP_KEYCHAIN="karuku-temp.keychain"
TEMP_PASSWORD="temporary123"

echo -e "${YELLOW}📦 Creating temporary keychain...${NC}"

# Create temporary keychain
if security create-keychain -p "$TEMP_PASSWORD" "$TEMP_KEYCHAIN"; then
    echo -e "${GREEN}✅ Temporary keychain created${NC}"
    
    # Unlock the keychain
    security unlock-keychain -p "$TEMP_PASSWORD" "$TEMP_KEYCHAIN"
    
    # Set settings to avoid timeout
    security set-keychain-settings "$TEMP_KEYCHAIN"
    
    echo -e "${YELLOW}🔧 Creating certificate in temporary keychain...${NC}"
    
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
basicConstraints = CA:false
EOF
    
    # Generate key and certificate
    openssl genrsa -out "$KEY_FILE" 2048
    openssl req -new -x509 -key "$KEY_FILE" -out "$CERT_FILE" -days 365 -config "$CONFIG_FILE"
    openssl pkcs12 -export -out "$P12_FILE" -inkey "$KEY_FILE" -in "$CERT_FILE" -name "$CERT_NAME" -passout pass:
    
    # Import to temporary keychain
    security import "$P12_FILE" -k "$TEMP_KEYCHAIN" -T /usr/bin/codesign -T /usr/bin/security
    
    # Copy certificate to login keychain (this might prompt for password)
    echo -e "${YELLOW}📥 Copying to login keychain...${NC}"
    echo "Note: You may be prompted for your Mac login password"
    
    # Export from temp and import to login keychain
    security export -k "$TEMP_KEYCHAIN" -t certs -f pemseq -o "$TEMP_DIR/cert-only.pem"
    security import "$TEMP_DIR/cert-only.pem" -T /usr/bin/codesign || echo "Certificate import may have failed"
    
    # Cleanup
    rm -rf "$TEMP_DIR"
    security delete-keychain "$TEMP_KEYCHAIN"
    
    echo -e "${GREEN}🧹 Cleanup completed${NC}"
else
    echo -e "${YELLOW}⚠️  Temporary keychain creation failed, trying direct method...${NC}"
fi

# Method 2: Manual instructions for Keychain Access
echo -e "${BLUE}📝 Alternative: Manual creation in Keychain Access${NC}"
echo ""
echo -e "${YELLOW}Step-by-step manual process:${NC}"
echo "1. 🔓 Open Keychain Access"
echo "2. 📂 Select 'login' keychain (left sidebar)"
echo "3. 📋 Menu: Keychain Access > Certificate Assistant > Create a Certificate..."
echo "4. ✏️  Fill in:"
echo "   - Name: $CERT_NAME"
echo "   - Identity Type: Self Signed Root"
echo "   - Certificate Type: Code Signing"
echo "   - ✅ Check 'Let me override defaults'"
echo "5. ➡️  Continue through all steps (keep defaults)"
echo "6. 🎯 Done! No password required with this method"
echo ""

# Open Keychain Access
echo -e "${BLUE}🚀 Opening Keychain Access...${NC}"
open /Applications/Utilities/Keychain\ Access.app

echo ""
echo -e "${YELLOW}💡 Tips:${NC}"
echo "- The manual method in Keychain Access typically doesn't require a password"
echo "- If prompted for a password, try your Mac login password"
echo "- You can skip password by pressing 'Cancel' in some dialogs"

# Wait for user to complete manual creation
echo ""
read -p "Press Enter after creating the certificate manually (or if already done)..."

# Verify certificate
echo -e "${YELLOW}🔍 Checking for certificate...${NC}"
if security find-identity -v -p codesigning | grep -q "$CERT_NAME"; then
    echo -e "${GREEN}✅ Certificate '$CERT_NAME' found!${NC}"
    
    echo ""
    echo -e "${GREEN}🎉 Success! Certificate is ready for use.${NC}"
    echo ""
    echo -e "${YELLOW}📝 Next steps:${NC}"
    echo "1. ✅ Certificate '$CERT_NAME' is installed"
    echo "2. ✅ package.json is configured"
    echo "3. 🚀 Run: ./scripts/complete-release.sh 1.0.1"
    
    # Show all available certificates
    echo ""
    echo -e "${BLUE}📋 Available code signing certificates:${NC}"
    security find-identity -v -p codesigning
else
    echo -e "${RED}❌ Certificate not found.${NC}"
    echo "Please try the manual method in Keychain Access."
fi
