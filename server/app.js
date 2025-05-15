import express, { json, urlencoded } from 'express';
import cors from 'cors';
import createHttpError from 'http-errors';
import session from 'express-session';
import mainRoutes from './routes/mainRoutes.js';
import sessionStore from './middlewares/sessionMiddleware.js';

const app = express();

const corsOptions = {
  origin: [process.env.LOCAL_FRONTEND_URL, process.env.LOCAL_BACKEND_URL],
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

app.use(json());
app.use(urlencoded({ extended: true }));
app.use(cors(corsOptions));

app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET,
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

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use(function (req, res, next) {
  return next(createHttpError(404, `Unknown Resource ${req.method} ${req.originalUrl}`));
});

// eslint-disable-next-line no-unused-vars
app.use(function (err, req, res, next) {
  return res.status(err.status || 500).json({ error: err.message || 'Unknown Server Error!' });
});

export default app;
