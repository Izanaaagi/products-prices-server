import { FastifyRequest } from 'fastify';

interface SearchParams {
  storeId: number;
  searchString: string;
}

interface SearchQuery {
  page: number;
  size: number;
}

export type SearchRequest = FastifyRequest<{
  Params: SearchParams;
  Querystring: SearchQuery;
}>;
