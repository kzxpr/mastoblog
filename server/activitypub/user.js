'use strict';
const express = require('express'),
      router = express.Router();

const db = require("./../../knexfile")
const knex = require("knex")(db)

const { loadActorByUsername } = require("./lib/loadActorByUsername")
const { loadFollowersByUsername } = require("./lib/loadFollowersByUsername")

router.get('/:name', async function (req, res) {
    let name = req.params.name;
    console.log("USER REQUEST for "+name)
    let domain = req.app.get('domain');
    if (!name) {
        return res.status(400).send('Bad request.');
    } else {
        loadActorByUsername(name, domain)
        .then((data) => {
            console.log("200")
            res.json(data);
        })
        .catch((err) => {
            res.status(err.statuscode).send("Error at /u/"+name+": "+err.msg)
        })
    }
});

router.get('/:username/followers', async function (req, res) {
    let username = req.params.username;
    console.log("REQ for followers", username)
    if (!username) {
        return res.status(400).send('Bad request.');
    } else {
        let domain = req.app.get('domain');
        loadFollowersByUsername(username, domain)
        .then((followersCollection) => {
            res.json(followersCollection);
        })
        .catch((e) => {
            res.json({ statusCode: 500, msg: e })
        });
    }
});

module.exports = router;