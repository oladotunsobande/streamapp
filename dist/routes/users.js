'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = _express2.default.Router();

/* GET users listing. */
router.post('/upload', function (req, res, next) {
    var flnm = req.body.filename;
    var fle = req.files.video;

    console.log('flnm: ' + flnm);

    fle.mv('src/tmp_files/' + flnm, function (err) {
        if (err) console.log('File Move Err: ' + err);
    });

    res.status(200).send({ "message": "Upload successful" });
});

exports.default = router;