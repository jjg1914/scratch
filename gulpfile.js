var gulp = require("gulp");
var nodemon = require("nodemon");
var sourcemaps = require("gulp-sourcemaps");
var sass = require("gulp-sass");
var mustache = require("gulp-mustache");
var htmlmin = require("gulp-htmlmin");
var autoprefixer = require("gulp-autoprefixer");
var uglify = require("gulp-uglify");
var cssmin = require("gulp-cssmin");
var rename = require("gulp-rename");
var gulpIf = require("gulp-if");
var source = require("vinyl-source-stream");
var buffer = require("vinyl-buffer");
var lazypipe = require("lazypipe");
var browserify = require("browserify");
var watchify = require("watchify");
var tsify = require("tsify");
var del = require("del");

var b = browserify({
  entries: [ "./src/index.ts" ],
  debug: (process.env.NODE_ENV != "production"),
  cache: {},
  packageCache: {},
  plugin: [ tsify ],
});

function bundle() {
  return b.bundle()
    .pipe(source("index.js"))
    .pipe(buffer())
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(gulpIf((process.env.NODE_ENV == "production"), lazypipe()
      .pipe(uglify)
      .pipe(rename, { suffix: ".min" })()))
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest("public"));
}

if (process.env.NODE_ENV != "production") {
  b = watchify(b);
  b.on("update", bundle);
  gulp.watch("src/**/*.scss", [ "css" ]);
  gulp.watch("src/**/*.html", [ "html" ]);
}

gulp.task("default", [ "server" ]);

gulp.task("server", [ "build" ], function(done) {
  nodemon({
    script: "server.js",
    ext: "js",
    ignore: [ "public/**/*" ]
  }).on("quit", done);
});

gulp.task("build", [ "js", "css", "html" ]);

gulp.task("js", bundle);
b.on("log", function(msg) { console.log(msg); });

gulp.task("css", function() {
  return gulp.src("src/index.scss")
    .pipe(sourcemaps.init())
    .pipe(sass().on("error", sass.logError))
    .pipe(autoprefixer())
    .pipe(gulpIf((process.env.NODE_ENV === "production"), lazypipe()
      .pipe(cssmin)
      .pipe(rename, { suffix: ".min" })()))
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest("public"));
});

gulp.task("html", function() {
  return gulp.src("src/index.html")
    .pipe(mustache({
      production: (process.env.NODE_ENV === "production")
    }))
    .pipe(gulpIf((process.env.NODE_ENV === "production"), lazypipe()
      .pipe(htmlmin)()))
    .pipe(gulp.dest("public"));
});

gulp.task("clean", function() {
  return del([ "public/**/*" ]);
});
