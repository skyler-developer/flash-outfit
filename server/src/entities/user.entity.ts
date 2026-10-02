import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type Gender = 'female' | 'male';
export type Interest =
  | 'travel'
  | 'photography'
  | 'sports'
  | 'food'
  | 'show'
  | 'game'
  | 'study'
  | 'outdoor';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  openid: string;

  @Column({ type: 'text', nullable: true })
  nickname: string;

  @Column({ type: 'text', nullable: true })
  avatar: string;

  @Column({ type: 'text', nullable: true })
  gender: Gender;

  /** 年龄由出生年份派生，不落库 */
  @Column({ type: 'int', nullable: true })
  birthYear: number;

  @Column({ type: 'text', nullable: true })
  wechatId: string;

  @Column({ type: 'simple-json', nullable: true })
  interests: Interest[];

  @CreateDateColumn()
  createdAt: Date;
}

export function calcAge(birthYear: number): number {
  return new Date().getFullYear() - birthYear;
}

export function profileCompleted(u: User): boolean {
  // 偏好匹配所需的核心字段：性别 + 出生年份（头像/昵称可后补）
  return Boolean(u?.gender && u?.birthYear);
}
