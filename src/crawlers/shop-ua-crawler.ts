import { StoreCrawler } from './store-crawler';
import { Browser, Page } from 'puppeteer';
import { Store } from '../interfaces/store';
import { Category } from '../interfaces/category';
import { Product } from '../interfaces/product';
import cheerio from 'cheerio';
import { Currency } from '../currency/currency';
import { IStoreCrawler } from '../interfaces/store-crawler';

export class ShopUaCrawler
  extends StoreCrawler
  implements IStoreCrawler<Array<string>>
{
  async start(): Promise<void> {
    const { page, browser } = await this.initPuppeteer(this.url);
    await this.clickCategoriesDropdown(page, '.all-product_btn');
    const categoryLinks = await this.fetchCategoryLinks(page);
    await this.fetchProducts(browser, categoryLinks);
    await browser.close();
  }

  async fetchCategoryLinks(page: Page): Promise<Array<string>> {
    const categoryLinks: Array<string> = [];
    const categoriesCount: number = (await page.$$('.level_1 li')).length;

    for (let i = 1; i <= categoriesCount; i++) {
      const category = await page.$(`.level_1 > li:nth-child(${i})`);

      if (category) {
        await category.hover();

        let categoryLink = await page.$eval('.active li.capital a', (anchor) =>
          anchor.getAttribute('href')
        );

        categoryLink = `${this.url}${categoryLink}?to=200&from=1`;
        categoryLink && categoryLinks.push(categoryLink);

        await page.evaluate(() => window.scrollBy(0, 30));
      }
    }

    await page.close();
    return categoryLinks;
  }

  async fetchProducts(
    browser: Browser,
    categoryURLs: Array<string>
  ): Promise<void> {
    for (let i = 0; i < categoryURLs.length; i++) {
      const store: Store = { title: this.storeTitle };
      const newPage = await browser.newPage();
      await newPage.goto(categoryURLs[i], {
        waitUntil: 'networkidle2',
        timeout: 0,
      });
      const category: Category = await this.getCategoryTitle(newPage);

      await newPage.waitForSelector('.product-list-item');
      await this.lazyScrollBottom(newPage);

      const html = await newPage.content();

      const products: Array<Product> = await this.htmlToProducts(
        html,
        store,
        category
      );

      await this.repository.writeJSON(
        this.storeTitle,
        category.title,
        products
      );
      await newPage.close();
    }
  }

  async htmlToProducts(
    html: string,
    store: Store,
    category: Category
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

      products.push({
        title,
        weight,
        price,
        discountPrice,
        category,
        store,
      });
    });

    return products;
  }

  private async getCategoryTitle(page: Page): Promise<Category> {
    return await page.$eval('.bread-crumbs-link.last span', (titleElement) => ({
      title: titleElement.textContent,
    }));
  }
}
