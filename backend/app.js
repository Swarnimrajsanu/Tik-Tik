import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import connect from './db/db.js';
import ai from './routes/ai.routes.js';
import codeRoutes from './routes/code.routes.js';
import projectRoutes from './routes/project.routes.js';
import userRoutes from './routes/user.route.js';



connect();


const app = express();
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/users', userRoutes);
app.use("/ai", ai)
app.use('/projects', projectRoutes);
app.use('/code', codeRoutes);

app.get('/', (req, res) => {
    res.send('Hello World!');
});

export default app;