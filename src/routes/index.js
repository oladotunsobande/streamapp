import express from 'express';
import path from 'path';

let router = express.Router();

/* GET home page. */
router.get('/create', (req, res, next) => {
  res.sendFile('index.html', {root: './public/'});
});

router.get('/join', (req, res, next) => {
  res.sendFile('view.html', {root: './public/'});
});

export default router;
