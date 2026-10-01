import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type NotificationType = 'newApply' | 'applyApproved' | 'applyRejected' | 'requestClosed';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'text' })
  type: NotificationType;

  /** 关联对象 id：Application（newApply/approved/rejected）或 Request（requestClosed） */
  @Column({ type: 'int' })
  relatedId: number;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
