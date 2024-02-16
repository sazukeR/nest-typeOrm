import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationDto } from '../common/dtos/pagination.dto';
import { validate as isUUID } from 'uuid'

@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductsService');

  constructor(

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>

  ) {}


  async create(createProductDto: CreateProductDto) {

    try {
      
      const product = this.productRepository.create(createProductDto);

      await this.productRepository.save(product);

      return product;

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

    return await this.productRepository.find({
      take: limit,
      skip: offset,
    });

  }

  async findOne(term: string) {
    
    let product: Product;

    if ( isUUID( term ) ) {
      product = await this.productRepository.findOneBy({ id: term })
    }
    else {
      
      const queryBuilder = this.productRepository.createQueryBuilder();

      product = await queryBuilder
        .where('UPPER(title) =:title or slug =:slug', {
          title: term.toUpperCase(),
          slug: term.toLowerCase(),
        }).getOne(); // podria lanzar mas de un resultado, por eso utilizamos el getOne()
    }

    if( !product ) {
      throw new NotFoundException(`Product with id, name or no. ${term} not found`);
    }

    return product;

  }

  async update(id: string, updateProductDto: UpdateProductDto) {

    const product = await this.productRepository.preload({
      id: id,
      ...updateProductDto,
    })

    if ( !product ) {
      throw new NotFoundException(`Product with id: ${id} not found`);
    }

    try {
      
      await this.productRepository.save(product);
      return product;

    } catch (error) {

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
}
