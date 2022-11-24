'use strict';
const express = require('express'),
      router = express.Router();

const db = require("./../../knexfile")
const knex = require("knex")(db)

const { createActor } = require("./lib/createActor")

router.get('/createActor', async function (req, res) {
    // pass in a name for an account, if the account doesn't exist, create it!
    const username = req.query.username;
    console.log("CREATE:", username)
    await createActor(username)
        .then(async (account) => {
            await knex("apaccounts").insert({
                ...account,
                createdAt: knex.fn.now()
            })
            .then(() => {
                res.status(200).json({ msg: 'ok' })
            })
            .catch((e) => {
                console.error("ERROR in /admin/createActor", e)
                res.status(500).json({ msg: "Error adding to database"})
            })
        })
        .catch((e) => {
            res.status(e.statusCode).json({ msg: e.msg })
        })
});

module.exports = router;