export class Currency {
  static toCoins(currency: string): number {
    const [integer, fraction] = currency.split('.');
    return Number(integer) * 100 + Number(fraction);
  }
}
