#!/usr/bin/env bash
set -e

echo "Setting up npm authentication..."

# Write .npmrc with the GitHub token
cat > ~/.npmrc << EOF
@repyh-labs:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
EOF

echo "npm authentication configured"