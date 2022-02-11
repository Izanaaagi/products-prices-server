import fs from 'fs';
import path from 'path';

export class FileStorage<T> {
  private readonly dataPath: string;

  constructor() {
    this.dataPath = path.resolve('./data');

    fs.existsSync(this.dataPath) || fs.mkdirSync(this.dataPath);
  }

  async writeJSON(
    dirTitle: string,
    fileName: string,
    JSONArray: Array<T>
  ): Promise<void> {
    const dirPath = path.join(this.dataPath, `${dirTitle}`);
    fs.existsSync(dirPath) || fs.mkdirSync(dirPath);
    const filePath = path.join(dirPath, `${fileName}.json`);

    const file = fs.createWriteStream(filePath);
    file.write('[\n');

    JSONArray.forEach((item, index) => {
      const isLastProduct = index === JSONArray.length - 1;
      isLastProduct
        ? file.write(`${JSON.stringify(item, null, 2)}\n`)
        : file.write(`${JSON.stringify(item, null, 2)},\n`);
    });

    file.write(']');
    file.end();
  }
}
