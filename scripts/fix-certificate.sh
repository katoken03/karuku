#!/bin/bash
# Certificate troubleshooting and fix
# Usage: ./scripts/fix-certificate.sh

set -e

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔍 Troubleshooting certificate issues...${NC}"

# Check if certificate exists at all
echo -e "${YELLOW}📋 Step 1: Checking if certificate exists...${NC}"
if security find-certificate -c "Karuku Developer" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Certificate 'Karuku Developer' found in keychain${NC}"
    
    # Get certificate details
    echo -e "${YELLOW}📄 Certificate details:${NC}"
    security find-certificate -c "Karuku Developer" -p | openssl x509 -text -noout | grep -E "(Subject:|Issuer:|Signature Algorithm:|Key Usage:|Extended Key Usage:)" || true
    
    # Check if it has a private key
    echo -e "${YELLOW}🔑 Checking for private key...${NC}"
    if security find-identity -v | grep -q "Karuku Developer"; then
        echo -e "${GREEN}✅ Private key found${NC}"
        
        # Check specifically for code signing capability
        echo -e "${YELLOW}🔍 Checking code signing capability...${NC}"
        CERT_DETAILS=$(security find-certificate -c "Karuku Developer" -p | openssl x509 -text -noout)
        
        if echo "$CERT_DETAILS" | grep -q "Code Signing"; then
            echo -e "${GREEN}✅ Certificate has Code Signing capability${NC}"
            
            # The certificate exists but may need trust settings
            echo -e "${YELLOW}🔒 Fixing trust settings...${NC}"
            
            # Get the certificate hash
            CERT_SHA1=$(security find-certificate -c "Karuku Developer" -Z | grep "SHA-1 hash:" | cut -d' ' -f3)
            if [ ! -z "$CERT_SHA1" ]; then
                echo -e "${BLUE}Certificate SHA1: $CERT_SHA1${NC}"
                
                # Try to set trust for code signing
                security set-key-partition-list -S apple-tool:,apple: -k "" -D "$CERT_SHA1" 2>/dev/null || \
                echo -e "${YELLOW}⚠️  Could not automatically set trust (may need manual intervention)${NC}"
                
                # Try to add code signing trust
                security add-trusted-cert -d -r trustRoot -k ~/Library/Keychains/login.keychain-db \
                    <(security find-certificate -c "Karuku Developer" -p) 2>/dev/null || \
                echo -e "${YELLOW}⚠️  Could not add as trusted cert automatically${NC}"
            fi
        else
            echo -e "${RED}❌ Certificate does not have Code Signing capability${NC}"
            echo -e "${YELLOW}📝 Need to recreate with proper extensions${NC}"
        fi
    else
        echo -e "${RED}❌ Certificate exists but no private key found${NC}"
        echo -e "${YELLOW}📝 Need to recreate the certificate with private key${NC}"
    fi
else
    echo -e "${RED}❌ Certificate 'Karuku Developer' not found${NC}"
    echo -e "${YELLOW}📝 Certificate needs to be created${NC}"
fi

echo ""
echo -e "${YELLOW}📋 Step 2: Current state summary${NC}"
echo "All identities:"
security find-identity -v

echo ""
echo "Code signing identities:"
security find-identity -v -p codesigning

echo ""
echo -e "${BLUE}🔧 Recommended next steps:${NC}"

if security find-identity -v -p codesigning | grep -q "Karuku Developer"; then
    echo -e "${GREEN}✅ Certificate is working! You can proceed with signing.${NC}"
else
    echo -e "${YELLOW}🔄 Certificate needs to be recreated properly.${NC}"
    echo ""
    echo "Option 1: Delete and recreate manually"
    echo "1. Open Keychain Access"
    echo "2. Find and delete any existing 'Karuku Developer' certificates"
    echo "3. Create new certificate with these exact settings:"
    echo "   - Name: Karuku Developer"
    echo "   - Identity Type: Self Signed Root"
    echo "   - Certificate Type: Code Signing"
    echo "   - ✅ Check 'Let me override defaults'"
    echo "   - In Key Pair Information: Key Size 2048, Algorithm RSA"
    echo "   - In Key Usage Extension: ✅ Signature"
    echo "   - In Extended Key Usage Extension: ✅ Code Signing"
    echo ""
    echo "Option 2: Run automated recreation"
    echo "./scripts/recreate-certificate.sh"
fi
