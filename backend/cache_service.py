import redis # pyright: ignore[reportMissingImports]
import json
import logging
from config import Config

logger = logging.getLogger(__name__)

# Initialize Redis client
try:
    redis_client = redis.from_url(Config.REDIS_URL, decode_responses=True)
    logger.info("✅ Redis connected successfully.")
except Exception as e:
    logger.error(f"❌ Redis connection failed: {e}")
    redis_client = None

def get_cache(key):
    """Retrieves data from Redis cache."""
    if not redis_client:
        return None
    try:
        data = redis_client.get(key)
        return json.loads(data) if data else None
    except Exception as e:
        logger.error(f"Redis GET error: {e}")
        return None

def set_cache(key, value, expiry=3600):
    """Stores data in Redis cache with an expiry (default 1 hour)."""
    if not redis_client:
        return
    try:
        redis_client.setex(key, expiry, json.dumps(value))
    except Exception as e:
        logger.error(f"Redis SET error: {e}")

def delete_cache(key):
    """Removes a key from Redis cache."""
    if not redis_client:
        return
    try:
        redis_client.delete(key)
    except Exception as e:
        logger.error(f"Redis DELETE error: {e}")

def clear_cache_pattern(pattern, *keys):
    """Clears all keys matching a pattern (e.g., 'vehicles:*')."""
    if not redis_client:
        return
    try:
        keys = redis_client.keys(pattern)
        if keys:
            redis_client.delete(*keys)
            logger.info(f"Cleared {len(keys)} cache keys matching {pattern}")
    except Exception as e:
        logger.error(f"Redis CLEAR error: {e}")
