/** 集中读取环境变量，开发期提供零配置默认值 */

function env(key: string, fallback: string): string {
  return process.env[key] || fallback;
}

export const appConfig = {
  port: Number(env('PORT', '3000')),
  publicBaseUrl: env('PUBLIC_BASE_URL', 'http://localhost:3000').replace(/\/$/, ''),
  jwtSecret: env('JWT_SECRET', 'flash-outfit-dev-secret'),
  wx: {
    appid: process.env.WX_APPID || '',
    secret: process.env.WX_SECRET || '',
  },
  tencentMapKey: process.env.TENCENT_MAP_KEY || '',
  db: {
    type: (env('DB_TYPE', 'sqlite') as 'sqlite' | 'mysql'),
    get mysql() {
      return {
        host: env('DB_HOST', '127.0.0.1'),
        port: Number(env('DB_PORT', '3306')),
        username: env('DB_USERNAME', 'root'),
        password: env('DB_PASSWORD', ''),
        database: env('DB_DATABASE', 'flash_outfit'),
      };
    },
    synchronize: env('DB_SYNCHRONIZE', 'true') === 'true',
  },
  uploadDir: 'uploads',
};
