import { Pool } from 'pg';
declare const pool: Pool;
export default pool;
export declare function query<T = unknown>(text: string, params?: unknown[]): Promise<{
    rows: T[];
    rowCount: number;
}>;
//# sourceMappingURL=pool.d.ts.map