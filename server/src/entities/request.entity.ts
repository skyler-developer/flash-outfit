import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type RequestType =
  | 'travel'
  | 'photography'
  | 'sports'
  | 'food'
  | 'show'
  | 'game'
  | 'study'
  | 'outdoor'
  | 'other';
export type GenderPreference = 'all' | 'female' | 'male';
export type RequestStatus = 'recruiting' | 'grouped' | 'finished' | 'cancelled';

@Entity('requests')
export class ActivityRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  publisherId: number;

  @Column({ type: 'text' })
  type: RequestType;

  /** ISO 8601 时间字符串 */
  @Column({ type: 'text' })
  activityTime: string;

  @Column({ type: 'text' })
  destination: string;

  /** 拒定位降级：无坐标时为 null，仅城市匹配 */
  @Column({ type: 'double', nullable: true })
  lat: number | null;

  @Column({ type: 'double', nullable: true })
  lng: number | null;

  @Column({ type: 'text' })
  city: string;

  @Column({ type: 'text', default: 'all' })
  genderPreference: GenderPreference;

  @Column({ type: 'int', default: 18 })
  ageMin: number;

  @Column({ type: 'int', default: 60 })
  ageMax: number;

  /** 搭子人数上限（不含发布者），默认 1 */
  @Column({ type: 'int', default: 1 })
  maxMembers: number;

  /** 成组后是否自动结束招募，默认不结束 */
  @Column({ type: 'boolean', default: false })
  autoCloseOnGrouped: boolean;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'simple-json', nullable: true })
  photos: string[];

  @Column({ type: 'text', default: 'recruiting' })
  status: RequestStatus;

  @CreateDateColumn()
  createdAt: Date;
}
