const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Controller for URL metadata extraction
 */
exports.fetchUrlMetadata = async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }
    console.log('Fetching metadata for URL:', url);
    const metadata = await extractMetadata(url);
    return res.json(metadata);
  } catch (error) {
    console.error('Error fetching URL metadata:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch URL metadata',
      message: error.message
    });
  }
};

/**
 * Extract metadata from a URL
 * @param {string} url - The URL to extract metadata from
 * @returns {Object} - The extracted metadata
 */
async function extractMetadata(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 5000
    });
    
    const html = response.data;
    const $ = cheerio.load(html);
    
    // Extract metadata
    const metadata = {
      title: $('title').text() || $('meta[property="og:title"]').attr('content') || '',
      description: $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '',
      image: $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content') || findFirstImage($),
      url: url,
      siteName: $('meta[property="og:site_name"]').attr('content') || new URL(url).hostname,
    };
    
    return metadata;
  } catch (error) {
    console.error(`Error extracting metadata from ${url}:`, error);
    // Return basic metadata if extraction fails
    return {
      title: new URL(url).pathname.split('/').pop() || new URL(url).hostname,
      description: '',
      image: '',
      url: url,
      siteName: new URL(url).hostname
    };
  }
}

/**
 * Find the first significant image in the HTML
 * @param {Object} $ - Cheerio instance
 * @returns {string} - URL of the first significant image
 */
function findFirstImage($) {
  // Look for article images or significant images
  const images = $('article img, .content img, .post img, main img');
  
  if (images.length > 0) {
    // Get the first image that has a src attribute
    for (let i = 0; i < images.length; i++) {
      const src = $(images[i]).attr('src');
      if (src && src.length > 10) {
        // Make sure the image URL is absolute
        if (src.startsWith('http')) {
          return src;
        }
      }
    }
  }
  
  return '';
}
