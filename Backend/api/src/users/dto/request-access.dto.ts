import { IsNumber, IsOptional, IsString, MaxLength, Min, Max } from 'class-validator';

/** Body for POST /users/me/request-access */
export class RequestAccessDto {
  @IsString()
  @MaxLength(120)
  city!: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  lon?: number;
}
