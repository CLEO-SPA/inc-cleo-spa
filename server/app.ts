import express, { json, NextFunction, Request, Response, urlencoded } from 'express';
import cors from 'cors';
import session from 'express-session';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import mainRoutes from './routes/mainRoutes.js';
import sessionStore from './store/sessionStore.js';
import { globalErrorHandler, NotFoundError } from './types/errors.js';

const app = express();

const corsOptions = {
  origin: [process.env.LOCAL_FRONTEND_URL, process.env.LOCAL_BACKEND_URL, process.env.AWS_FRONTEND_URL] as string[],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Set-Cookie',
    'X-Requested-With',
    'X-Simulation-Mode',
    'Access-Control-Allow-Origin',
  ],
  credentials: true,
  maxAge: 600,
  optionsSuccessStatus: 204,
};

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Much more lenient for development
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: 'Too many requests from this IP, please try again later.',
});

app.use(json());
app.use(urlencoded({ extended: true }));
app.use(cors(corsOptions));
app.use(limiter);
app.use(cookieParser());

app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET as string,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      secure: process.env.NODE_ENV === 'production', // Set to true if using HTTPS
      sameSite: 'lax',
      httpOnly: true,
    },
  })
);

app.use('/api', mainRoutes);

app.all('/*a', (req: Request, res: Response, next: NextFunction) => {
  throw new NotFoundError(`Can't find ${req.originalUrl} on this server!`);
});

app.use(globalErrorHandler);

export default app;
