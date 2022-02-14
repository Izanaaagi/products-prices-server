import { ZakazUACrawler } from './crawlers/zakaz-ua-crawler';
import { puppeteerOptions } from './puppeteer-options';
import { FileStorage } from './repository/file-storage';
import { Product } from './interfaces/product';
import { StoreLanguage } from './enums/store-language';
import { cpus } from 'os';
import cluster from 'cluster';
import { StoreCrawler } from './crawlers/store-crawler';
import { AtbCrawler } from './crawlers/atb-crawler';
import { ShopUaCrawler } from './crawlers/shop-ua-crawler';
import { IStoreCrawler } from './interfaces/store-crawler';

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
    url: 'https://zakaz.atbmarket.com/',
    storeTitle: 'atb',
    crawlerType: CrawlerType.ATB,
  },
];

const crawlerWorker = async <T extends StoreCrawler>(
  crawler: T
): Promise<void> => {
  const fileStorage: FileStorage<Product> = new FileStorage<Product>();
  await crawler.start();
  for (const [key, value] of crawler.parsedData) {
    await fileStorage.writeJSON(crawler.storeTitle, key, value);
  }
};

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

    for (
      let crawlerIndex = 0;
      crawlerIndex < availableCpusCount;
      crawlerIndex++
    ) {
      const worker = cluster.fork();
      worker.send(supermarkets[crawlerIndex]);
      worker.on('exit', () => {
        console.log('worker end tasks');
        if (crawlerIndex < supermarketsCount) {
          crawlerIndex++;
          const worker = cluster.fork();
          worker.send(supermarkets[crawlerIndex]);
        }
      });
    }
  } else {
    console.log('worker start');
    process.on('message', async (supermarket: Supermarket): Promise<void> => {
      const crawler = crawlerGenerator(supermarket);
      await crawlerWorker(crawler);
      process.kill(process.pid);
    });
  }
};

main();
