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
    /** 消息推送回调签名 token（与小程序后台「消息推送」配置一致） */
    callbackToken: env('WX_CALLBACK_TOKEN', 'flash-outfit-dev-token'),
  },
  tencentMapKey: process.env.TENCENT_MAP_KEY || '',
  storage: {
    /** local = 本地磁盘（开发）；cos = 腾讯云 COS（生产） */
    type: (env('STORAGE_TYPE', 'local') as 'local' | 'cos'),
    cos: {
      secretId: env('COS_SECRET_ID', ''),
      secretKey: env('COS_SECRET_KEY', ''),
      bucket: env('COS_BUCKET', 'flash-outfit-1322045345'),
      region: env('COS_REGION', 'ap-guangzhou'),
      /** 桶访问域名（末尾不带斜杠），默认即本项目桶 */
      baseUrl: env('COS_BASE_URL', 'https://flash-outfit-1322045345.cos.ap-guangzhou.myqcloud.com').replace(/\/$/, ''),
    },
  },
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
