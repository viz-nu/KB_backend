import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { LongLifeTokenModel } from "../models/LongLifeTokens.js";
import { UserModel } from "../models/User.js";
import { GraphQLError } from "graphql";
export const authForGraphQL = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) throw new GraphQLError('Authentication Required, Authorization Header Missing', { extensions: { code: 'UNAUTHENTICATED' } });
        const token = authHeader.split(" ")[1];
        if (!token || token.trim() === "" || token === 'null' || token === 'undefined') throw new GraphQLError('Authentication Required, Access Token Missing', { extensions: { code: 'UNAUTHENTICATED' } });
        let decoded = null, tokenError = null;
        try {
            decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        } catch (error) {
            switch (error.name) {
                case "TokenExpiredError":
                    tokenError = { name: error.name, message: error.message, expiredAt: error.expiredAt };
                case "JsonWebTokenError":
                    tokenError = { name: error.name, message: error.message };
                case "NotBeforeError":
                    tokenError = { name: error.name, message: error.message };
                default:
                    tokenError = { name: error.name, message: error.message };
            }
        }
        if (tokenError) throw new GraphQLError('Authentication Required, Access Token Invalid', { extensions: { code: 'UNAUTHENTICATED', tokenError: tokenError } });
        const user = await UserModel.findById(decoded.id);
        if (!user) throw new GraphQLError('Authentication Required, User Not Found', { extensions: { code: 'USER_NOT_FOUND' } });
        return { req, res, decoded, user, isAuthenticated: true };
    } catch (error) {
        throw new GraphQLError(error.message, { extensions: { code: 'UNAUTHENTICATED' } });
    }
};
export const generateAccessToken = async (user, deviceInfo = "") => {
    const payload = { id: user._id, deviceInfo: deviceInfo, tokenId: randomUUID() };
    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
}
export const generateRefreshToken = async (user, deviceInfo = "") => {
    const payload = { id: user._id, deviceInfo: deviceInfo, tokenId: randomUUID() };
    await LongLifeTokenModel.create({ userId: user._id, tokenId: payload.tokenId, deviceInfo: deviceInfo, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) });
    return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
}
export const verifyRefreshToken = async (token) => {
    try {
        const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
        const { id, deviceInfo, tokenId } = decoded;
        const StoredToken = await LongLifeTokenModel.findOne({ userId: id, tokenId: tokenId, deviceInfo: deviceInfo });
        if (!StoredToken) return { success: false, error: { name: 'TOKEN_NOT_FOUND', message: 'Token not found' } };
        if (StoredToken.isRevoked) return { success: false, error: { name: 'TOKEN_REVOKED', message: 'Token revoked' } };
        if (StoredToken.expiresAt < new Date()) return { success: false, error: { name: 'TOKEN_EXPIRED', message: 'Token expired' } };
        const user = await UserModel.findById(id);
        if (!user) return { success: false, error: { name: 'USER_NOT_FOUND', message: 'User not found' } };
        return { success: true, decoded: decoded, user: user };
    } catch (error) {
        switch (error.name) {
            case "TokenExpiredError":
                // name: 'TokenExpiredError'
                return { success: false, error: { name: error.name, message: error.message, expiredAt: error.expiredAt } };
            case "JsonWebTokenError":
                // 'invalid token' - the header or payload could not be parsed
                // 'jwt malformed' - the token does not have three components(delimited by a.)
                // 'jwt signature is required'
                // 'invalid signature'
                // 'jwt audience invalid. expected: [OPTIONS AUDIENCE]'
                // 'jwt issuer invalid. expected: [OPTIONS ISSUER]'
                // 'jwt id invalid. expected: [OPTIONS JWT ID]'
                // 'jwt subject invalid. expected: [OPTIONS SUBJECT]'
                return { success: false, error: { name: error.name, message: error.message } };
            case "NotBeforeError":
                return { success: false, error: { name: error.name, message: error.message } };
            default:
                return { success: false, error: { name: error.name, message: error.message } };
        }
    }
}
// export const verifyAccessToken = async (req, res, next) => {
//     try {
//         const authHeader = req.headers.authorization;
//         if (!authHeader) throw new Error('Access Token Missing');
//         const token = authHeader.split(" ")[1];
//         const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
//         req.decodedAccessToken = decoded;
//         next();
//     } catch (error) {
//         switch (error.name) {
//             case "TokenExpiredError":
//                 // name: 'TokenExpiredError'
//                 res.status(401).json({ error: { name: error.name, message: error.message, expiredAt: error.expiredAt } });
//             case "JsonWebTokenError":
//                 // 'invalid token' - the header or payload could not be parsed
//                 // 'jwt malformed' - the token does not have three components(delimited by a.)
//                 // 'jwt signature is required'
//                 // 'invalid signature'
//                 // 'jwt audience invalid. expected: [OPTIONS AUDIENCE]'
//                 // 'jwt issuer invalid. expected: [OPTIONS ISSUER]'
//                 // 'jwt id invalid. expected: [OPTIONS JWT ID]'
//                 // 'jwt subject invalid. expected: [OPTIONS SUBJECT]'
//                 res.status(401).json({ error: { name: error.name, message: error.message } });
//             case "NotBeforeError":
//                 res.status(401).json({ error: { name: error.name, message: error.message } });
//             default:
//                 res.status(401).json({ error: { name: error.name, message: error.message } });
//         }
//     }
// }
// export const verifyRefreshToken = async (req, res, next) => {
//     try {
//         const authHeader = req.headers.authorization;
//         if (!authHeader) throw new Error('Refresh Token Missing');
//         const token = authHeader.split(" ")[1];
//         const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
//         req.decodedRefreshToken = decoded;
//         next();
//     } catch (error) {
//         switch (error.name) {
//             case "TokenExpiredError":
//                 res.status(401).json({ error: { name: error.name, message: error.message, expiredAt: error.expiredAt } });
//             case "JsonWebTokenError":
//                 // 'invalid token' - the header or payload could not be parsed
//                 // 'jwt malformed' - the token does not have three components(delimited by a.)
//                 // 'jwt signature is required'
//                 // 'invalid signature'
//                 // 'jwt audience invalid. expected: [OPTIONS AUDIENCE]'
//                 // 'jwt issuer invalid. expected: [OPTIONS ISSUER]'
//                 // 'jwt id invalid. expected: [OPTIONS JWT ID]'
//                 // 'jwt subject invalid. expected: [OPTIONS SUBJECT]'
//                 res.status(401).json({ error: { name: error.name, message: error.message } });
//             case "NotBeforeError":
//                 res.status(401).json({ error: { name: error.name, message: error.message } });
//             default:
//                 res.status(401).json({ error: { name: error.name, message: error.message } });
//         }
//     }
// }