import { PuppeteerOptions } from './interfaces/puppeteer-options';

const args = ['--blink-settings=imagesEnabled=false'];

export const crawlerOptions: PuppeteerOptions = {
  headless: true,
  args,
};
