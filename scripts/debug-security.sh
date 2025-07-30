#!/bin/bash
# Debug security command capabilities
# Usage: ./scripts/debug-security.sh

set -e

echo "🔍 Debugging macOS security command capabilities..."
echo ""

echo "📋 System Information:"
echo "macOS Version: $(sw_vers -productVersion)"
echo "Security Command Location: $(which security)"
echo ""

echo "🔧 Testing security command availability..."

# Test if create-certificate subcommand exists
echo "Testing 'security create-certificate -h':"
if security create-certificate -h 2>&1 | head -5; then
    echo "✅ create-certificate subcommand exists"
else
    echo "❌ create-certificate subcommand not found"
fi

echo ""
echo "📖 Available security subcommands:"
security 2>&1 | grep -A 20 "Available commands:" || echo "Could not list commands"

echo ""
echo "🔍 Checking existing certificates:"
security find-identity -v -p codesigning

echo ""
echo "💡 Alternative methods available:"
echo "1. Keychain Access GUI"
echo "2. OpenSSL + security import"
echo "3. Manual certificate creation"
