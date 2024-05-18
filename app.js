require('dotenv').config()

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const { rateLimit } = require('express-rate-limit')

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var identiconRouter = require('./routes/identicon');
var corsRouter = require('./routes/cors');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const limiter = rateLimit({
	windowMs: 60 * 1000, // 1 minute
	limit: 60, // Limit each IP to 60 requests per `window`
	standardHeaders: 'draft-7',
	legacyHeaders: false,
})

app.use('/identicon', limiter)

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/identicon', identiconRouter);
app.use('/spotify', corsRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
