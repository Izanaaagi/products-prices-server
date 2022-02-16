import { CrawlerCluster } from './crawler-cluster/crawler-cluster';
import { supermarkets } from './crawlers-config/supermarkets';
import { puppeteerOptions } from './crawlers-config/puppeteer-options';

const main = async (): Promise<void> => {
  const crawlerCluster = new CrawlerCluster(supermarkets, puppeteerOptions);
  await crawlerCluster.startClusters();
};

main();
