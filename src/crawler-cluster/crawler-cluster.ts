import { cpus } from 'os';
import { Supermarket } from '../interfaces/supermarket';
import cluster from 'cluster';
import { StoreCrawler } from '../crawlers/store-crawler';
import { CrawlerType } from '../enums/crawler-type';
import { ZakazUACrawler } from '../crawlers/zakaz-ua-crawler';
import { ShopUaCrawler } from '../crawlers/shop-ua-crawler';
import { AtbCrawler } from '../crawlers/atb-crawler';
import { PuppeteerOptions } from '../interfaces/puppeteer-options';

export class CrawlerCluster {
  private readonly availableCpusCount: number;
  private supermarketIndex: number;
  private readonly supermarkets: Array<Supermarket>;
  private readonly supermarketsCount: number;
  private readonly puppeteerOptions: PuppeteerOptions;

  constructor(
    supermarkets: Array<Supermarket>,
    puppeteerOptions?: PuppeteerOptions
  ) {
    this.supermarkets = supermarkets;
    this.supermarketsCount = supermarkets.length;
    this.availableCpusCount = cpus().length - 1;
    this.supermarketIndex = 0;
    this.puppeteerOptions = puppeteerOptions;
  }

  async startClusters(): Promise<void> {
    console.log('Start crawling');
    if (cluster.isMaster) {
      while (this.supermarketIndex < this.availableCpusCount) {
        const worker = cluster.fork();
        worker.send(this.supermarkets[this.supermarketIndex]);
        this.supermarketIndex++;
      }

      cluster.on('exit', (worker) => {
        console.log(`worker ${worker.process.pid} died`);
        if (this.supermarketIndex < this.supermarketsCount) {
          const newWorker = cluster.fork();
          newWorker.send(this.supermarkets[this.supermarketIndex]);
          this.supermarketIndex++;
        } else {
          console.log('Crawling finished');
        }
      });
    } else {
      console.log(`worker ${process.pid} started`);
      process.on('message', async (supermarket: Supermarket): Promise<void> => {
        const crawler = this.crawlerGenerator(supermarket);
        await crawler.start();
        process.kill(process.pid);
      });
    }
  }

  private crawlerGenerator(supermarket: Supermarket): StoreCrawler {
    switch (supermarket.crawlerType) {
      case CrawlerType.ZAKAZ_UA:
        return new ZakazUACrawler(
          supermarket.url,
          supermarket.storeTitle,
          this.puppeteerOptions
        );
      case CrawlerType.SHOP_UA:
        return new ShopUaCrawler(
          supermarket.url,
          supermarket.storeTitle,
          this.puppeteerOptions
        );
      case CrawlerType.ATB:
        return new AtbCrawler(
          supermarket.url,
          supermarket.storeTitle,
          this.puppeteerOptions
        );
    }
  }
}
