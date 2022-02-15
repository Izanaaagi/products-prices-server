import { ZakazUACrawler } from './crawlers/zakaz-ua-crawler';
import { puppeteerOptions } from './puppeteer-options';
import { StoreLanguage } from './enums/store-language';
import { cpus } from 'os';
import cluster, { worker } from 'cluster';
import { StoreCrawler } from './crawlers/store-crawler';
import { AtbCrawler } from './crawlers/atb-crawler';
import { ShopUaCrawler } from './crawlers/shop-ua-crawler';

enum CrawlerType {
  SHOP_UA,
  ATB,
  ZAKAZ_UA,
}

interface Supermarket {
  url: string;
  storeTitle: string;
  language?: StoreLanguage;
  crawlerType: CrawlerType;
}

const supermarkets: Array<Supermarket> = [
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
];

const generateCrawlers = (
  supermarkets: Array<Supermarket>
): Array<StoreCrawler> => {
  const crawlers: Array<StoreCrawler> = [];
  supermarkets.forEach((supermarket) =>
    crawlers.push(crawlerGenerator(supermarket))
  );
  return crawlers;
};

const crawlerGenerator = (supermarket: Supermarket): StoreCrawler => {
  switch (supermarket.crawlerType) {
    case CrawlerType.ZAKAZ_UA:
      return new ZakazUACrawler(
        supermarket.url,
        supermarket.storeTitle,
        puppeteerOptions
      );
    case CrawlerType.SHOP_UA:
      return new ShopUaCrawler(
        supermarket.url,
        supermarket.storeTitle,
        puppeteerOptions
      );
    case CrawlerType.ATB:
      return new AtbCrawler(
        supermarket.url,
        supermarket.storeTitle,
        puppeteerOptions
      );
  }
};

const main = async (): Promise<void> => {
  if (cluster.isMaster) {
    const availableCpusCount = cpus().length - 1;
    const supermarketsCount = supermarkets.length;
    let crawlerIndex = 0;

    for (let i = 0; i < availableCpusCount; i++) {
      const worker = cluster.fork();
      worker.send(supermarkets[crawlerIndex]);
      crawlerIndex++;
    }

    cluster.on('exit', (worker) => {
      console.log(`worker ${worker.process.pid} died`);
      if (crawlerIndex < supermarketsCount) {
        const newWorker = cluster.fork();
        newWorker.send(supermarkets[crawlerIndex]);
        crawlerIndex++;
      }
    });
  } else {
    console.log(`worker ${process.pid} started`);
    process.on('message', async (supermarket: Supermarket): Promise<void> => {
      const crawler = crawlerGenerator(supermarket);
      await crawler.start();
      process.kill(process.pid);
    });
  }
};

main();
