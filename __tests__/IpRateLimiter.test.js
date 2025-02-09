const rateLimiter = require("../mws/__ipRateLimit.mw");

// Mock dependencies
const mockCache = {
    key: {
        get: jest.fn(),
        set: jest.fn(),
        setWithKeepTtl: jest.fn(),
    },
};

const mockConfig = {
    dotEnv: {
        IP_RATE_LIMIT: 5, // Max requests allowed
        IP_RATE_WINDOW: 60, // Time window in seconds
    },
};

describe("Rate Limiter Middleware", () => {
    let middleware;
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
        middleware = rateLimiter({ cache: mockCache, config: mockConfig });
        mockReq = { ip: "127.0.0.1" };
        mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn(), setHeader: jest.fn() };
        mockNext = jest.fn();
    });

    test("should allow request if under rate limit", async () => {
        mockCache.key.get.mockResolvedValue(null);

        await middleware({ req: mockReq, res: mockRes, next: mockNext });

        expect(mockCache.key.set).toHaveBeenCalledWith({ key: "ratelimit:127.0.0.1", data: 1, ttl: 60 });
        expect(mockRes.status).not.toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalled();
    });

    test("should allow request if rate limit not exceeded", async () => {
        mockCache.key.get.mockResolvedValue("3");

        await middleware({ req: mockReq, res: mockRes, next: mockNext });

        expect(mockCache.key.setWithKeepTtl).toHaveBeenCalledWith("axion:ch:ratelimit:127.0.0.1", 4);
        expect(mockRes.status).not.toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalled();
    });

    test("should block request if rate limit exceeded", async () => {
        mockCache.key.get.mockResolvedValue("5");

        await middleware({ req: mockReq, res: mockRes, next: mockNext });

        expect(mockRes.status).toHaveBeenCalledWith(429);
        expect(mockRes.json).toHaveBeenCalledWith({ error: "Too many requests. Please try again later." });
        expect(mockNext).not.toHaveBeenCalled();
    });

    test("should handle cache failure gracefully", async () => {
        mockCache.key.get.mockRejectedValue(new Error("Redis error"));

        await middleware({ req: mockReq, res: mockRes, next: mockNext });

        expect(mockNext).toHaveBeenCalled(); // Request should still proceed
    });
});
