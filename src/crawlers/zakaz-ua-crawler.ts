import { StoreCrawler } from './store-crawler';
import { Browser, Page } from 'puppeteer';
import cheerio from 'cheerio';
import { Store } from '../interfaces/store';
import { Category } from '../interfaces/category';
import { Product } from '../interfaces/product';
import { Currency } from '../currency/currency';
import { StoreLanguage } from '../enums/store-language';
import { PuppeteerOptions } from '../interfaces/puppeteer-options';
import { IStoreCrawler } from '../interfaces/store-crawler';

export class ZakazUACrawler
  extends StoreCrawler
  implements IStoreCrawler<Map<string, Array<string>>>
{
  private readonly language: StoreLanguage;

  constructor(
    url: string,
    storeTitle: string,
    options?: PuppeteerOptions,
    language = StoreLanguage.UK
  ) {
    super(url, storeTitle, options);
    this.language = language;
  }

  async start(): Promise<void> {
    const { browser, page } = await this.initPuppeteer(
      `${this.url}${this.language}`
    );
    const categoryLinks = await this.fetchCategoryLinks(page, browser);
    await this.fetchProducts(browser, categoryLinks);
    await browser.close();
  }

  async fetchCategoryLinks(
    page: Page,
    browser: Browser
  ): Promise<Map<string, Array<string>>> {
    const categoryLinks: Map<string, Array<string>> = new Map<
      string,
      Array<string>
    >();
    const html = await page.content();
    const $ = await cheerio.load(html);

    const categoryElements = $('.CategoriesMenu__list li').toArray();

    for (const categoryElement of categoryElements) {
      const title = $('.CategoriesMenuListItem__title', categoryElement).text();
      const linkElement = $('a', categoryElement);
      const href = linkElement.attr('href');
      const isWithChildren: boolean = linkElement
        .attr('class')
        .includes('CategoriesMenuListItem__link_withChildren');

      const categoryLink = `${this.url}${href}`;

      if (isWithChildren) {
        const childrenCategories = await this.fetchChildrenCategories(
          browser,
          categoryLink
        );
        categoryLinks.set(title, childrenCategories);
      } else {
        categoryLinks.set(title, [categoryLink]);
      }
    }
    await page.close();
    return categoryLinks;
  }

  async fetchChildrenCategories(
    browser: Browser,
    categoryLink: string
  ): Promise<Array<string>> {
    const childrenCategories: Array<string> = [];
    const categoriesPage: Page = await browser.newPage();
    await categoriesPage.goto(categoryLink);
    await categoriesPage.waitForSelector('.categories-box__list');
    const html = await categoriesPage.content();

    const $ = await cheerio.load(html);
    $('.categories-box__list-item').each((i, category) => {
      const linkElement = $('a', category);
      const href = linkElement.attr('href');

      const categoryLink = `${this.url}${href}`;
      childrenCategories.push(categoryLink);
    });

    await categoriesPage.close();
    return childrenCategories;
  }

  async fetchProducts(
    browser: Browser,
    categoryURLs: Map<string, Array<string>>
  ): Promise<void> {
    const store: Store = { title: this.storeTitle };

    for (const [title, urls] of categoryURLs) {
      const category: Category = { title };
      const products: Array<Product> = [];

      for (const url of urls) {
        const categoryPage = await browser.newPage();
        await categoryPage.goto(url);

        const childCategoryProducts = await this.htmlToProducts(
          categoryPage,
          category,
          store
        );
        products.push(...childCategoryProducts);
        await categoryPage.close();
      }

      this.parsedData.set(category.title, products);
    }
  }

  async htmlToProducts(
    page: Page,
    category: Category,
    store: Store
  ): Promise<Array<Product>> {
    const products: Array<Product> = [];

    await this.confirmAge(page, 'button[data-marker="Yes"]');

    const nextButtonSelector = 'a[aria-label="Next page"]';
    let nextButton = await page.$(nextButtonSelector);
    while (nextButton) {
      const thisPageProducts = await this.getPageProducts(
        page,
        category,
        store
      );
      products.push(...thisPageProducts);
      await nextButton.click();
      await page.waitForSelector(nextButtonSelector);
      const isDisabled = await page.$eval(
        nextButtonSelector,
        (button) => button.getAttribute('aria-disabled') === 'true'
      );
      nextButton = await page.$(nextButtonSelector);
      if (isDisabled) break;
    }

    return products;
  }

  async getPageProducts(
    page: Page,
    category: Category,
    store: Store
  ): Promise<Array<Product>> {
    const products: Array<Product> = [];
    await page.waitForSelector('.ProductsBox__list');
    const html = await page.content();
    const $ = cheerio.load(html);
    $('.ProductsBox__listItem').each((i, productItem) => {
      let weight: string, price: number | string, discountPrice: number;

      const title = $('.ProductTile__title', productItem).text();
      weight = $('.ProductTile__weight', productItem).text();
      weight = this.removeExcessSymbols(weight);

      const isDiscount = !!$('.Price__value_minor', productItem).text();
      if (isDiscount) {
        price = $('.Price__value_minor', productItem).text();
        discountPrice = Currency.toCoins(
          $('.Price__value_discount', productItem).text()
        );
      } else {
        price = $('.Price__value_caption', productItem).text();
      }

      price = Currency.toCoins(price);
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

  private removeExcessSymbols(weight: string): string {
    return weight.replace(/(\r\n|\n|\r|\s|[за])/gm, '');
  }
}
