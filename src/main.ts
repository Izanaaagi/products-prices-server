import { CrawlerCluster } from './crawler-cluster/crawler-cluster';
import { supermarkets } from './supermarkets';
import { puppeteerOptions } from './puppeteer-options';

const main = async (): Promise<void> => {
  const crawlerCluster = new CrawlerCluster(supermarkets, puppeteerOptions);
  await crawlerCluster.startClusters();
};

main();
