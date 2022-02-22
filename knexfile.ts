import type { Knex } from 'knex';
import { camelCase } from 'cheerio/lib/utils';

// Update with your config settings.

export default {
  development: {
    client: 'postgresql',
    connection: {
      database: process.env.PGDATABASE,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      host: process.env.PGHOST,
      port: parseInt(process.env.PGPORT),
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: 'migrations',
      directory: __dirname + '/src/repository/migrations',
    },
    debug: true,
    postProcessResponse: (result) =>
      Array.isArray(result)
        ? result.map((row) => keysToCamelCase(row))
        : keysToCamelCase(result),
    wrapIdentifier: (value, origImpl) => origImpl(camelToSnakeCase(value)),
  },

  production: {
    client: 'postgresql',
    connection: {
      database: process.env.PGDATABASE,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      host: process.env.PGHOST,
      port: parseInt(process.env.PGPORT),
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: 'migrations',
      directory: __dirname + '/src/repository/migrations',
    },
    postProcessResponse: (result) =>
      Array.isArray(result)
        ? result.map((row) => keysToCamelCase(row))
        : keysToCamelCase(result),
    wrapIdentifier: (value, origImpl) => origImpl(camelToSnakeCase(value)),
  },
} as { [key: string]: Knex.Config };

const keysToCamelCase = <T extends object>(obj: T): T => {
  const entries = Object.entries(obj);
  const mappedEntries = entries.map(([key, value]) => [camelCase(key), value]);
  return Object.fromEntries(mappedEntries);
};

const camelToSnakeCase = (str: string): string =>
  str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
