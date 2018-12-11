'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = _express2.default.Router();

/* GET home page. */
router.get('/create', function (req, res, next) {
  res.sendFile('index.html', { root: './public/' });
});

router.get('/join', function (req, res, next) {
  res.sendFile('view.html', { root: './public/' });
});

exports.default = router;