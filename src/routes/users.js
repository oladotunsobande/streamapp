import express from 'express';

let router = express.Router();

/* GET users listing. */
router.post('/upload', (req, res, next) => {
    let flnm = req.body.filename;
    let fle = req.files.video;

    console.log('flnm: '+flnm);

    fle.mv(`src/tmp_files/${flnm}`, (err) => {
        if(err) console.log('File Move Err: '+err);
    });

    res.status(200).send({ "message": "Upload successful" });
});

export default router;
