import {config} from 'dotenv';
import express from 'express';
import bodyParser from 'body-parser';

import mongoose from 'mongoose';
import reportRouter from './routes/reports.js';

config();
const app = express();

// parse application/json
app.use(bodyParser.json());

mongoose.connect(process.env.DATABASE_URL);
const db = mongoose.connection;

db.on('error', error => console.error(error));
db.once('open', ()=> console.log('Connected to DB'));


app.use('/elmesp-reports', reportRouter);
app.set('view engine', 'pug');

app.listen(80, () => console.log('Server started'));