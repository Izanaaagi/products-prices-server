import { Browser, Page } from 'puppeteer';

export interface IStoreCrawler<Type> {
  start: () => Promise<void>;

  fetchCategoryLinks: (page: Page, browser?: Browser) => Promise<Type>;

  fetchProducts: (browser: Browser, categoryURLs: Type) => Promise<void>;
}
