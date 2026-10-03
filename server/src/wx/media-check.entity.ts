import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * 图片内容安全审核记录（微信 mediaCheckAsync）。
 * 提交时写入 checking；微信事件回调后回写终态。
 * 展示侧根据 status=risky 动态把对应图片替换为占位（不修改业务表数据）。
 */
@Entity('media_checks')
export class MediaCheck {
  @PrimaryGeneratedColumn()
  id: number;

  /** 微信返回的 trace_id，回调以此对账（提交失败时为 null） */
  @Column({ type: 'text', nullable: true })
  traceId: string | null;

  @Column({ type: 'text' })
  mediaUrl: string;

  /** checking=审核中 pass=通过 risky=违规 */
  @Column({ type: 'text', default: 'checking' })
  status: 'checking' | 'pass' | 'risky';

  /** 微信违规标签（100 正常；20001 色情等），通过/未判定为 null */
  @Column({ type: 'int', nullable: true })
  label: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'datetime', nullable: true })
  checkedAt: Date | null;
}
