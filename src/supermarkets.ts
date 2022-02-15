import { Supermarket } from './interfaces/supermarket';
import { CrawlerType } from './enums/crawler-type';

export const supermarkets: Array<Supermarket> = [
  {
    url: 'https://shop.fora.ua',
    storeTitle: 'fora',
    crawlerType: CrawlerType.SHOP_UA,
  },
  {
    url: 'https://shop.silpo.ua',
    storeTitle: 'silpo',
    crawlerType: CrawlerType.SHOP_UA,
  },
  {
    url: 'https://zakaz.atbmarket.com',
    storeTitle: 'atb',
    crawlerType: CrawlerType.ATB,
  },
  {
    url: 'https://eko.zakaz.ua',
    storeTitle: 'eko',
    crawlerType: CrawlerType.ZAKAZ_UA,
  },
  {
    url: 'https://varus.zakaz.ua',
    storeTitle: 'varus',
    crawlerType: CrawlerType.ZAKAZ_UA,
  },
  {
    url: 'https://novus.zakaz.ua',
    storeTitle: 'novus',
    crawlerType: CrawlerType.ZAKAZ_UA,
  },
  {
    url: 'https://auchan.zakaz.ua',
    storeTitle: 'auchan',
    crawlerType: CrawlerType.ZAKAZ_UA,
  },
];