import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('products', (table) => {
    table.increments();
    table.string('title');
    table.integer('price').checkPositive();
    table.integer('discount_price').nullable().checkPositive();
    table.string('weight');
    table.integer('category_id').references('id').inTable('categories');
    table.integer('store_id').references('id').inTable('stores');
    table.timestamps(true, true);
    table.unique(['title', 'store_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('products');
}
