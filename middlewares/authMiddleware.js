const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
    const authHeader = req.get('authorization') || req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: "Authorization header missing" });
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();
    if (!token) {
        return res.status(401).send({ message: "Token not found" });
    }

    try {
        // jwt.verify is synchronous when no callback is provided
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        return next();
    } catch (err) {
        console.log("Error in auth middleware", err);
        // More descriptive responses for common JWT errors
        if (err instanceof jwt.TokenExpiredError) {
            return res.status(401).send({ message: "Token expired" });
        }
        if (err instanceof jwt.JsonWebTokenError) {
            return res.status(401).send({ message: "Invalid token" });
        }
        if (err instanceof jwt.NotBeforeError) {
            return res.status(401).send({ message: "Token not active yet" });
        }
        // fallback
        return res.status(403).send({ message: "Unauthenticated Request" });
    }
};

module.exports = { authMiddleware };
