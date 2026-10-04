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
export type ReviewStatus = 'checking' | 'pass' | 'rejected';

@Entity('requests')
export class ActivityRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  publisherId: number;

  @Column({ type: 'text' })
  type: RequestType;

  @Column({ type: 'text' })
  title: string;

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

  /** 发布时选择或定位得到的完整地区名称 */
  @Column({ type: 'text' })
  locationName: string;

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

  /**
   * 内容安全审核状态（先审后展门控）：
   * - checking：图片异步审核中，首页不展示，仅发布者可见
   * - pass：审核通过（含无图片记录的存量数据），对外展示
   * - rejected：任一图片判违规，首页不展示，仅发布者可见，可改后重新送审
   * 文字在发布时已同步过 msgSecCheck，不参与该状态机。
   */
  @Column({ type: 'text', default: 'pass' })
  reviewStatus: ReviewStatus;

  @CreateDateColumn()
  createdAt: Date;
}
