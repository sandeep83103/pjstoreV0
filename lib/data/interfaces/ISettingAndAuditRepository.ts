import { Setting, AuditLog } from '../../types';

export interface ISettingRepository {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<Setting>;
  listAll(): Promise<Record<string, unknown>>;
}

export interface IAuditLogRepository {
  record(log: AuditLog): Promise<void>;
  listByEntity(entityId: string, limit?: number): Promise<AuditLog[]>;
  listRecent(limit?: number): Promise<AuditLog[]>;
}
