const fs = require('fs');
const cheerio = require('cheerio');

// Read the HTML file
const html = fs.readFileSync('test-faq.html', 'utf-8');
const $ = cheerio.load(html);

const faqs = [];
let currentCategory = 'General';

// Find all accordions and match them to categories
$('.accordion').each((index, accordion) => {
  const $accordion = $(accordion);
  
  // Find the question
  const question = $accordion.find('.accordion__title p[data-component="subtitle1"]').text().trim();
  const $answerElement = $accordion.find('.accordion__content .sc-dSIIpw');
  
  if (question && $answerElement.length > 0) {
    // Extract answer text, handling paragraphs and lists
    let answer = '';
    const paragraphs = $answerElement.find('p[data-component="body1"]');
    
    paragraphs.each((idx, p) => {
      const text = $(p).text().trim();
      if (text) {
        if (idx > 0 && answer) answer += '\n\n';
        answer += text;
      }
    });
    
    // Handle lists
    $answerElement.find('ul').each((ulIdx, ul) => {
      const items = $(ul).find('li');
      if (items.length > 0) {
        if (answer) answer += '\n\n';
        items.each((liIdx, li) => {
          const itemText = $(li).text().trim();
          if (itemText) {
            answer += `• ${itemText}`;
            if (liIdx < items.length - 1) answer += '\n';
          }
        });
      }
    });
    
    // Determine category by finding the nearest h3 before this accordion
    let category = currentCategory;
    
    // Get all elements before this accordion
    const allElements = $('body').find('*');
    const accordionIndex = allElements.index($accordion);
    
    // Look backwards for the nearest h3
    for (let i = accordionIndex - 1; i >= 0; i--) {
      const elem = allElements.eq(i);
      if (elem.is('h3[data-component="H3"]')) {
        const categoryText = elem.text().trim();
        // Filter out empty h3s and the "Can't find" h3
        if (categoryText && 
            categoryText !== '' && 
            !categoryText.includes("Can't find") &&
            !categoryText.includes('About Arc')) {
          category = categoryText;
          currentCategory = category;
          break;
        }
      }
    }
    
    // Handle special case for "About Arc'teryx RESALE"
    if (category === currentCategory && question.toLowerCase().includes('resale')) {
      category = "About Arc'teryx RESALE";
    }
    
    faqs.push({
      id: `faq-${index + 1}`,
      category: category,
      question: question,
      answer: answer.trim()
    });
  }
});

// Group by category for better organization
const faqsByCategory = {};
faqs.forEach(faq => {
  if (!faqsByCategory[faq.category]) {
    faqsByCategory[faq.category] = [];
  }
  faqsByCategory[faq.category].push({
    id: faq.id,
    question: faq.question,
    answer: faq.answer
  });
});

const output = {
  metadata: {
    source: 'test-faq.html',
    extractedAt: new Date().toISOString(),
    totalFAQs: faqs.length,
    categories: Object.keys(faqsByCategory)
  },
  faqs: faqs,
  faqsByCategory: faqsByCategory
};

// Write to JSON file
fs.writeFileSync('src/data/faq.json', JSON.stringify(output, null, 2));
console.log(`✅ Extracted ${faqs.length} FAQs into src/data/faq.json`);
console.log(`   Categories: ${Object.keys(faqsByCategory).join(', ')}`);

