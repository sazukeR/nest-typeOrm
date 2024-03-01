import { BadRequestException, Controller, Get, Param, Post, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FilesService } from './files.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { fileFilter, fileNamer } from './helpers';
import { diskStorage } from 'multer';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';




@Controller('files')
export class FilesController {
  constructor(
      private readonly filesService: FilesService,
      private readonly configService: ConfigService
    ) {}

  @Get('product/:imageName')
  findProductImage(
    @Res() res: Response,
    @Param('imageName') imageName: string
  ) {

    const path = this.filesService.getStaticProductImage( imageName );

    // return path;

    res.sendFile( path )

  }




  @Post('product')
  @UseInterceptors(FileInterceptor('file', {
    fileFilter: fileFilter,
   // limits: { fileSize: 1000 }
    storage: diskStorage({
      destination: './static/products',
      filename: fileNamer,
    })

  }))
  uploadProductImages(@UploadedFile() file: Express.Multer.File) {

    if (!file) {
      throw new BadRequestException('Make sure that the file is an image')
    }

    // console.log({ fileInController: file })

    const secureUrl = `${ this.configService.get('HOST_API') }/files/product/${ file.filename }`

    return {
      secureUrl
    };
  }

}
