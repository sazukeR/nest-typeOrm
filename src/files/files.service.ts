import { existsSync } from 'fs';
import { join } from 'path';
import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class FilesService {

    // con esta funcion verificamos si existe la imagen dentro de la carpeta.
    getStaticProductImage( imageName: string ) {

        const path = join( __dirname, '../../static/products', imageName );

        if ( !existsSync(path) ) {
            throw new BadRequestException(`No product found with image ${imageName}`)
        }

        return path;
    }

}
