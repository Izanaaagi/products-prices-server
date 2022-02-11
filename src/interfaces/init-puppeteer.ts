import { Browser, Page } from 'puppeteer';

export interface InitPuppeteerReturn {
  page: Page;
  browser: Browser;
}
