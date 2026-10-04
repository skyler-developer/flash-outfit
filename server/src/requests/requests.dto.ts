import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../common/dto';

export class LocationDto {
  /** 坐标可选：拒定位降级为「手动城市」模式时无坐标，仅城市必填 */
  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsNumber()
  lng?: number;

  @IsString()
  @Length(1, 30)
  city: string;

  @IsString()
  @Length(1, 100)
  name: string;
}

export class CreateRequestDto {
  @IsString()
  @Length(1, 50)
  title: string;

  @IsIn(['travel', 'photography', 'sports', 'food', 'show', 'game', 'study', 'outdoor', 'other'])
  type: 'travel' | 'photography' | 'sports' | 'food' | 'show' | 'game' | 'study' | 'outdoor' | 'other';

  @IsISO8601()
  activityTime: string;

  @IsString()
  @Length(1, 50)
  destination: string;

  @Type(() => LocationDto)
  @ValidateNested()
  location: LocationDto;

  @IsIn(['all', 'female', 'male'])
  genderPreference: 'all' | 'female' | 'male';

  @IsArray()
  @IsInt({ each: true })
  ageRange: [number, number];

  @IsString()
  @MinLength(10)
  @MaxLength(500)
  description: string;

  @IsArray()
  @IsString({ each: true })
  photos: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(9)
  maxMembers: number = 1;

  @IsOptional()
  @IsBoolean()
  autoCloseOnGrouped: boolean = false;
}

export class UpdateRequestDto {
  @IsOptional()
  @IsString()
  @Length(1, 50)
  title?: string;

  @IsOptional()
  @IsIn(['travel', 'photography', 'sports', 'food', 'show', 'game', 'study', 'outdoor', 'other'])
  type?: 'travel' | 'photography' | 'sports' | 'food' | 'show' | 'game' | 'study' | 'outdoor' | 'other';

  @IsOptional()
  @IsISO8601()
  activityTime?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  destination?: string;

  @IsOptional()
  @Type(() => LocationDto)
  @ValidateNested()
  location?: LocationDto;

  @IsOptional()
  @IsIn(['all', 'female', 'male'])
  genderPreference?: 'all' | 'female' | 'male';

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  ageRange?: [number, number];

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(9)
  maxMembers?: number;

  @IsOptional()
  @IsBoolean()
  autoCloseOnGrouped?: boolean;

  /** 手动结束招募：recruiting → finished */
  @IsOptional()
  @IsIn(['finished'])
  status?: 'finished';
}

export class ListRequestsDto extends PaginationDto {
  @IsOptional()
  @IsIn(['travel', 'photography', 'sports', 'food', 'show', 'game', 'study', 'outdoor', 'other'])
  type?: string;

  @IsOptional()
  @IsIn(['weekend', 'd7', 'd30', 'all'])
  timeRange?: 'weekend' | 'd7' | 'd30' | 'all';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lng?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  distance?: number;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsIn(['distance', 'time'])
  sortBy?: 'distance' | 'time';

  @IsOptional()
  onlyApplicable?: string | boolean;
}
