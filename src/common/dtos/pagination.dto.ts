import { Type } from 'class-transformer';
import { IsPositive, IsOptional, Min } from 'class-validator';


export class PaginationDto {

    @IsOptional()
    @IsPositive()
    @Type( () => Number ) // con esto podemos transformar los query parameters que vienen como strings a un number
    limit?: number;





    @IsOptional()
    @Min(0)
    @Type( () => Number )
    offset?: number;




}