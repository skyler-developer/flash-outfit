import { IsIn, IsOptional, IsString, Length } from 'class-validator';
import { PaginationDto } from '../common/dto';

export class CreateApplicationDto {
  @IsString()
  @Length(1, 100)
  message: string;
}

export class ReviewDto {
  @IsIn(['approve', 'reject'])
  action: 'approve' | 'reject';
}

export class ListApplicationsDto extends PaginationDto {
  @IsOptional()
  @IsIn(['pending', 'approved', 'rejected'])
  status?: 'pending' | 'approved' | 'rejected';
}
