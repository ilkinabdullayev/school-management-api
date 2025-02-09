module.exports = ({ cache, config }) => {
    const limit = config.dotEnv.IP_RATE_LIMIT;
    const window = config.dotEnv.IP_RATE_WINDOW;

    return async ({ req, res, next }) => {
        const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const redisKey = `ratelimit:${ip}`;

        try {
            let current = await cache.key.get({ key: redisKey });
            if (current && parseInt(current) >= limit) {
                return res.status(429).json({ error: "Too many requests. Please try again later." });
            }

            if (current === null) {
                await cache.key.set({ key: redisKey, data: 1, ttl: window });  // First request
            } else {
                await cache.key.setWithKeepTtl(`axion:ch:${redisKey}`, parseInt(current) + 1);
            }

            res.setHeader(
                "X-IP-RATELIMIT-REMAINING",
                limit - current - 1
            );

            next(); // Proceed to the next middleware
        } catch (error) {
            console.error("Rate limiter error:", error);
            next(); // Allow the request to proceed even if Redis fails
        }
    };
};
