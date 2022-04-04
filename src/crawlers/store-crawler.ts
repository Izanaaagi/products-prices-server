import puppeteer, { Browser, Page } from 'puppeteer';
import { InitPuppeteerReturn } from '../interfaces/init-puppeteer';
import { PuppeteerOptions } from '../interfaces/puppeteer-options';
import { Database } from '../repository/database';

export class StoreCrawler {
  protected readonly url: string;
  private readonly options?: PuppeteerOptions;
  protected readonly database: Database;
  readonly storeTitle: string;

  constructor(url: string, storeTitle: string, options?: PuppeteerOptions) {
    this.url = url;
    this.storeTitle = storeTitle;
    this.options = options;
    this.database = new Database();
  }

  async start(): Promise<void> {
    const { browser } = await this.initPuppeteer(this.url);
    await browser.close();
  }

  async initPuppeteer(url: string): Promise<InitPuppeteerReturn> {
    const browser: Browser = await puppeteer.launch(this.options);
    const page: Page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });
    return { page, browser };
  }

  async clickCategoriesDropdown(page: Page, selector: string): Promise<void> {
    await page.$eval(selector, (button) => (button as HTMLLIElement).click());
  }

  async closeModal(page: Page, selector: string): Promise<void> {
    const closeButton = await page.$(selector);
    closeButton && (await closeButton.click());
  }

  async lazyScrollBottom(page: Page): Promise<void> {
    const bodyHandle = await page.$('.layout');
    const { height } = await bodyHandle.boundingBox();
    await bodyHandle.dispose();

    const viewportHeight = page.viewport().height;
    let viewportIncr = 0;
    while (viewportIncr + viewportHeight < height) {
      await page.evaluate((_viewportHeight) => {
        window.scrollBy(0, _viewportHeight);
      }, viewportHeight);
      viewportIncr = viewportIncr + viewportHeight;
    }
  }
}
