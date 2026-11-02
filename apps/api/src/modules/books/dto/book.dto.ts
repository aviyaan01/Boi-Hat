import {
  IsNotEmpty,
  IsString,
  IsArray,
  ArrayMinSize,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
} from 'class-validator';
import {
  BookCondition,
  BookLanguage,
  WeightBucket,
} from '@boi-hat/shared-types';

export class CreateBookDto {
  @IsNotEmpty()
  @IsString()
  title_en: string;

  @IsNotEmpty()
  @IsString()
  title_bn: string;

  @IsOptional()
  @IsString()
  author_id?: string;

  @IsOptional()
  @IsString()
  publisher_id?: string;

  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(1)
  category_ids: string[];

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsEnum(BookCondition)
  condition: BookCondition;

  @IsOptional()
  @IsEnum(BookLanguage)
  language?: BookLanguage;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  price: number;

  @IsOptional()
  @IsNumber()
  original_price?: number;

  @IsOptional()
  @IsString()
  edition?: string;

  @IsOptional()
  @IsNumber()
  publication_year?: number;

  @IsOptional()
  is_rare?: boolean;

  @IsOptional()
  @IsNumber()
  stock_count?: number;

  @IsOptional()
  @IsEnum(WeightBucket)
  weight_bucket?: WeightBucket;

  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(3, { message: 'A minimum of 3 book photos (front cover, back cover, spine/pages) is strictly required.' })
  images: string[];
}

