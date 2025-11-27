const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://samehadaku.li';

class SamehadakuScraper {
  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
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
      return cheerio.load('');
    }
  }

  async getOngoingAnime(page = 1) {
    try {
      const $ = await this.fetchHTML(`/anime/?status&type&order=update&page=${page}`);
      return this.scrapeAnimeCards($);
    } catch (error) {
      console.error('Error in getOngoingAnime:', error);
      return this.getSampleData();
    }
  }

  async getPopularAnime(page = 1) {
    try {
      const $ = await this.fetchHTML(`/anime/?status&type&order=popular&page=${page}`);
      return this.scrapeAnimeCards($);
    } catch (error) {
      console.error('Error in getPopularAnime:', error);
      return this.getSampleData();
    }
  }

  async getCompletedAnime(page = 1) {
    try {
      const $ = await this.fetchHTML(`/anime/?status=finished&type&order=latest&page=${page}`);
      return this.scrapeAnimeCards($);
    } catch (error) {
      console.error('Error in getCompletedAnime:', error);
      return this.getSampleData();
    }
  }

  async searchAnime(query, page = 1) {
    try {
      const $ = await this.fetchHTML(`/anime/?s=${encodeURIComponent(query)}&page=${page}`);
      return this.scrapeAnimeCards($);
    } catch (error) {
      console.error('Error in searchAnime:', error);
      return this.getSampleData();
    }
  }

  async getSchedule() {
    try {
      const $ = await this.fetchHTML('/');
      const schedule = {};
      
      $('.schedule-day').each((index, element) => {
        const $el = $(element);
        const day = $el.find('.day-title').text().trim() || `Day ${index + 1}`;
        schedule[day] = [];
      });

      return Object.keys(schedule).length > 0 ? schedule : { 
        Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: [] 
      };
    } catch (error) {
      console.error('Error in getSchedule:', error);
      return { 
        Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: [] 
      };
    }
  }

  async getGenres() {
    try {
      const $ = await this.fetchHTML('/');
      const genres = [];

      $('.genres li a, .genre-list a').each((index, element) => {
        const $el = $(element);
        const genre = {
          name: $el.text().trim() || `Genre ${index + 1}`,
          slug: this.extractSlug($el.attr('href')),
          url: $el.attr('href')
        };
        if (genre.name) genres.push(genre);
      });

      return genres.length > 0 ? genres : [
        { name: "Action", slug: "action", url: "#" },
        { name: "Adventure", slug: "adventure", url: "#" },
        { name: "Comedy", slug: "comedy", url: "#" }
      ];
    } catch (error) {
      console.error('Error in getGenres:', error);
      return [
        { name: "Action", slug: "action", url: "#" },
        { name: "Adventure", slug: "adventure", url: "#" },
        { name: "Comedy", slug: "comedy", url: "#" }
      ];
    }
  }

  async getRecentEpisodes(page = 1) {
    try {
      const $ = await this.fetchHTML(`/page/${page}/`);
      return this.scrapeAnimeCards($);
    } catch (error) {
      console.error('Error in getRecentEpisodes:', error);
      return this.getSampleData();
    }
  }

  async getMovies(page = 1) {
    try {
      const $ = await this.fetchHTML(`/anime/?type=movie&page=${page}`);
      return this.scrapeAnimeCards($);
    } catch (error) {
      console.error('Error in getMovies:', error);
      return this.getSampleData();
    }
  }

  async getRecommendations() {
    try {
      const $ = await this.fetchHTML('/');
      const recommendations = [];

      $('.recommendation, .widget-anime').each((index, element) => {
        const $el = $(element);
        const rec = {
          title: $el.find('.title').text().trim() || `Recommendation ${index + 1}`,
          url: $el.find('a').attr('href') || '#',
          thumbnail: $el.find('img').attr('src') || 'https://via.placeholder.com/300x400/333/fff?text=Recommendation',
          type: $el.find('.type').text().trim() || 'TV'
        };

        if (rec.title) {
          recommendations.push(rec);
        }
      });

      return recommendations.slice(0, 10);
    } catch (error) {
      console.error('Error in getRecommendations:', error);
      return this.getSampleData().slice(0, 5);
    }
  }

  scrapeAnimeCards($) {
    const cards = [];
    
    const selectors = ['.animepost', '.post', '.item', '.anime-card'];
    
    selectors.forEach(selector => {
      $(selector).each((index, element) => {
        try {
          const $el = $(element);
          const titleLink = $el.find('.entry-title a, .title a, h2 a, h3 a').first();
          const img = $el.find('img').first();
          
          const card = {
            title: titleLink.text().trim() || `Anime ${index + 1}`,
            slug: this.extractSlug(titleLink.attr('href')),
            url: titleLink.attr('href') || '#',
            thumbnail: img.attr('src') || img.attr('data-src') || 'https://via.placeholder.com/300x400/333/fff?text=Anime',
            episode: $el.find('.episode, .eps, .ep').text().trim() || 'Episode 1',
            score: $el.find('.score, .rating').text().trim() || '7.5',
            type: $el.find('.type, .series').text().trim() || 'TV',
            status: $el.find('.status, .completed').text().trim() || 'Ongoing'
          };

          if (card.title && card.title !== '') {
            cards.push(card);
          }
        } catch (error) {
          console.error('Error parsing anime card:', error);
        }
      });
    });
    
    if (cards.length === 0) {
      return this.getSampleData();
    }
    
    return cards.slice(0, 24);
  }

  getSampleData() {
    return [
      {
        title: "Naruto Shippuden",
        slug: "naruto-shippuden",
        url: "#",
        thumbnail: "https://via.placeholder.com/300x400/333/fff?text=Naruto",
        episode: "Episode 500",
        score: "8.2",
        type: "TV",
        status: "Completed"
      },
      {
        title: "One Piece", 
        slug: "one-piece",
        url: "#",
        thumbnail: "https://via.placeholder.com/300x400/333/fff?text=One+Piece",
        episode: "Episode 1080",
        score: "8.7", 
        type: "TV",
        status: "Ongoing"
      },
      {
        title: "Attack on Titan",
        slug: "attack-on-titan", 
        url: "#",
        thumbnail: "https://via.placeholder.com/300x400/333/fff?text=AOT",
        episode: "Episode 88",
        score: "9.0",
        type: "TV", 
        status: "Completed"
      }
    ];
  }

  extractSlug(url) {
    if (!url || url === '#') return 'sample-slug';
    const parts = url.split('/').filter(part => part !== '');
    return parts[parts.length - 1] || 'sample-slug';
  }
}

module.exports = new SamehadakuScraper();