require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.PORT || 3011;

/* KNEX */
const { Tag, Post } = require("./server/models/db")
const db = require("./knexfile")
const knex = require("knex")(db)

/* CORS */
const cors = require('cors')

/* PATH */
const path = require("path")

/* PASS PROXY - TO GET IPs */
app.set('trust proxy',true); 

/* BODY PARSER */
var bodyParser = require('body-parser')
app.use(bodyParser.json({type: 'application/activity+json'})); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

/* LOAD CONFIG */
async function getConfigByKey(key){
    return await knex("config").where("key", "=", key).first().select("value").then((d) => { return d.value });
}

async function loadConfig(){
    const my_domain = await getConfigByKey("domain")
    app.set('domain', my_domain);
}

loadConfig();

/* BASIC AUTH FOR ACTIVITY PUB */
basicAuth = require('express-basic-auth');
let basicUserAuth = basicAuth({
    authorizer: asyncAuthorizer,
    authorizeAsync: true,
    challenge: true
});

function asyncAuthorizer(username, password, cb) {
    let isAuthorized = false;
    const isPasswordAuthorized = username === process.env.AP_USER;
    const isUsernameAuthorized = password === process.env.AP_PASS;
    isAuthorized = isPasswordAuthorized && isUsernameAuthorized;
    if (isAuthorized) {
        return cb(null, true);
    }
    else {
        return cb(null, false);
    }
}

/* ACTIVITY PUB */
const ap_admin = require("./server/activitypub/admin")
const ap_webfinger = require("./server/activitypub/webfinger")
const ap_user = require("./server/activitypub/user")
app.use("/ap/admin", cors({ credentials: true, origin: true }), basicUserAuth);
app.use("/ap/admin/api", ap_admin)
app.use("/.well-known/webfinger/", cors(), ap_webfinger)
app.use("/u", cors(), ap_user)

app.get("/ap/admin/logs", async(req, res) => {
    await knex("aprequests").where("timestamp", ">", knex.raw("now() - interval 24 hour")).orderBy("timestamp", "desc")
    .then((logs) => {
        res.render("logs", { logs })
    })
    .catch((e) => {
        res.sendStatus(404)
    })
})

app.get("/ap/admin/logs/:logid", async(req, res) => {
    const { logid } = req.params;
    await knex("aprequests").where("id", "=", logid).first()
    .then((log) => {
        res.render("logitem", { log })
    })
    .catch((e) => {
        res.sendStatus(404)
    })
})

app.get("/ap/admin", (req, res) => {
    res.sendFile(path.join(__dirname, "server", "activitypub", "admin.html"))
})

app.get("/public/007.png", (req, res) => {
    //console.log("0000000000000007")
    res.sendFile(path.join(__dirname, "public", "007.png"))
})
//app.use('/public', express.static(__dirname + '/public'));

function fillWithZero(str, len){
    var countstr = str.toString();
    return "0".repeat(len - countstr.length)+str;
}

/* HBS */
const exphbs  = require('express-handlebars');
const config = {
	extname: '.hbs',
};
const hbs = exphbs.create(config);
hbs.handlebars.registerHelper('neq', function(arg1, arg2, options) {
    return (arg1 != arg2) ? true : false;
});
hbs.handlebars.registerHelper('eq', function(arg1, arg2, options) {
    return (arg1 == arg2) ? true : false;
});
hbs.handlebars.registerHelper('prettydatetime', function (datetime) {
    if(datetime){
        const my_date = new Date(datetime)
        return my_date.getDate() + "/" + (my_date.getMonth() + 1) + "-" + my_date.getFullYear() + " " + my_date.getHours() + ":" + fillWithZero(my_date.getMinutes(), 2) + ":" + fillWithZero(my_date.getSeconds(), 2);
    }else{
        return;
    }
})
hbs.handlebars.registerHelper('gt', function(arg1, arg2, options) {
    return (arg1 > arg2) ? true : false;
});

hbs.handlebars.registerHelper('lt', function(arg1, arg2, options) {
    return (arg1 < arg2) ? true : false;
});
hbs.handlebars.registerHelper('count', function(arr){
    if(arr){
        return arr.length;
    }else{
        return null;
    }
});
app.engine("hbs", hbs.engine);
app.set("view engine", "hbs");

async function getSiteInfo(){
    const sitetitle = await getConfigByKey("sitetitle");
    const sitesubtitle = await getConfigByKey("sitesubtitle")
    const user_url = await getConfigByKey("user_url")
    return {
        sitetitle,
        sitesubtitle,
        my_url: user_url,
        footer: "This website is running on <a href='https://github.com/kzxpr/mastoblog' target='_new'>MastoBlog</a>. Download the repository and host your own!",
        links: [ { name: "MastoBlog code", url: "https://github.com/kzxpr/mastoblog" } ],
        followers: [
            { name: "user1" },
            { name: "user2" },
        ]
    }
    // "https://toot.community/users/openculture",
}

app.post("/followme", async (req, res) => {
    const { your_instance } = req.body;
    const siteinfo = await getSiteInfo();
    
    if(!your_instance){
        const text = "Please specify an instance of Mastodoon (e.g. 'mastodon.social')";
        res.render("text", { ...siteinfo, text });
    }
    /*if (!(/^@[^@]+@[^\.]+\..+$/.test(your_instance))) {
        const text = "Your instance should be in the format @username@instance.social!";
        res.render("text", { ...siteinfo, text });
    }else*/
    if (your_instance.indexOf('/') === -1) {
        res.redirect("https://"+your_instance+"/authorize_interaction?uri="+encodeURIComponent(siteinfo.my_url))
    }else{
        const text = "Please enter your instance without https:// or other paths!";
        res.render("text", { ...siteinfo, text });
    }
})

app.get(["/what"], async (req, res) => {
    const siteinfo = await getSiteInfo();
    const text = "<h2>What?</h2>Hvad er <a href='https://joinmastodon.org/' target='_new'>Mastodon</a>?";
    res.render("text", { ...siteinfo, text });
})

app.get(["/", "/page", "/post", "/tag", "/page/:pageno", "/post/:postid", "/tag/:tagname", "/tag/:tagname/page/:pageno", "/tag/:tagname/post/:postid"], async (req, res) => {
    var postid=null;
    var tagname=null;
    var pageno=0;
    var postprpage = 10;
    if(req.params.postid){
        postid = req.params.postid;
    }
    if(req.params.tagname){
        tagname = req.params.tagname;
    }
    if(req.params.pageno){
        pageno = req.params.pageno;
    }
    nextpage = parseInt(pageno) + 1;
    var pagetitle="";

    var posts;
    if(postid!==null){
        posts = await Post.query().where("id", "=", postid).andWhere("hidden", "=", 0).orderBy("createdAt", "desc").withGraphFetched("tags.^1")
        pagetitle = posts[0].title;
    }else if(tagname!==null){
        posts = await Tag.query().where("url_friendly", "=", tagname).withGraphFetched("posts.tags.^1").first().then(async(tag) => {
            return tag.posts;
        })
    }else{
        posts = await Post.query().where("hidden", "=", 0).orderBy("createdAt", "desc").offset(pageno*postprpage).limit(postprpage).withGraphFetched("tags.^1")
    }

    const siteinfo = await getSiteInfo();

    const tags = await Tag.query().where("hidden", "=", 0).orderBy("name", "asc")

    res.render("blog",
        {
            ...siteinfo,
            pagetitle,
            tagname: tagname,
            tags,
            posts,
            nextpage
        })
});

app.get("/alive", (req, res) => {
    console.log("TRIGGER")
    res.send("ALIVE!!")
})

app.listen(port, () => {
    console.log("Listen on the port "+port);
});