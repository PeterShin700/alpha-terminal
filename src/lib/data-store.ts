import fs from 'fs';
import path from 'path';
import { kv } from '@vercel/kv';

const CACHE_FILE = path.join(process.cwd(), 'data-cache.json');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let redisClient: any = null;
function getRedisClient() {
  if (!redisClient && process.env.REDIS_URL) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Redis = require('ioredis');
    redisClient = new Redis(process.env.REDIS_URL);
  }
  return redisClient;
}

/**
 * 환경에 따라 Vercel KV 또는 로컬 JSON 파일 시스템에 데이터를 저장하고 불러오는 어댑터
 */
export async function getMarketData(key: string) {
  try {
    const redis = getRedisClient();
    if (redis) {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    }

    // KV_REST_API_URL이나 UPSTASH_REDIS_REST_URL이 존재하면 Vercel KV(Upstash) 사용
    if (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL) {
      const data = await kv.get(key);
      return data;
    }

    // 로컬 파일 시스템 Mock 어댑터
    if (fs.existsSync(CACHE_FILE)) {
      const raw = fs.readFileSync(CACHE_FILE, 'utf-8');
      const data = JSON.parse(raw);
      return data[key] || null;
    }
  } catch (error) {
    console.error(`[DataStore] Failed to get key: ${key}`, error);
  }
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function setMarketData(key: string, value: any) {
  try {
    const redis = getRedisClient();
    if (redis) {
      await redis.set(key, JSON.stringify(value));
      return;
    }

    if (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL) {
      await kv.set(key, value);
      return;
    }

    // 로컬 파일 시스템 Mock 어댑터
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let data: any = {};
    if (fs.existsSync(CACHE_FILE)) {
      data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    }
    data[key] = value;
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`[DataStore] Failed to set key: ${key}`, error);
    throw error;
  }
}
