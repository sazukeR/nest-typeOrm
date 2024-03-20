import { Injectable } from '@nestjs/common';
import { ProductsService } from 'src/products/products.service';
import { initialData } from './data/seed-data';


@Injectable()
export class SeedService {


  constructor(
    private readonly productsService: ProductsService,
  ) {}


  async runSEED() {

    await this.insertNewProducts();
    return `SEED EXECUTED`;
  }

  private async insertNewProducts() {

    await this.productsService.deleteAllProducts();


    const products = initialData.products;

    const insertAllPromises = [];

/*     products.forEach( product => {
      insertAllPromises.push( this.productsService.create( product ) );
    }) */

    await Promise.all( insertAllPromises ); // espera a que todas las promesas se resuelvan para seguir con la ejecucion del codigo.






    return true;
  }

}
