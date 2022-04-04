import { Browser, Page } from 'puppeteer';
import { Product } from '../interfaces/product';
import cheerio from 'cheerio';
import { Currency } from '../currency/currency';
import { IStoreCrawler } from '../interfaces/store-crawler';
import { ShopUaCrawler } from './shop-ua-crawler';
import { Category } from '../interfaces/category';

export class ForaCrawler
  extends ShopUaCrawler
  implements IStoreCrawler<Array<string>>
{
  async start(): Promise<void> {
    const { page, browser } = await this.initPuppeteer(this.url);
    await this.closeModal(page, '.modal-closeButton');
    await this.clickCategoriesDropdown(page, '.all-product_btn');
    const categoryLinks = await this.fetchCategoryLinks(page);
    await this.fetchProducts(browser, categoryLinks);
    await browser.close();
  }

  async fetchProducts(
    browser: Browser,
    categoryURLs: Array<string>
  ): Promise<void> {
    const storeId: number = (await this.database.insertStore(this.storeTitle))
      .id;
    for (let i = 0; i < categoryURLs.length; i++) {
      const newPage = await browser.newPage();
      await newPage.goto(categoryURLs[i], {
        waitUntil: 'networkidle2',
        timeout: 0,
      });

      await this.closeModal(newPage, '.modal-closeButton');

      await newPage.waitForSelector('.bread-crumbs-link.last span');

      const category: Category = await this.getCategoryTitle(newPage);
      const categoryId: number = (
        await this.database.insertCategory(category.title)
      ).id;

      await newPage.waitForSelector('.product-title');
      await newPage.waitForTimeout(1000);
      await this.lazyScrollBottom(newPage);

      const html = await newPage.content();

      const products: Array<Product> = await this.htmlToProducts(
        html,
        storeId,
        categoryId
      );

      await this.database.insertProducts(products);

      await newPage.close();
    }
  }

  async htmlToProducts(
    html: string,
    storeId: number,
    categoryId: number
  ): Promise<Array<Product>> {
    const products: Array<Product> = [];

    const $ = await cheerio.load(html);

    $('.product-list-item').each((i, productItem) => {
      let priceInteger,
        priceFraction,
        discountPrice,
        discountPriceInteger,
        discountPriceFraction;

      const title = $('.product-title', productItem).text();
      const weight = $('.product-weight', productItem).text();

      if ($('.old-integer', productItem).text()) {
        priceInteger = $('.old-integer', productItem).text();
        priceFraction = $('.old-fraction', productItem).text();
        discountPriceInteger = $('.current-integer', productItem).text();
        discountPriceFraction = $('.current-fraction', productItem).text();
        discountPrice = Currency.toCoins(
          `${discountPriceInteger}.${discountPriceFraction}`
        );
      } else {
        priceInteger = $('.current-integer', productItem).text();
        priceFraction = $('.current-fraction', productItem).text();
      }
      const price = Currency.toCoins(`${priceInteger}.${priceFraction}`);

      if (price > 0) {
        products.push({
          title,
          weight,
          price,
          discountPrice,
          categoryId,
          storeId,
        });
      }
    });

    return products;
  }

  async closeModal(page: Page, selector: string): Promise<void> {
    const closeButton = await page.$(selector);
    closeButton && (await closeButton.click());
  }
}
