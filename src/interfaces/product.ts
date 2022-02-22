export interface Product {
  id?: number;
  title: string;
  price: number;
  discountPrice?: number;
  weight: string;
  categoryId: number;
  storeId: number;
}
