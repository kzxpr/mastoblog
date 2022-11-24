'use strict';
const express = require('express'),
      router = express.Router();

const { loadWebfingerByUsername } = require("./lib/loadWebfingerByUsername")

router.get('/', async function (req, res) {
    let resource = req.query.resource;
    console.log("WEBFINGER REQ!!!", resource)
    if (!resource || !resource.includes('acct:')) {
        return res.status(400).send('Bad request. Please make sure "acct:USER@DOMAIN" is what you are sending as the "resource" query parameter.');
    } else {
        let account = resource.replace('acct:','');
        const parts = account.split("@");
        loadWebfingerByUsername(parts[0], parts[1])
        .then((data) => {
            res.json(data);
        })
        .catch((err) => {
            console.error(err)
            res.status(err.statuscode).send(err.msg);
        })
    }
});

module.exports = router;