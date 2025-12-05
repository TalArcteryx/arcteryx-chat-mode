const fs = require('fs');

// Read the HTML file
const html = fs.readFileSync('test.html', 'utf8');

// Extract product information using regex patterns
const products = [];

// Pattern to match product tiles
const productTilePattern = /<div id="([^"]+)"[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>[\s\S]*?<div[^>]*product-tile-name[^>]*>([^<]+)<\/div>[\s\S]*?<div[^>]*data-component="body1"[^>]*>([^<]+)<\/div>[\s\S]*?qa--product-tile__original-price[^>]*>([^<]+)<\/span>[\s\S]*?<span[^>]*>\((\d+)\)<\/span>/g;

let match;
while ((match = productTilePattern.exec(html)) !== null) {
  const [, id, url, name, description, price, ratingCount] = match;
  
  // Extract main product image (primary image)
  const mainImagePattern = /<img[^>]*class="[^"]*primary[^"]*"[^>]*(?:data-src|src)="([^"]+)"[^>]*>/i;
  const mainImageMatch = match[0].match(mainImagePattern);
  const mainImageUrl = mainImageMatch ? mainImageMatch[1].replace(/&amp;/g, '&') : null;
  
  // Extract hover image (alt-image)
  const hoverImagePattern = /<span[^>]*class="[^"]*alt-image[^"]*"[^>]*>[\s\S]*?<img[^>]*(?:data-src|src)="([^"]+)"[^>]*>/i;
  const hoverImageMatch = match[0].match(hoverImagePattern);
  const hoverImageUrl = hoverImageMatch ? hoverImageMatch[1].replace(/&amp;/g, '&') : null;
  
  // Extract colors/variants with their images
  const colorPattern = /qa--product-tile__thumbnail[^>]*>[\s\S]*?<img[^>]*alt="([^"]+)"[^>]*(?:data-src|src)="([^"]+)"[^>]*>/g;
  const colors = [];
  const colorImages = {};
  let colorMatch;
  while ((colorMatch = colorPattern.exec(match[0])) !== null) {
    const colorName = colorMatch[1];
    const colorImageUrl = colorMatch[2].replace(/&amp;/g, '&');
    colors.push(colorName);
    colorImages[colorName] = colorImageUrl;
  }
  
  // Extract badges/flags
  const badgePattern = /badge-label[^>]*>[\s\S]*?<p[^>]*>([^<]+)<\/p>/g;
  const badges = [];
  let badgeMatch;
  while ((badgeMatch = badgePattern.exec(match[0])) !== null) {
    badges.push(badgeMatch[1]);
  }
  
  // Extract rating percentage
  const ratingPattern = /style="width:\s*([\d.]+)%"/;
  const ratingMatch = match[0].match(ratingPattern);
  const ratingPercent = ratingMatch ? parseFloat(ratingMatch[1]) : null;
  
  // Determine category from name
  let category = 'other';
  const nameLower = name.toLowerCase();
  if (nameLower.includes('jacket')) category = 'jackets';
  else if (nameLower.includes('pant')) category = 'pants';
  else if (nameLower.includes('shirt') || nameLower.includes('hoody') || nameLower.includes('sweater')) category = 'shirts';
  else if (nameLower.includes('shoe') || nameLower.includes('boot')) category = 'footwear';
  else if (nameLower.includes('pack') || nameLower.includes('bag')) category = 'packs';
  else if (nameLower.includes('toque') || nameLower.includes('gaiter') || nameLower.includes('glove') || nameLower.includes('hat')) category = 'accessories';
  
  // Extract SKU from ID (last part)
  const sku = id.split('-').pop();
  
  // Get unique colors
  const uniqueColors = [...new Set(colors)];
  
  // Build images array with main, hover, and color variants
  const images = {
    main: mainImageUrl,
    hover: hoverImageUrl,
    colors: colorImages
  };
  
  products.push({
    id: id,
    sku: sku,
    name: name.trim(),
    description: description.trim(),
    category: category,
    gender: 'men',
    url: url,
    price: parseFloat(price.replace(/[^0-9.]/g, '')),
    currency: 'CAD',
    rating: {
      average: ratingPercent ? (ratingPercent / 20).toFixed(1) : null, // Convert percentage to 5-star scale
      count: parseInt(ratingCount) || 0,
      percentage: ratingPercent
    },
    colors: uniqueColors,
    images: images,
    badges: badges,
    isNew: badges.some(b => b.toLowerCase().includes('new')),
    isRevised: badges.some(b => b.toLowerCase().includes('revised')),
    fairTrade: badges.some(b => b.toLowerCase().includes('fair trade'))
  });
}

// Sort products by category and name
products.sort((a, b) => {
  if (a.category !== b.category) {
    return a.category.localeCompare(b.category);
  }
  return a.name.localeCompare(b.name);
});

// Create JSON structure
const productData = {
  metadata: {
    source: 'Arcteryx Men\'s Products',
    extractedAt: new Date().toISOString(),
    totalProducts: products.length
  },
  products: products
};

// Write to JSON file
fs.writeFileSync('src/data/mens-products.json', JSON.stringify(productData, null, 2));

console.log(`Extracted ${products.length} products`);
console.log(`Categories: ${[...new Set(products.map(p => p.category))].join(', ')}`);
console.log(`JSON file written to src/data/mens-products.json`);

