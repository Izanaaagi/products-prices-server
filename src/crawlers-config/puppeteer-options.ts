import { PuppeteerOptions } from '../interfaces/puppeteer-options';

const args = [
  '--blink-settings=imagesEnabled=false',
  '--disable-gpu',
  '--disable-dev-shm-usage',
  '--disable-setuid-sandbox',
  '--no-sandbox',
];

export const puppeteerOptions: PuppeteerOptions = {
  headless: true,
  args,
};
