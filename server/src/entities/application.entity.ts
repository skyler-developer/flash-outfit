import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

@Entity('applications')
export class Application {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  requestId: number;

  @Column({ type: 'int' })
  applicantId: number;

  /** 申请留言（1~100 字） */
  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'text', default: 'pending' })
  status: ApplicationStatus;

  @Column({ type: 'text', nullable: true })
  handledAt: string;

  @CreateDateColumn()
  createdAt: Date;
}
