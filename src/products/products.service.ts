import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { DataSource, Repository } from 'typeorm';
import { Product, ProductImage } from './entities';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationDto } from '../common/dtos/pagination.dto';
import { validate as isUUID } from 'uuid'
import { User } from 'src/auth/entities/user.entity';


@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductsService');

  constructor(

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(ProductImage)
    private readonly productImagesRepository: Repository<ProductImage>,

    private readonly dataSource: DataSource,

  ) {}


  async create(createProductDto: CreateProductDto, user: User) {

    try {

      const { images = [], ...productDetails } = createProductDto;
      
      const product = this.productRepository.create({
        ...productDetails,
        images: images.map( images => this.productImagesRepository.create({ url: images }) ),
        user,
      });

      await this.productRepository.save(product);

      return {...product, images};

    } catch (error) {

      this.handleDBExceptions(error);

    }

  }

/*   async findOne(term: string) {

    let pokemon: Pokemon;

    if ( !isNaN(+term) ) {
      pokemon = await this.pokemonModel.findOne({ no: term });
    }

    if ( !pokemon && isValidObjectId(term) ) {
      pokemon = await this.pokemonModel.findById(term);
    }

    if ( !pokemon ) {
      pokemon = await this.pokemonModel.findOne({name: term});
    }


    if( !pokemon ) {
      throw new NotFoundException(`Pokemon with id, name or no. ${term} not found`);
    }

    return pokemon;
  } */

  async findAll( paginationDto: PaginationDto) {

    const { limit = 10, offset = 0 } = paginationDto;

    const products = await this.productRepository.find({
      take: limit,
      skip: offset,
      relations: {
        images: true,
      }
    });

    // aplanar las imagenes
    return products.map( product => ({
      ...product,
      images: product.images.map( img => img.url ),
    }))
  }

  async findOne(term: string) {
    
    let product: Product;

    if ( isUUID( term ) ) {
      product = await this.productRepository.findOneBy({ id: term })
    }
    else {
      
      const queryBuilder = this.productRepository.createQueryBuilder('prod');

      product = await queryBuilder
        .where('UPPER(title) =:title or slug =:slug', {
          title: term.toUpperCase(),
          slug: term.toLowerCase(),
        })
        .leftJoinAndSelect('prod.images', 'prodImages')
        .getOne(); // podria lanzar mas de un resultado, por eso utilizamos el getOne()
    }

    if( !product ) {
      throw new NotFoundException(`Product with id, name or no. ${term} not found`);
    }

    return product;

  }

  async findOnePlain(term: string) {
    const { images = [], ...rest } = await this.findOne( term );
    return {
      ...rest,
      images: images.map( image => image.url ),
    }
  }

  async update(id: string, updateProductDto: UpdateProductDto,  user: User) {

    const { images, ...toUpdate } = updateProductDto;

    const product = await this.productRepository.preload({
      id: id,
      ...toUpdate,
    })

    if ( !product ) {
      throw new NotFoundException(`Product with id: ${id} not found`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      // relizamos una transaccion donde primero vemos si tenemos imagenes para insertar, en caso de que tengamos imagenes, eliminamos las imagenes anteriores y agregamos las nuevas.
      // estamos elimando las imagenes anteriores e insertando nuevas porque asi es como queremos que funcione nuestro api
      if ( images ) {
        await queryRunner.manager.delete( ProductImage, { product: { id } });

        product.images = images.map( image => this.productImagesRepository.create({ url: image }) )
      }

      product.user = user;
      
      await queryRunner.manager.save( product );

      // en este punto hacemos el commit de la transaccion, si el delete no fallo y el save tampoco fallo, una vez hacemos el commit realizamos el release y con eso limpiamos la transaccion.
      await queryRunner.commitTransaction();
      await queryRunner.release();

      
      // await this.productRepository.save(product);
      // return product;
      return this.findOnePlain( id );

    } catch (error) {
      // en caso de error en la transaccion
      await queryRunner.rollbackTransaction();
      await queryRunner.release();

      this.handleDBExceptions(error);

    }

  }

  async remove(id: string) {

    const product = await this.findOne( id );
    await this.productRepository.remove( product );

    return `the product with id: ${id} was removed`;
  }


  private handleDBExceptions( error: any ) {

    if ( error.code === '23505' ) {
      throw new BadRequestException(error.detail);
    }

    this.logger.error(error);

    throw new InternalServerErrorException('Unexpected error, check server logs');

  }

  async deleteAllProducts() {

    const query = this.productRepository.createQueryBuilder('product');

    try {
      return await query
        .delete()
        .where({})
        .execute()
    } catch (error) {
      this.handleDBExceptions(error)
    }

  }




}
