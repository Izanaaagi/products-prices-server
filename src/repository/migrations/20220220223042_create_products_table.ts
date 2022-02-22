import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('products', (table) => {
    table.increments();
    table.string('title');
    table.integer('price');
    table.integer('discount_price');
    table.string('weight');
    table.integer('category_id').references('id').inTable('categories');
    table.integer('store_id').references('id').inTable('stores');
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('products');
}
