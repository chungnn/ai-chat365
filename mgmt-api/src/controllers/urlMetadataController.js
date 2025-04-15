const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Fetch metadata from a given URL
 * @route GET /api/url-metadata
 * @param {string} url - The URL to fetch metadata from
 * @returns {object} URL metadata including title, description, and image
 */
exports.getUrlMetadata = async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'URL is required'
      });
    }

    // Fetch the URL content
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
      image: $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content') || '',
      author: $('meta[name="author"]').attr('content') || $('meta[property="article:author"]').attr('content') || '',
      url: url
    };

    // Extract favicon if no image is available
    if (!metadata.image) {
      const favicon = $('link[rel="icon"]').attr('href') || $('link[rel="shortcut icon"]').attr('href');
      if (favicon) {
        // Handle relative URLs
        metadata.image = favicon.startsWith('http') ? favicon : new URL(favicon, url).href;
      }
    }

    return res.json(metadata);

  } catch (error) {
    console.error('Error fetching URL metadata:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch URL metadata',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
};
