import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import { initialize } from "./config/db.js";
import errorHandlerMiddleware from './middleware/errorHandler.js';
import registerApollo from './graphql/index.js';
import 'dotenv/config'
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const reactBuildPath = path.resolve(__dirname, '../build');
const whitelist = ["http://localhost:5174", "http://localhost:3000", "http://localhost:8080", "https://studio.apollographql.com", "https://kbbackend-production.up.railway.app"];
export const corsOptions = {
    origin: (origin, callback) => (!origin || whitelist.indexOf(origin) !== -1) ? callback(null, true) : callback(new Error('Not allowed by CORS')),
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Accept",
        "Cache-Control",   // ✅ allow cache control header
        "Pragma"           // ✅ allow pragma header
    ],
    credentials: true,
    optionsSuccessStatus: 200,
    preflightContinue: false
};
export const openCors = cors();
export const createApp = async () => {
    try {
        await initialize();
        const app = express();
        const server = http.createServer(app);
        // Middleware
        app.set('trust proxy', 1);
        app.use(cors(corsOptions))
        app.use(helmet({
            contentSecurityPolicy: false, // Temporarily disable CSP
            frameguard: { action: 'sameorigin' },
            noSniff: true,
            referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
            permittedCrossDomainPolicies: { permittedPolicies: 'none' },
            crossOriginResourcePolicy: { policy: 'cross-origin' }, // Add this line
            crossOriginOpenerPolicy: false, // Add this line
            crossOriginEmbedderPolicy: false // Add this line
        }));
        app.use(cookieParser());
        app.use(express.json({ type: ["application/json", "text/plain"], limit: '50mb' }));
        app.use(morgan(':date[web] :method :url :status - :response-time ms'));
        app.use(express.static(reactBuildPath));
        // app.use((req, res, next) => {
        //     req.body = sanitize(req.body);
        //     req.params = sanitize(req.params);
        //     if (JSON.stringify(req.query) !== JSON.stringify(sanitize(req.query))) return res.status(400).json({ error: 'Invalid query parameters detected', message: 'Query contains potentially malicious content' });
        //     next();
        // });
        // app.use(express.urlencoded({ limit: '50mb', extended: true }));
        app.use(bodyParser.urlencoded({ extended: true }));
        // Apollo setup
        try {
            await registerApollo(app, server);
        } catch (error) {
            console.error("error with Apollo setup", error);
            throw error;
        }
        // Routes
        app.get('/{*splat}', (_, res) => res.status(200).sendFile(path.join(reactBuildPath, 'index.html')));
        // Error handling
        try {
            app.use(errorHandlerMiddleware);
        } catch (error) {
            console.error("error with Error handling", error);
            throw error;
        }
        return { app, server };
    } catch (error) {
        console.error("failed to start server", error);
        throw error;
    }
};
