import { PuppeteerOptions } from '../interfaces/puppeteer-options';

const args = ['--blink-settings=imagesEnabled=false'];

export const puppeteerOptions: PuppeteerOptions = {
  headless: true,
  args,
};
