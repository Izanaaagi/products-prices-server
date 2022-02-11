import {
  BrowserConnectOptions,
  BrowserLaunchArgumentOptions,
  LaunchOptions,
} from 'puppeteer';

export interface PuppeteerOptions
  extends LaunchOptions,
    BrowserLaunchArgumentOptions,
    BrowserConnectOptions {}
