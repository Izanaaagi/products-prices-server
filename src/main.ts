import { ZakazUACrawler } from './crawlers/zakaz-ua-crawler';
import { crawlerOptions } from './puppeteer-options';
import { FileStorage } from './repository/file-storage';
import { Product } from './interfaces/product';

const main = async () => {
  const ekoCrawler: ZakazUACrawler = new ZakazUACrawler(
    'https://eko.zakaz.ua/',
    'eko',
    crawlerOptions
  );
  const fileStorage: FileStorage<Product> = new FileStorage<Product>();

  await ekoCrawler.start();

  for (const [key, value] of ekoCrawler.parsedData) {
    await fileStorage.writeJSON(ekoCrawler.storeTitle, key, value);
  }
};

main();
