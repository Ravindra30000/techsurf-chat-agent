#!/bin/bash

# 🚀 TechSurf Chat Platform - Initial Setup Script
# This script sets up the entire development environment

set -e  # Exit on any error

echo "🚀 Setting up TechSurf Chat Platform..."
echo "========================================"

# Check Node.js version
echo "📋 Checking Node.js version..."
NODE_VERSION=$(node --version | cut -d'v' -f2)
REQUIRED_VERSION="18.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ Node.js version $REQUIRED_VERSION or higher is required. You have $NODE_VERSION"
    echo "   Please install Node.js from https://nodejs.org"
    exit 1
fi

echo "✅ Node.js version: v$NODE_VERSION"

# Create directory structure
echo "📁 Creating project directories..."
mkdir -p client/src/components/common
mkdir -p client/src/components/chat
mkdir -p client/src/pages
mkdir -p client/src/hooks
mkdir -p client/src/utils
mkdir -p client/src/types
mkdir -p client/public
mkdir -p server/src/routes
mkdir -p server/src/services
mkdir -p server/src/middleware
mkdir -p server/src/models
mkdir -p server/src/utils
mkdir -p server/src/types
mkdir -p sdk/src
mkdir -p sdk/examples
mkdir -p tests/unit
mkdir -p tests/integration
mkdir -p tests/e2e
mkdir -p docs
mkdir -p scripts
mkdir -p .github/workflows

echo "✅ Project directories created"

# Copy environment template
echo "🌍 Setting up environment variables..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env file from template"
    echo "⚠️  Please edit .env file with your actual API keys and configuration"
else
    echo "✅ .env file already exists"
fi

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Setup client
echo "🖥️  Setting up React client..."
cd client
if [ ! -f package.json ]; then
    echo "Creating client package.json..."
    cd ..
else
    npm install
    cd ..
fi

# Setup server  
echo "🖧 Setting up Node.js server..."
cd server
if [ ! -f package.json ]; then
    echo "Creating server package.json..."
    cd ..
else
    npm install
    cd ..
fi

# Setup SDK
echo "📦 Setting up Widget SDK..."
cd sdk
if [ ! -f package.json ]; then
    echo "Creating SDK package.json..."
    cd ..
else
    npm install
    cd ..
fi

# Create initial TypeScript configuration
echo "📝 Creating TypeScript configuration..."
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "declaration": true,
    "outDir": "./dist",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/utils/*": ["./src/utils/*"],
      "@/types/*": ["./src/types/*"]
    }
  },
  "include": [
    "src/**/*",
    "client/src/**/*",
    "server/src/**/*",
    "sdk/src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "build"
  ]
}
EOF

echo "✅ TypeScript configuration created"

# Create ESLint configuration
echo "🔍 Creating ESLint configuration..."
cat > .eslintrc.json << 'EOF'
{
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "react-app",
    "react-app/jest"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-explicit-any": "warn",
    "no-console": "warn"
  },
  "env": {
    "node": true,
    "browser": true,
    "es2020": true
  }
}
EOF

echo "✅ ESLint configuration created"

# Create Prettier configuration
echo "💅 Creating Prettier configuration..."
cat > .prettierrc << 'EOF'
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
EOF

echo "✅ Prettier configuration created"

# Check for required environment variables
echo "🔐 Checking required environment variables..."
source .env 2>/dev/null || true

MISSING_VARS=()

if [ -z "$GROQ_API_KEY" ] || [ "$GROQ_API_KEY" = "your_groq_api_key_here" ]; then
    MISSING_VARS+=("GROQ_API_KEY")
fi

if [ -z "$CONTENTSTACK_API_KEY" ] || [ "$CONTENTSTACK_API_KEY" = "your_contentstack_api_key" ]; then
    MISSING_VARS+=("CONTENTSTACK_API_KEY")
fi

if [ -z "$CONTENTSTACK_DELIVERY_TOKEN" ] || [ "$CONTENTSTACK_DELIVERY_TOKEN" = "your_delivery_token" ]; then
    MISSING_VARS+=("CONTENTSTACK_DELIVERY_TOKEN")
fi

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo "⚠️  Missing required environment variables:"
    for var in "${MISSING_VARS[@]}"; do
        echo "   - $var"
    done
    echo ""
    echo "Please update your .env file with the actual values before running the application."
fi

# Initialize Git repository if not already done
if [ ! -d .git ]; then
    echo "📚 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit: TechSurf Chat Platform setup"
    echo "✅ Git repository initialized"
else
    echo "✅ Git repository already exists"
fi

# Create initial README if it doesn't exist
if [ ! -f README.md ]; then
    echo "📄 Creating README.md..."
    cat > README.md << 'EOF'
# 🚀 TechSurf Chat Platform

Universal AI-powered chat widget platform with Contentstack integration.

## Quick Start

1. **Setup**: `npm run setup`
2. **Development**: `npm run dev`
3. **Build**: `npm run build`
4. **Deploy**: `npm run deploy`

## Environment Variables

Copy `.env.example` to `.env` and configure:

- `GROQ_API_KEY`: Your Groq API key
- `CONTENTSTACK_API_KEY`: Contentstack API key
- `CONTENTSTACK_DELIVERY_TOKEN`: Contentstack delivery token

## Architecture

- **Client**: React + TypeScript frontend
- **Server**: Node.js + Express backend  
- **SDK**: Universal widget package
- **Deployment**: Contentstack Launch

## Documentation

- [API Documentation](docs/api.md)
- [SDK Documentation](docs/sdk.md)
- [Deployment Guide](docs/deployment.md)
EOF
    echo "✅ README.md created"
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your API keys"
echo "2. Run 'npm run dev' to start development servers"
echo "3. Open http://localhost:3000 to see the application"
echo ""
echo "For Contentstack Launch deployment:"
echo "1. Push code to GitHub"
echo "2. Connect repository to Launch"
echo "3. Deploy with 'npm run deploy'"
echo ""
echo "Happy coding! 🚀"