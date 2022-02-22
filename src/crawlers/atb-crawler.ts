import { StoreCrawler } from './store-crawler';
import { Browser, Page } from 'puppeteer';
import cheerio from 'cheerio';
import { Category } from '../interfaces/category';
import { Product } from '../interfaces/product';
import { Currency } from '../currency/currency';
import { IStoreCrawler } from '../interfaces/store-crawler';

export class AtbCrawler
  extends StoreCrawler
  implements IStoreCrawler<Array<string>>
{
  async start(): Promise<void> {
    const { page, browser } = await this.initPuppeteer(this.url);
    await this.clickCategoriesDropdown(page, '.catalog-button--store');
    const categoryLinks = await this.fetchCategoryLinks(page);
    await this.fetchProducts(browser, categoryLinks);
    await browser.close();
  }

  async fetchCategoryLinks(page: Page): Promise<Array<string>> {
    const categoryLinks: Array<string> = [];
    const html = await page.content();
    const $ = await cheerio.load(html);

    $('.category-menu__item').each((i, categoryItem) => {
      const href = $('a', categoryItem).attr('href');
      const categoryLink = `${this.url}${href}`;
      categoryLinks.push(categoryLink);
    });
    await page.close();
    return categoryLinks;
  }

  async fetchProducts(
    browser: Browser,
    categoryURLs: Array<string>
  ): Promise<void> {
    for (let i = 0; i < categoryURLs.length; i++) {
      const storeId: number = (await this.database.insertStore(this.storeTitle))
        .id;
      const newPage = await browser.newPage();
      await newPage.goto(categoryURLs[i], {
        waitUntil: 'domcontentloaded',
        timeout: 0,
      });
      const category: Category = await this.getCategoryTitle(
        newPage,
        '.page-title'
      );

      const categoryId: number = (
        await this.database.insertCategory(category.title)
      ).id;

      await this.confirmAge(newPage, '.custom-blue-btn.alcohol-modal__submit');

      let loadMore = await newPage.$('.product-pagination__more');
      while (loadMore) {
        await loadMore.click();
        await newPage.waitForSelector('.main-container--loading', {
          hidden: true,
        });
        loadMore = await newPage.$('.product-pagination__more');
      }

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

    $('.catalog-item.js-product-container').each((i, productItem) => {
      let price, discountPrice;
      const title = $('.catalog-item__title a', productItem).text().trim();
      const weight = this.removeExcessSymbols(
        $('.product-price__unit', productItem).text()
      );
      const isDiscount = !!$('.product-price__bottom', productItem).text();
      if (isDiscount) {
        price = Currency.toCoins(
          $('.product-price__bottom', productItem).attr('value')
        );
        discountPrice = Currency.toCoins(
          $('.product-price__top', productItem).attr('value')
        );
      } else {
        price = Currency.toCoins(
          $('.product-price__top', productItem).attr('value')
        );
      }
      products.push({
        title,
        weight,
        price,
        discountPrice,
        categoryId,
        storeId,
      });
    });

    return products;
  }

  private async getCategoryTitle(
    page: Page,
    selector: string
  ): Promise<Category> {
    return await page.$eval(selector, (titleElement) => ({
      title: titleElement.textContent,
    }));
  }

  private removeExcessSymbols(weight: string): string {
    const formattedWeight = weight.replace(/(\r\n|\n|\r|\s|\/)/gm, '');
    return Array.from(new Set(formattedWeight)).join('');
  }
}
