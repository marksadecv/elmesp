import {config} from 'dotenv';
import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import reportRouter from './routes/reports.js';
import {fileURLToPath} from 'url';

config();
const app = express();

// ES modules support for request.body parsing
app.use(bodyParser.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

mongoose.connect(process.env.DATABASE_URL);
const db = mongoose.connection;

db.on('error', error => console.error(error));
db.once('open', ()=> console.log('Connected to DB'));

app.use('/elmesp-reports', reportRouter);
app.set('view engine', 'pug');

// Setup a static folder for client-side scripts
app.use(express.static(path.join(__dirname, 'public')));

app.listen(80, () => console.log('Server started'));