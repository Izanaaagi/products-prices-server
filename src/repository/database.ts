import { Store } from '../interfaces/store';
import { Category } from '../interfaces/category';
import { knex, Knex } from 'knex';
import config from '../../knexfile';
import { Product } from '../interfaces/product';
import Raw = Knex.Raw;

export class Database {
  private pg: Knex;

  constructor() {
    this.pg = knex(config[process.env.NODE_ENV]);
  }

  async insertStore(title: string): Promise<Store> {
    const [storesResult] = await this.pg('stores')
      .insert<Store>({ title })
      .onConflict('title')
      .merge()
      .returning('*');
    return storesResult;
  }

  async insertCategory(title: string): Promise<Category> {
    const [categoriesResult] = await this.pg('categories')
      .insert<Store>({ title })
      .onConflict('title')
      .merge()
      .returning('*');
    return categoriesResult;
  }

  async insertProducts(products: Array<Product>): Promise<void> {
    if (products.length !== 0) {
      await this.pg('products')
        .insert<Product>(products)
        .onConflict(['title', 'store_id'])
        .ignore();
    }
  }

  async getAllStores(): Promise<Array<Store>> {
    return this.pg.select().table<Store>('stores');
  }

  async findProducts(
    storeId: number,
    searchString: string
  ): Promise<Array<Product>> {
    const serializedSearchString = searchString.replace(/\s+/g, '&') + ':*';

    const products: Array<Product> = (
      await this.pg.raw(
        'select * from products where store_id = ? and to_tsvector(title) @@ to_tsquery(?)',
        [storeId, serializedSearchString]
      )
    ).rows;
    return products;
  }
}
