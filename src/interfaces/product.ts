import { Category } from './category';
import { Store } from './store';

export interface Product {
  id?: number;
  title: string;
  price: number;
  discountPrice?: number;
  weight: string;
  category: Category;
  store: Store;
}