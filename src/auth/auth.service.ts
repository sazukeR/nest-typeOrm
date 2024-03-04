import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import * as bcryptjs from 'bcryptjs'

import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';


@Injectable()
export class AuthService {


  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>, 
  ) {}


  async create(createUserDto: CreateUserDto) {
    
    try {

      const { password, ...userData } = createUserDto;
      
      const user = this.userRepository.create({
        ...userData,
        password: bcryptjs.hashSync( password, 10 )
      });

      await this.userRepository.save(user);

      delete user.password;

      return user;

    } catch (error) {

      this.handleDBErrors(error);
      
    }

  }

  // never significa que es una funcion que no retorna nada
  private handleDBErrors(error: any): never {

    if ( error.code === '23505' ) {
      throw new BadRequestException( error.detail )
    }

    console.log(error);

    throw new InternalServerErrorException('Please check server logs')

  }

}
