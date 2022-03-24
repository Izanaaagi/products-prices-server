import { Database } from '../repository/database';
import fastify, { FastifyInstance } from 'fastify';
import cors from 'fastify-cors';
import { SearchRequest } from './search-request';

export class Server {
  private readonly database: Database;
  private readonly server: FastifyInstance;

  constructor(database: Database) {
    this.database = database;
    this.server = fastify();

    this.server.register(cors);

    this.server.get('/supermarkets', async (req, resp) => {
      return await this.database.getAllStores();
    });

    this.server.get(
      '/products/search/:storeId/:searchString',
      async (req: SearchRequest, res) => {
        return await this.database.findProducts(
          req.params.storeId,
          req.params.searchString,
          req.query.page,
          req.query.size
        );
      }
    );
  }

  public start(): void {
    this.server.listen(process.env.PORT, '0.0.0.0', (err, address) =>
      console.log('server hosting at', address)
    );
  }

  public stop(): void {
    this.server.close(() => {
      console.log('server turned off');
    });
  }
}
