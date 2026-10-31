const axios = require("axios");
const cheerio = require("cheerio");
const { URL } = require("url");

class WebsiteScraper {
  constructor(baseUrl, maxPages = 4) {
    this.baseUrl = baseUrl;
    this.maxPages = maxPages;
    this.visitedUrls = new Set();
    this.extractedArticles = [];

    const parsed = new URL(baseUrl);
    this.domain = parsed.hostname;
    this.origin = parsed.origin;
  }

  normalizeUrl(rawLink) {
    try {
      const fullUrl = new URL(rawLink, this.origin);
      fullUrl.hash = "";
      fullUrl.search = "";
      const cleanUrl = fullUrl.toString().replace(/\/$/, "");
      if (fullUrl.hostname === this.domain) {
        return cleanUrl;
      }
      return null;
    } catch {
      return null;
    }
  }

  parseContent(html, pageUrl) {
    const $ = cheerio.load(html);

    // Strip scripts, styles, navigation, footer, svgs
    $(
      "script, style, noscript, nav, footer, header, svg, iframe, form, button",
    ).remove();

    const pageTitle =
      $('meta[property="og:title"]').attr("content") ||
      $("title").text().trim() ||
      $("h1").first().text().trim() ||
      pageUrl;

    // Extract structured sections
    const sections = [];
    $("h1, h2, h3, h4").each((_, element) => {
      const heading = $(element).text().replace(/\s+/g, " ").trim();
      if (!heading || heading.length < 3) return;

      let textContent = "";
      let nextElem = $(element).next();

      // Read sibling text
      let steps = 0;
      while (nextElem.length && !nextElem.is("h1, h2, h3, h4") && steps < 6) {
        const text = nextElem.text().replace(/\s+/g, " ").trim();
        if (text.length > 20) {
          textContent += " " + text;
        }
        nextElem = nextElem.next();
        steps++;
      }

      if (textContent.trim().length > 30) {
        sections.push({ heading, content: textContent.trim() });
      }
    });

    // Fallback: If headings don't have direct siblings, grab entire body text
    const wholeBodyText = $("main, article, #content, .content, body")
      .first()
      .text()
      .replace(/\s+/g, " ")
      .trim();

    return {
      url: pageUrl,
      title: pageTitle,
      sections,
      fallbackText: wholeBodyText.slice(0, 5000), // First 5000 chars of actual content
    };
  }

  async crawl(currentUrl, depth = 0) {
    if (
      this.visitedUrls.size >= this.maxPages ||
      this.visitedUrls.has(currentUrl) ||
      depth > 2
    ) {
      return;
    }

    this.visitedUrls.add(currentUrl);

    try {
      console.log(`[Crawler] Fetching: ${currentUrl}`);
      const response = await axios.get(currentUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        timeout: 12000,
      });

      const contentType = response.headers["content-type"] || "";
      if (!contentType.includes("text/html")) return;

      const pageData = this.parseContent(response.data, currentUrl);
      if (pageData.sections.length > 0 || pageData.fallbackText.length > 80) {
        this.extractedArticles.push(pageData);
      }

      // Discover internal links
      const $ = cheerio.load(response.data);
      const linksToVisit = [];

      $("a[href]").each((_, el) => {
        const href = $(el).attr("href");
        const normalized = this.normalizeUrl(href);
        if (
          normalized &&
          !this.visitedUrls.has(normalized) &&
          !normalized.match(/\.(pdf|zip|jpg|jpeg|png|webp|svg|css|js|mp4)$/i)
        ) {
          linksToVisit.push(normalized);
        }
      });

      for (const nextLink of linksToVisit) {
        if (this.visitedUrls.size >= this.maxPages) break;
        await this.crawl(nextLink, depth + 1);
      }
    } catch (err) {
      console.warn(`[Crawler] Warning at ${currentUrl}: ${err.message}`);
    }
  }
}

module.exports = WebsiteScraper;
