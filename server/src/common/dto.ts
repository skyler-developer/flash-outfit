import { IsIn, IsInt, IsOptional, IsString, Length, Max, Min, registerDecorator, ValidationOptions } from 'class-validator';
import { Type } from 'class-transformer';

/** 自定义校验：数组元素在允许集合内 */
export function IsArrayIn(allowed: string[], validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isArrayIn',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return Array.isArray(value) && value.every((v) => allowed.includes(v));
        },
      },
    });
  };
}

export class LoginDto {
  @IsString()
  @Length(1, 100)
  code: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Length(1, 30)
  nickname: string;

  @IsOptional()
  @IsString()
  avatar: string;

  @IsOptional()
  @IsIn(['female', 'male'])
  gender: 'female' | 'male';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  birthYear: number;

  @IsOptional()
  @IsString()
  @Length(2, 30)
  wechatId: string;

  @IsOptional()
  @IsArrayIn(['travel', 'photography', 'sports'])
  interests: string[];
}

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize: number = 10;
}
