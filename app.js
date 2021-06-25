var express = require('express');
var morgan = require('morgan');
var es6Renderer = require('express-es6-template-engine');
var session = require('express-session');
var pgp = require('pg-promise')({});
var db = pgp({database: 'trivia'});

var app = express();

app.engine('html', es6Renderer);
app.set('views', 'templates');
app.set('view engine', 'html');

app.use(morgan('dev'));
app.use(session({
  secret: process.env.SECRET_KEY || 'dev',
  resave: true,
  saveUninitialized: false,
  cookie: {maxAge: 60000}
}));

app.get("/", async (request, response) => {
  var sets = await db.query('SELECT * FROM "QSet"');

  response.render('question-set', {
    locals: {title: "Pick a Question Set", sets},
    partials: {head: "/partials/head"}
  });
});

app.get("/set/:qset_id/game/", async (request, response) => {
  var qset_id = parseInt(request.params.qset_id);
  var qs = await db.query('SELECT * FROM "QSet" WHERE id = $1', qset_id);
  var offset = request.session.q || 0;
  var question = await db.one('SELECT * FROM "Question" WHERE qset_id = $1 ORDER BY id LIMIT 1 OFFSET $2', [qset_id, offset]);
  console.log(question);

  response.render('game', {
    locals: {title: "Game", set: qs, question: question},
    partials: {head: "/partials/head"}
  });
});

app.post("/set/:qset_id/game/", async (request, response) => {
  var qset_id = parseInt(request.params.qset_id);
  var result = await db.query('SELECT COUNT(*) FROM "Question" WHERE qset_id = $1', qset_id);
  count = parseInt(result.count);

  // get ans from the body
  // check correct
  // save the score

  // go to the next question
  var q = request.session.q || 0;
  q = q + 1;

  if (q >= count) {
    request.session.q = 0;
    // request.session.score
    response.redirect(`../score/`);
  } else {
    request.session.q = q;
    response.redirect(`./?ts=${Date.now()}`);
  }
});


app.listen(8000, function () {
  console.log('Listening on port 8000');
});
