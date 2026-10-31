const axios = require("axios");
const cheerio = require("cheerio");
const { URL } = require("url");

class WebsiteScraper {
  constructor(baseUrl, maxPages = 6) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.maxPages = maxPages;
    this.visitedUrls = new Set();
    this.extractedArticles = [];

    const parsed = new URL(this.baseUrl);
    // Strip leading 'www.' to match both 'olive.in' and 'www.olive.in'
    this.rootDomain = parsed.hostname.replace(/^www\./i, "");
    this.origin = parsed.origin;
  }

  normalizeUrl(rawLink, currentOrigin) {
    try {
      // Resolve relative and absolute links against current page origin
      const fullUrl = new URL(rawLink, currentOrigin || this.origin);
      fullUrl.hash = "";
      fullUrl.search = "";

      const cleanUrl = fullUrl.toString().replace(/\/+$/, "");
      const linkHost = fullUrl.hostname.replace(/^www\./i, "");

      // Accept same domain and subdomains under the root domain
      if (
        linkHost === this.rootDomain ||
        linkHost.endsWith(`.${this.rootDomain}`)
      ) {
        return cleanUrl;
      }
      return null;
    } catch {
      return null;
    }
  }

  parseContent($, pageUrl) {
    // Clone body or extract before destruction
    const pageTitle =
      $('meta[property="og:title"]').attr("content") ||
      $("title").text().trim() ||
      $("h1").first().text().trim() ||
      pageUrl;

    // Strip noisy elements after links are already collected
    $(
      "script, style, noscript, nav, footer, header, svg, iframe, form, button, [role='dialog']",
    ).remove();

    // Extract structured sections
    const sections = [];
    $("h1, h2, h3, h4").each((_, element) => {
      const heading = $(element).text().replace(/\s+/g, " ").trim();
      if (!heading || heading.length < 3) return;

      let textContent = "";
      let nextElem = $(element).next();

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

    // Fallback: If headings don't have direct siblings, grab entire main/body text
    const wholeBodyText = $("main, article, #content, .content, body")
      .first()
      .text()
      .replace(/\s+/g, " ")
      .trim();

    return {
      url: pageUrl,
      title: pageTitle,
      sections,
      fallbackText: wholeBodyText.slice(0, 6000),
    };
  }

  async crawl(startUrl) {
    // Breadth-First Search (Queue) prevents call-stack issues and handles page limits cleanly
    const queue = [startUrl];

    while (queue.length > 0 && this.visitedUrls.size < this.maxPages) {
      const currentUrl = queue.shift();

      const normalizedCurrent = this.normalizeUrl(currentUrl);
      if (!normalizedCurrent || this.visitedUrls.has(normalizedCurrent)) {
        continue;
      }

      this.visitedUrls.add(normalizedCurrent);

      try {
        console.log(`[Crawler] Fetching: ${normalizedCurrent}`);
        const response = await axios.get(normalizedCurrent, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
          },
          timeout: 10000,
          maxRedirects: 5,
        });

        const contentType = response.headers["content-type"] || "";
        if (!contentType.includes("text/html")) continue;

        const $ = cheerio.load(response.data);

        // 1. Discover links FIRST before deleting nav / header elements
        const currentOrigin = new URL(
          response.request?.res?.responseUrl || normalizedCurrent,
        ).origin;

        $("a[href]").each((_, el) => {
          const href = $(el).attr("href");
          if (!href) return;

          const link = this.normalizeUrl(href, currentOrigin);
          if (
            link &&
            !this.visitedUrls.has(link) &&
            !queue.includes(link) &&
            !link.match(/\.(pdf|zip|jpg|jpeg|png|webp|svg|css|js|mp4|ico)$/i)
          ) {
            queue.push(link);
          }
        });

        // 2. Parse text content
        const pageData = this.parseContent($, normalizedCurrent);
        if (pageData.sections.length > 0 || pageData.fallbackText.length > 80) {
          this.extractedArticles.push(pageData);
        }
      } catch (err) {
        console.warn(
          `[Crawler] Warning at ${normalizedCurrent}: ${err.message}`,
        );
      }
    }
  }
}

module.exports = WebsiteScraper;
