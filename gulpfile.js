const gulp = require('gulp'),
      sass = require('gulp-sass')(require('sass'));
      webpack = require('webpack-stream')
      svgSprite = require('gulp-svg-sprite');

const svgspriteConfig = {
    mode: {
        symbol: true
    }
};

/**
 * Compile the site main css.
 */
const css = () => {
    return gulp.src('./Portfolio.Web/UI/scss/main.scss')
        .pipe(sass())
        .pipe(gulp.dest('./Portfolio.Web/wwwroot/css'));
}

/**
 * Compile the site main JS.
 */
const js = () => {
    const config = Object.assign(require('./webpack.config.js', {
        output: {
            fileName: 'generic.bundle.js'
        }
    }, {}))

    return gulp.src('./Portfolio.Web/UI/ts/root/generic.ts')
        .pipe(webpack(config))
        .pipe(gulp.dest('./Portfolio.Web/wwwroot/js'));
}

const svg = () => {
    return gulp.src('*.svg', { cwd: 'Portfolio.Web/UI/assets/svgs' })
    .pipe(svgSprite(svgspriteConfig))
    .pipe(gulp.dest('Portfolio.Web/wwwroot/assets/svg'));
}

/**
 * Compile frontend.
 */
const buildFrontEnd = gulp.series(css, js, svg);

module.exports = {
    css,
    js,
    svg,
    buildFrontEnd
}