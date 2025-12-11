import { Product, getProductDataByGender } from './dataLoader';

export interface ExtractProductsOptions {
  query: string;
  genderPreference: 'men' | 'women' | 'all' | null;
  conversationHistory?: string[];
  limit?: number;
}

export function extractProductsFromQuery(options: ExtractProductsOptions): Product[] {
  const { query, genderPreference, conversationHistory = [], limit = 6 } = options;
  
  const productsToSearch = getProductDataByGender(genderPreference);
  if (productsToSearch.length === 0) {
    return [];
  }

  const combinedText = [...conversationHistory, query].join(' ').toLowerCase();
  const extractedProducts: Product[] = [];

  // Check for "Top 10", "Top 5", or "Top 3" queries
  if (combinedText.includes('top 10') || combinedText.includes('top10') || combinedText.includes('top ten') || 
      combinedText.includes('top 5') || combinedText.includes('top5') || combinedText.includes('top five') ||
      combinedText.includes('top 3') || combinedText.includes('top3') || combinedText.includes('top three')) {
    let targetCategory: string | null = null;
    let targetGender: string | null = null;

    if (combinedText.includes('women') || combinedText.includes("women's") || combinedText.includes('womens')) {
      targetGender = 'women';
    } else if (combinedText.includes('men') || combinedText.includes("men's") || combinedText.includes('mens')) {
      targetGender = 'men';
    }

    if (combinedText.includes('jacket')) {
      targetCategory = 'jackets';
    } else if (combinedText.includes('pant')) {
      targetCategory = 'pants';
    } else if (combinedText.includes('shoe') || combinedText.includes('footwear')) {
      targetCategory = 'footwear';
    }

    let topProducts = [...productsToSearch];

    if (targetCategory) {
      topProducts = topProducts.filter((p) => {
        const pCategory = (p.category || '').toLowerCase();
        return pCategory === targetCategory ||
          (targetCategory === 'jackets' && (pCategory === 'jacket' || pCategory === 'jackets')) ||
          (targetCategory === 'pants' && (pCategory === 'pants' || pCategory === 'pant')) ||
          (targetCategory === 'footwear' && (pCategory === 'footwear' || pCategory === 'shoes' || pCategory === 'shoe'));
      });
    }

    if (targetGender) {
      topProducts = topProducts.filter((p) => {
        const pGender = (p.gender || '').toLowerCase();
        return pGender === targetGender || pGender === targetGender + "'s";
      });
    }

    const sortedProducts = topProducts
      .filter(p => p.rating?.average && parseFloat(p.rating.average) > 0)
      .sort((a, b) => {
        const ratingA = parseFloat(a.rating?.average || '0');
        const ratingB = parseFloat(b.rating?.average || '0');
        const countA = a.rating?.count || 0;
        const countB = b.rating?.count || 0;
        if (ratingB === ratingA) {
          return countB - countA;
        }
        return ratingB - ratingA;
      })
      .slice(0, 5);

    return sortedProducts;
  }

  // Check for "best seller" queries
  if (combinedText.includes('best seller') || combinedText.includes('bestseller') || combinedText.includes('best sellers')) {
    let sortedProducts = [...productsToSearch]
      .filter(p => p.rating?.average && parseFloat(p.rating.average) > 0)
      .sort((a, b) => {
        const ratingA = parseFloat(a.rating?.average || '0');
        const ratingB = parseFloat(b.rating?.average || '0');
        const countA = a.rating?.count || 0;
        const countB = b.rating?.count || 0;
        if (ratingB === ratingA) {
          return countB - countA;
        }
        return ratingB - ratingA;
      })
      .slice(0, limit);

    if (sortedProducts.length < limit) {
      const remaining = productsToSearch
        .filter(p => !sortedProducts.find(sp => sp.id === p.id))
        .filter(p => p.badges && p.badges.includes('New'))
        .slice(0, limit - sortedProducts.length);
      sortedProducts = [...sortedProducts, ...remaining];
    }

    return sortedProducts;
  }

  // Check for "Gift Guide"
  if (combinedText.includes('gift guide') || combinedText.includes('gift')) {
    let giftProducts = [...productsToSearch]
      .filter(p => p.rating?.average && parseFloat(p.rating.average) > 0)
      .sort((a, b) => {
        const ratingA = parseFloat(a.rating?.average || '0');
        const ratingB = parseFloat(b.rating?.average || '0');
        const countA = a.rating?.count || 0;
        const countB = b.rating?.count || 0;
        if (ratingB === ratingA) {
          return countB - countA;
        }
        return ratingB - ratingA;
      })
      .slice(0, limit);

    if (giftProducts.length < limit) {
      const newProducts = productsToSearch
        .filter(p => !giftProducts.find(gp => gp.id === p.id))
        .filter(p => p.badges && p.badges.includes('New'))
        .slice(0, limit - giftProducts.length);
      giftProducts = [...giftProducts, ...newProducts];
    }

    return giftProducts;
  }

  // Check for "New Arrivals"
  if (combinedText.includes('new arrivals') || combinedText.includes('new arrival')) {
    return productsToSearch
      .filter(p => p.badges && p.badges.includes('New'))
      .slice(0, limit);
  }

  // Check for general category keywords
  const generalCategoryKeywords: Record<string, string[]> = {
    clothing: ['clothing', 'clothes', 'apparel'],
    footwear: ['footwear', 'shoes', 'boots'],
    packs: ['packs', 'backpacks', 'backpack', 'pack'],
    accessories: ['accessories', 'accessory'],
  };

  for (const [key, keywords] of Object.entries(generalCategoryKeywords)) {
    if (keywords.some(keyword => combinedText.includes(keyword))) {
      const categoryProducts = productsToSearch
        .filter((p) => {
          const pCategory = (p.category || '').toLowerCase();
          return pCategory === key ||
            (key === 'clothing' && (pCategory === 'jackets' || pCategory === 'jacket' || pCategory === 'pants' || pCategory === 'pant' || pCategory === 'hoody' || pCategory === 'hoodie')) ||
            (key === 'footwear' && (pCategory === 'footwear' || pCategory === 'shoes' || pCategory === 'shoe')) ||
            (key === 'packs' && (pCategory === 'packs' || pCategory === 'pack' || pCategory === 'backpacks' || pCategory === 'backpack')) ||
            (key === 'accessories' && pCategory === 'accessories');
        })
        .slice(0, limit);

      if (categoryProducts.length > 0) {
        return categoryProducts;
      }
    }
  }

  // Check for specific category keywords
  const categoryKeywords: Record<string, string[]> = {
    jacket: ['jacket', 'shell', 'coat'],
    pant: ['pant', 'pants', 'trouser', 'trousers'],
    shoe: ['shoe', 'shoes', 'boot', 'boots', 'footwear'],
    toque: ['toque', 'hat', 'beanie', 'cap'],
    hoody: ['hoody', 'hoodie', 'sweater', 'sweatshirt'],
  };

  for (const [key, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => combinedText.includes(keyword))) {
      const categoryProducts = productsToSearch
        .filter((p) => {
          const pCategory = (p.category || '').toLowerCase();
          return pCategory === key ||
            (key === 'jacket' && pCategory === 'jackets') ||
            (key === 'pant' && (pCategory === 'pants' || pCategory === 'pant')) ||
            (key === 'shoe' && (pCategory === 'footwear' || pCategory === 'shoes')) ||
            (key === 'toque' && pCategory === 'accessories');
        })
        .slice(0, limit);

      if (categoryProducts.length > 0) {
        return categoryProducts;
      }
    }
  }

  return extractedProducts.slice(0, limit);
}

export function extractProductsFromText(
  text: string,
  products: Product[],
  userQuery: string
): Product[] {
  const textLower = text.toLowerCase();
  const queryLower = userQuery.toLowerCase();
  const extractedProducts: Product[] = [];

  // Check if AI is asking for clarification (don't show products)
  const clarificationPhrases = [
    'are you looking for',
    'men\'s or women\'s',
    'men or women',
    'which gender',
    'please clarify',
    'could you please confirm',
    'would you like',
    'do you want',
    'are you looking',
    'looking for men\'s or women\'s',
    'men\'s or women\'s products'
  ];

  const isAskingForClarification = clarificationPhrases.some(phrase =>
    textLower.includes(phrase)
  );

  if (isAskingForClarification) {
    return [];
  }

  // Extract products by name matching
  products.forEach((product) => {
    const productNameLower = product.name.toLowerCase();
    const productNameWithoutMens = productNameLower
      .replace(" men's", "")
      .replace(" men", "")
      .replace(" women's", "")
      .replace(" women", "")
      .trim();

    const nameParts = productNameWithoutMens.split(' ');
    const keyPart = nameParts.length > 1 ? nameParts.slice(0, 2).join(' ') : nameParts[0];

    if (textLower.includes(productNameLower) ||
      textLower.includes(productNameWithoutMens) ||
      (keyPart.length > 5 && textLower.includes(keyPart))) {
      if (!extractedProducts.find(p => p.id === product.id)) {
        extractedProducts.push(product);
      }
    }
  });

  // If no products found by name, try category matching
  if (extractedProducts.length === 0) {
    const categoryKeywords: Record<string, string[]> = {
      jacket: ['jacket', 'shell', 'coat', 'outerwear'],
      pant: ['pant', 'pants', 'trouser', 'trousers', 'bottoms'],
      shoe: ['shoe', 'shoes', 'boot', 'boots', 'footwear'],
      toque: ['toque', 'hat', 'beanie', 'cap', 'headwear'],
      hoody: ['hoody', 'hoodie', 'sweater', 'sweatshirt', 'mid-layer'],
    };

    const combinedText = (queryLower + ' ' + textLower).toLowerCase();

    for (const [key, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => combinedText.includes(keyword))) {
        const categoryProducts = products
          .filter((p) => {
            const pCategory = (p.category || '').toLowerCase();
            return pCategory === key ||
              (key === 'jacket' && (pCategory === 'jackets' || pCategory === 'jacket')) ||
              (key === 'pant' && (pCategory === 'pants' || pCategory === 'pant')) ||
              (key === 'shoe' && (pCategory === 'footwear' || pCategory === 'shoes' || pCategory === 'shoe')) ||
              (key === 'toque' && pCategory === 'accessories');
          })
          .slice(0, 6);

        categoryProducts.forEach((product) => {
          if (!extractedProducts.find(p => p.id === product.id)) {
            extractedProducts.push(product);
          }
        });
      }
    }
  }

  // Check for recommendation phrases
  const recommendationPhrases = [
    'i recommend',
    'here are',
    'these products',
    'check out',
    'consider',
    'suggest',
    'top picks',
    'best options'
  ];

  if (extractedProducts.length === 0 && recommendationPhrases.some(phrase => textLower.includes(phrase))) {
    const categoryKeywords: Record<string, string[]> = {
      jacket: ['jacket', 'shell', 'coat'],
      pant: ['pant', 'pants', 'trouser'],
      shoe: ['shoe', 'boot', 'footwear'],
      toque: ['toque', 'hat', 'beanie'],
      hoody: ['hoody', 'hoodie', 'sweater'],
    };

    for (const [key, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => queryLower.includes(keyword))) {
        const categoryProducts = products
          .filter((p) => {
            const pCategory = (p.category || '').toLowerCase();
            return pCategory === key ||
              (key === 'jacket' && pCategory === 'jackets') ||
              (key === 'pant' && pCategory === 'pants') ||
              (key === 'shoe' && pCategory === 'footwear') ||
              (key === 'toque' && pCategory === 'accessories');
          })
          .slice(0, 6);

        categoryProducts.forEach((product) => {
          if (!extractedProducts.find(p => p.id === product.id)) {
            extractedProducts.push(product);
          }
        });
      }
    }
  }

  return extractedProducts.slice(0, 6);
}

