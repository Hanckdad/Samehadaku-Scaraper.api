const axios = require('axios');
const cheerio = require('cheerio');
const db = require('./database');
const { delay, sanitizeHtml } = require('../utils/helpers');

const BASE_URL = 'https://samehadaku.li';

class SamehadakuScraper {
  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });
  }

  async fetchHTML(url) {
    try {
      console.log(`Fetching: ${url}`);
      const response = await this.client.get(url);
      return cheerio.load(response.data);
    } catch (error) {
      console.error(`Error fetching ${url}:`, error.message);
      throw new Error(`Failed to fetch: ${error.message}`);
    }
  }

  // Enhanced anime card scraper
  scrapeAnimeCards($, selector = '.animepost') {
    const cards = [];
    
    $(selector).each((index, element) => {
      try {
        const $el = $(element);
        const titleLink = $el.find('.entry-title a');
        const img = $el.find('img');
        
        const card = {
          title: titleLink.text().trim() || $el.find('.title').text().trim(),
          slug: this.extractSlug(titleLink.attr('href')),
          url: titleLink.attr('href'),
          thumbnail: img.attr('src') || img.attr('data-src'),
          episode: this.extractEpisode($el),
          score: $el.find('.score, .rating').text().trim(),
          type: $el.find('.type, .series').text().trim(),
          status: $el.find('.status, .completed').text().trim(),
          release: $el.find('.release, .year').text().trim()
        };

        // Clean up data
        Object.keys(card).forEach(key => {
          if (typeof card[key] === 'string') {
            card[key] = sanitizeHtml(card[key]);
          }
        });

        if (card.title && card.title !== '') {
          cards.push(card);
        }
      } catch (error) {
        console.error('Error parsing anime card:', error);
      }
    });
    
    return cards;
  }

  extractSlug(url) {
    if (!url) return '';
    const parts = url.split('/').filter(part => part !== '');
    return parts[parts.length - 1] || '';
  }

  extractEpisode($el) {
    const episodeText = $el.find('.episode, .eps, .ep').text().trim();
    const match = episodeText.match(/(\d+)/);
    return match ? match[1] : episodeText;
  }

  // Batch scraping dengan delay
  async batchScrapeAnime(slugs) {
    const results = [];
    
    for (const slug of slugs) {
      try {
        const detail = await this.getAnimeDetail(slug);
        results.push(detail);
        await delay(1000); // Delay 1 detik antara request
      } catch (error) {
        console.error(`Error scraping ${slug}:`, error.message);
        results.push({ slug, error: error.message });
      }
    }
    
    return results;
  }

  // Get recent episodes
  async getRecentEpisodes(page = 1) {
    const cacheKey = `recent_episodes_${page}`;
    const cached = db.get(cacheKey);
    if (cached) return cached;

    const $ = await this.fetchHTML(`/page/${page}/`);
    const episodes = [];

    $('.episode-list .item').each((index, element) => {
      const $el = $(element);
      const episode = {
        animeTitle: $el.find('.anime-title').text().trim(),
        episodeNumber: $el.find('.episode-number').text().trim(),
        episodeTitle: $el.find('.episode-title').text().trim(),
        url: $el.find('a').attr('href'),
        thumbnail: $el.find('img').attr('src'),
        time: $el.find('.time').text().trim()
      };

      if (episode.animeTitle) {
        episodes.push(episode);
      }
    });

    const result = episodes.slice(0, 24); // Limit to 24 episodes
    db.set(cacheKey, result, 180000); // Cache 3 minutes
    
    return result;
  }

  // Get anime recommendations
  async getRecommendations() {
    const $ = await this.fetchHTML('/');
    const recommendations = [];

    $('.recommendation, .widget-anime').each((index, element) => {
      const $el = $(element);
      const rec = {
        title: $el.find('.title').text().trim(),
        url: $el.find('a').attr('href'),
        thumbnail: $el.find('img').attr('src'),
        type: $el.find('.type').text().trim()
      };

      if (rec.title) {
        recommendations.push(rec);
      }
    });

    return recommendations.slice(0, 10);
  }

  // Get movie anime
  async getMovies(page = 1) {
    const $ = await this.fetchHTML(`/anime/?type=movie&page=${page}`);
    return this.scrapeAnimeCards($);
  }

  // Get anime by season
  async getAnimeBySeason(season, year) {
    const $ = await this.fetchHTML(`/anime/?season=${season}&year=${year}`);
    return this.scrapeAnimeCards($);
  }

  // Get anime by type
  async getAnimeByType(type, page = 1) {
    const $ = await this.fetchHTML(`/anime/?type=${type}&page=${page}`);
    return this.scrapeAnimeCards($);
  }

  // Enhanced streaming links dengan multiple providers
  async getEnhancedStreamingLinks(episodeUrl) {
    const $ = await this.fetchHTML(episodeUrl);
    const streamingData = {
      episodeTitle: $('.entry-title').text().trim(),
      animeTitle: $('.anime-title').text().trim(),
      providers: []
    };

    // Multiple streaming providers
    $('.streaming-provider, .mirrorstream').each((index, element) => {
      const $el = $(element);
      const provider = {
        name: $el.find('.provider-name').text().trim() || `Provider ${index + 1}`,
        qualities: []
      };

      $el.find('.quality-option, .download').each((i, qualEl) => {
        const $qual = $(qualEl);
        const quality = {
          name: $qual.find('strong').text().trim() || `${(i + 1) * 360}p`,
          links: []
        };

        $qual.find('a').each((j, linkEl) => {
          const $link = $(linkEl);
          quality.links.push({
            server: $link.text().trim(),
            url: $link.attr('href'),
            type: this.detectLinkType($link.attr('href'))
          });
        });

        if (quality.links.length > 0) {
          provider.qualities.push(quality);
        }
      });

      if (provider.qualities.length > 0) {
        streamingData.providers.push(provider);
      }
    });

    return streamingData;
  }

  detectLinkType(url) {
    if (!url) return 'unknown';
    
    if (url.includes('drive.google')) return 'google_drive';
    if (url.includes('mega.nz')) return 'mega';
    if (url.includes('mediafire')) return 'mediafire';
    if (url.includes('zippyshare')) return 'zippyshare';
    if (url.includes('uptobox')) return 'uptobox';
    if (url.includes('streaming')) return 'streaming';
    
    return 'direct';
  }
}

module.exports = new SamehadakuScraper();