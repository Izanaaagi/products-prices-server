import dotenv from 'dotenv';
import { Database } from './repository/database';
import { Server } from './api/server';
import cron from 'node-cron';
import { CrawlerCluster } from './crawler-cluster/crawler-cluster';
import { puppeteerOptions } from './crawlers-config/puppeteer-options';
import { supermarkets } from './crawlers-config/supermarkets';

dotenv.config();

const main = async (): Promise<void> => {
  const database = new Database();
  const server = new Server(database);
  server.start();

  const crawlerCluster = new CrawlerCluster(supermarkets, puppeteerOptions);
  await crawlerCluster.startClusters();

  cron.schedule('0 0 * * *', async () => {
    await database.clear();
    const crawlerCluster = new CrawlerCluster(supermarkets, puppeteerOptions);
    await crawlerCluster.startClusters();
  });
};

main();
