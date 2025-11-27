const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://samehadaku.li';

class SamehadakuScraper {
  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
  }

  async fetchHTML(url) {
    try {
      const response = await this.client.get(url);
      return cheerio.load(response.data);
    } catch (error) {
      throw new Error(`Failed to fetch: ${error.message}`);
    }
  }

  // Anime Card scraper
  async scrapeAnimeCards(selector) {
    const $ = await this.fetchHTML('/');
    const cards = [];
    
    $(selector).each((index, element) => {
      const $el = $(element);
      const card = {
        title: $el.find('.entry-title a').text().trim(),
        slug: $el.find('.entry-title a').attr('href')?.split('/').filter(Boolean).pop(),
        url: $el.find('.entry-title a').attr('href'),
        thumbnail: $el.find('img').attr('src'),
        episode: $el.find('.episode').text().trim(),
        score: $el.find('.score').text().trim(),
        type: $el.find('.type').text().trim(),
        status: $el.find('.status').text().trim()
      };
      
      if (card.title) cards.push(card);
    });
    
    return cards;
  }

  // Ongoing anime
  async getOngoingAnime(page = 1) {
    const $ = await this.fetchHTML(`/anime/?status&type&order=update&page=${page}`);
    return this.scrapeAnimeCards('.animepost');
  }

  // Completed anime
  async getCompletedAnime(page = 1) {
    const $ = await this.fetchHTML(`/anime/?status=finished&type&order=latest&page=${page}`);
    return this.scrapeAnimeCards('.animepost');
  }

  // Popular anime
  async getPopularAnime(page = 1) {
    const $ = await this.fetchHTML(`/anime/?status&type&order=popular&page=${page}`);
    return this.scrapeAnimeCards('.animepost');
  }

  // Search anime
  async searchAnime(query, page = 1) {
    const $ = await this.fetchHTML(`/anime/?s=${encodeURIComponent(query)}&page=${page}`);
    return this.scrapeAnimeCards('.animepost');
  }

  // Anime detail
  async getAnimeDetail(slug) {
    const $ = await this.fetchHTML(`/anime/${slug}/`);
    
    const detail = {
      title: $('.entry-title').text().trim(),
      japaneseTitle: $('.japanese').text().trim(),
      thumbnail: $('.thumb img').attr('src'),
      rating: $('.rating .num').text().trim(),
      synopsis: $('.synopsis').text().trim(),
      information: {},
      episodeList: []
    };

    // Scrape anime information
    $('.infozingle p').each((index, element) => {
      const text = $(element).text();
      if (text.includes(':')) {
        const [key, ...value] = text.split(':');
        detail.information[key.trim()] = value.join(':').trim();
      }
    });

    // Scrape episode list
    $('.eps li').each((index, element) => {
      const $el = $(element);
      const episode = {
        number: $el.find('.numep').text().trim(),
        title: $el.find('.lchx a').text().trim(),
        url: $el.find('.lchx a').attr('href'),
        date: $el.find('.date').text().trim()
      };
      detail.episodeList.push(episode);
    });

    return detail;
  }

  // Get streaming links
  async getStreamingLinks(episodeUrl) {
    const $ = await this.fetchHTML(episodeUrl);
    const streamingLinks = [];

    $('.mirrorstream .download').each((index, element) => {
      const $el = $(element);
      const quality = $el.find('strong').text().trim();
      const links = [];

      $el.find('a').each((i, link) => {
        links.push({
          provider: $(link).text().trim(),
          url: $(link).attr('href')
        });
      });

      streamingLinks.push({
        quality,
        links
      });
    });

    return streamingLinks;
  }

  // Get genres
  async getGenres() {
    const $ = await this.fetchHTML('/');
    const genres = [];

    $('.genres li a').each((index, element) => {
      const $el = $(element);
      genres.push({
        name: $el.text().trim(),
        slug: $el.attr('href')?.split('/').filter(Boolean).pop(),
        url: $el.attr('href')
      });
    });

    return genres;
  }

  // Get anime by genre
  async getAnimeByGenre(genreSlug, page = 1) {
    const $ = await this.fetchHTML(`/genres/${genreSlug}/page/${page}/`);
    return this.scrapeAnimeCards('.animepost');
  }

  // Get schedule
  async getSchedule() {
    const $ = await this.fetchHTML('/');
    const schedule = {};
    
    $('.schedule-day').each((index, element) => {
      const $el = $(element);
      const day = $el.find('.day-title').text().trim();
      const animes = [];

      $el.find('.anime-schedule').each((i, animeEl) => {
        const $anime = $(animeEl);
        animes.push({
          title: $anime.find('.anime-title').text().trim(),
          time: $anime.find('.anime-time').text().trim(),
          episode: $anime.find('.anime-episode').text().trim(),
          url: $anime.find('a').attr('href')
        });
      });

      schedule[day] = animes;
    });

    return schedule;
  }
}

module.exports = new SamehadakuScraper();