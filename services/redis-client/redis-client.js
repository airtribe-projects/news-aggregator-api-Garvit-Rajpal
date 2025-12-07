const redis = require("redis");

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const RECONNECT_MAX_RETRIES = Number(process.env.REDIS_RECONNECT_MAX_RETRIES) || 10;
const RECONNECT_INITIAL_DELAY_MS = Number(process.env.REDIS_RECONNECT_INITIAL_DELAY_MS) || 100; // exponential backoff base
const RECONNECT_MAX_DELAY_MS = Number(process.env.REDIS_RECONNECT_MAX_DELAY_MS) || 2000;
const CONNECT_TIMEOUT_MS = Number(process.env.REDIS_CONNECT_TIMEOUT_MS) || 5000;
const COMMAND_TIMEOUT_MS = Number(process.env.REDIS_COMMAND_TIMEOUT_MS) || 3000;
const COMMAND_MAX_RETRIES = Number(process.env.REDIS_COMMAND_MAX_RETRIES) || 2;

function reconnectStrategy(retries) {
  if (retries > RECONNECT_MAX_RETRIES) {
    return new Error("Retry attempts exhausted for Redis reconnect");
  }
  const delay = Math.min(RECONNECT_INITIAL_DELAY_MS * 2 ** retries, RECONNECT_MAX_DELAY_MS);
  return delay;
}

const client = redis.createClient({
  url: REDIS_URL,
  socket: {
    reconnectStrategy,
    connectTimeout: CONNECT_TIMEOUT_MS,
    keepAlive: 60
  },
});

client.on("error", (err) => {
  console.error("Redis Client Error", err);
});
client.on("connect", () => {
  console.log("Redis client connecting...");
});
client.on("ready", () => {
  console.log("Redis client ready");
});
client.on("reconnecting", (info) => {
  console.log("Redis reconnecting", info);
});
client.on("end", () => {
  console.log("Redis connection closed");
});

async function connectRedis() {
  if (!client.isOpen) {
    try {
      await client.connect();
    } catch (err) {
      console.error("Redis initial connect failed:", err);
      // let the client's reconnectStrategy handle further reconnect attempts,
      // but rethrow so callers know initial connect failed if they depend on it.
      throw err;
    }
  }
}

// simple sleep helper
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// run a command with timeout and retry/backoff
async function runWithRetries(fn, {
  timeoutMs = COMMAND_TIMEOUT_MS,
  maxRetries = COMMAND_MAX_RETRIES,
  initialBackoffMs = 100
} = {}) {
  let attempt = 0;
  let backoff = initialBackoffMs;

  while (true) {
    try {
      // race the command against a timeout
      const result = await Promise.race([
        fn(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Redis command timed out")), timeoutMs)
        ),
      ]);
      return result;
    } catch (err) {
      attempt += 1;
      const isLast = attempt > maxRetries;
      console.warn(`Redis command attempt ${attempt} failed: ${err.message}${isLast ? " - giving up" : ""}`);
      if (isLast) throw err;
      // exponential backoff
      await sleep(backoff);
      backoff = Math.min(backoff * 2, RECONNECT_MAX_DELAY_MS);
    }
  }
}

// convenience wrappers used by app code
async function getWithRetry(key, options) {
  return runWithRetries(() => client.get(key), options);
}

async function setWithRetry(key, value, opts = {}, options) {
  return runWithRetries(() => client.set(key, value, opts), options);
}

async function delWithRetry(key, options) {
  return runWithRetries(() => client.del(key), options);
}

module.exports = {
  client,
  connectRedis,
  // helpers for commands with timeout+retries
  getWithRetry,
  setWithRetry,
  delWithRetry,
};
