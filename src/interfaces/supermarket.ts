import { StoreLanguage } from '../enums/store-language';
import { CrawlerType } from '../enums/crawler-type';

export interface Supermarket {
  url: string;
  storeTitle: string;
  language?: StoreLanguage;
  crawlerType: CrawlerType;
}