#!/bin/bash

# Rebranding Script
# Usage: ./rebrand.sh "NewProjectName" "newprojectname" "Your Tagline" "Your Description"

if [ $# -lt 4 ]; then
    echo "Usage: ./rebrand.sh \"NewProjectName\" \"newprojectname\" \"Your Tagline\" \"Your Description\""
    echo "Example: ./rebrand.sh \"MyApp\" \"myapp\" \"your personal assistant\" \"MyApp is your everyday assistant...\""
    exit 1
fi

NEW_BRAND_NAME="$1"
NEW_BRAND_NAME_LOWER="$2"
NEW_TAGLINE="$3"
NEW_DESCRIPTION="$4"

echo "Rebranding to: $NEW_BRAND_NAME"
echo "This will replace:"
echo "  - PropFind → $NEW_BRAND_NAME"
echo "  - propfind → $NEW_BRAND_NAME_LOWER"
echo "  - propfind.ai → $NEW_BRAND_NAME_LOWER"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Find and replace in files
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.json" -o -name "*.md" \) \
    ! -path "./node_modules/*" \
    ! -path "./.git/*" \
    ! -path "./rebrand.sh" \
    -exec sed -i '' \
    -e "s/PropFind/$NEW_BRAND_NAME/g" \
    -e "s/propfind/$NEW_BRAND_NAME_LOWER/g" \
    -e "s/propfind\.ai/$NEW_BRAND_NAME_LOWER/g" \
    {} +

# Specific replacements in page.tsx
if [ -f "src/app/page.tsx" ]; then
    sed -i '' "s/your personal real estate assistant/$NEW_TAGLINE/g" "src/app/page.tsx"
    sed -i '' "s/PropFind\.ai is your everyday assistant for making real estate simple, from buying and renting to investing and analysis\./$NEW_DESCRIPTION/g" "src/app/page.tsx"
fi

# Update package.json name
if [ -f "package.json" ]; then
    sed -i '' "s/\"name\": \"[^\"]*\"/\"name\": \"$NEW_BRAND_NAME_LOWER\"/g" "package.json"
fi

# Update layout.tsx metadata
if [ -f "src/app/layout.tsx" ]; then
    sed -i '' "s/title: \"[^\"]*\"/title: \"$NEW_BRAND_NAME\"/g" "src/app/layout.tsx"
    sed -i '' "s/description: \"[^\"]*\"/description: \"$NEW_DESCRIPTION\"/g" "src/app/layout.tsx"
fi

echo ""
echo "✅ Rebranding complete!"
echo ""
echo "⚠️  Don't forget to:"
echo "   1. Replace public/logo.jpg with your new logo"
echo "   2. Review and update colors in src/app/globals.css if needed"
echo "   3. Update README.md with your project details"
echo "   4. Check all files for any remaining references"
echo "   5. Run 'npm install' to update package-lock.json"

