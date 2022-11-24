const express = require("express");
const app = express();

/* KNEX */
const { Tag, Post } = require("./server/models/db")

const cors = require('cors')

app.set('domain', "hackademiet.dk");
const ap_admin = require("./server/activitypub/admin")
const ap_webfinger = require("./server/activitypub/webfinger")
const ap_user = require("./server/activitypub/user")
const ap_inbox = require("./server/activitypub/inbox")
app.use("/ap/admin", ap_admin)
app.use("/.well-known/webfinger/", cors(), ap_webfinger)
app.use("/u", cors(), ap_user)
app.use("/api/inbox", cors(), ap_inbox)

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

/* BODY PARSER */
var bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: false }))

async function getSiteInfo(){
    return {
        sitetitle: "Hackademiet.dk",
        sitesubtitle: "> Hej",
        instance: "test@hackademiet.dk",
        my_url: "test@hackademiet.dk",
        footer: "Goodbye World!",
        links: [ { name: "VHS-fabrikken", url: "https://vhs-fabrikken.dk" } ],
        followers: [
            { name: "Kasper" },
            { name: "Trine" },
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
    const text = "<h2>What?</h2>Hvad er Mastodon?";
    res.render("text", { ...siteinfo, text });
})

app.get(["/", "/page", "/post", "/tag", "/page/:pageno", "/post/:postid", "/tag/:tagid", "/tag/:tagid/page/:pageno", "/tag/:tagid/post/:postid"], async (req, res) => {
    var postid=null;
    var tagid=null;
    var pageno=0;
    var postprpage = 10;
    if(req.params.postid){
        postid = req.params.postid;
    }
    if(req.params.tagid){
        tagid = req.params.tagid;
    }
    if(req.params.pageno){
        pageno = req.params.pageno;
    }
    nextpage = parseInt(pageno) + 1;

    var posts;
    if(postid!==null){
        posts = await Post.query().where("id", "=", postid).andWhere("hidden", "=", 0).orderBy("createdAt", "desc").withGraphFetched("tags.^1")
    }else if(tagid!==null){
        posts = await Tag.query().where("id", "=", tagid).withGraphFetched("posts.tags.^1").first().then(async(tag) => {
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
            tagid: tagid,
            tags,
            posts,
            nextpage
        })
});

app.listen(3000, () => {
    console.log("Listen on the port 3000...");
});