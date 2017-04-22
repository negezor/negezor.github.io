'use strict';

const webpack = require('webpack');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const { resolve: pathResolve } = require('path');

const { CommonsChunkPlugin } = webpack.optimize;

const { NODE_ENV = 'development' } = process.env;

//const NODE_ENV = 'production';

const src = pathResolve(__dirname, 'src');
const assets = pathResolve(__dirname, 'assets');

const js = pathResolve(src, 'js');

const ignoreNodeModules = /node_modules/;

const extractSass = new ExtractTextPlugin({
	filename: addHash('bundle.css', 'contenthash'),
	disable: NODE_ENV === 'development',
	allChunks: true
});

module.exports = {
	entry: {
		bundle: pathResolve(js, 'main')
	},

	output: {
		path: assets,
		publicPath: '/assets/',
		filename: addHash('[name].js', 'chunkhash')
	},

	watch: NODE_ENV === 'development',
	watchOptions: {
		aggregateTimeout: 150,
		ignored: ignoreNodeModules
	},

	devtool: NODE_ENV === 'development'
		? 'source-map'
		: false,

	module: {
		rules: [{
			test: /\.js$/,
			exclude: ignoreNodeModules,
			use: {
				loader: 'babel-loader',
				options: {
					presets: ['env'],
					plugins: ['transform-runtime']
				}
			}
		}, {
			test: /\.scss$/,
			use: extractSass.extract({
				use: [{
					loader: 'css-loader',
					options: {
						sourceMap: true,
						minimize: true
					}
				}, {
					loader: 'sass-loader'
				}, {
					loader: 'resolve-url-loader'
				}],
				fallback: 'style-loader'
			})
		}, {
			test: /\.(png|jpg|svg|ttf|eof|woff|woff2)/,
			loader: 'url-loader',
			query: {
				limit: 1000000, // 1mb
				name: addHash('[path][name].[ext]', 'hash:6'),
				useRelativePath: NODE_ENV === 'production',
			}
		}]
	},

	plugins: [
		extractSass,

		/*
		new CommonsChunkPlugin({
			name: 'bundle'
		}),
		*/
	]
};

const { plugins, entry } = module.exports;

if (NODE_ENV === 'production') {
	plugins.push(new UglifyJSPlugin);
}

if (NODE_ENV === 'development') {
	entry.bundle = [
		'webpack-dev-server/client',
		entry.bundle
	];

	plugins.push(
		new webpack.HotModuleReplacementPlugin
	);

	module.exports.devServer = {
		host: 'localhost',
		port: 8000,
		hot: true
	};
}

/**
 * Добавляет хэш на продакшн
 *
 * @param {string} template
 * @param {string} name
 *
 * @return {stirng}
 */
function addHash(template, hash) {
	if (NODE_ENV === 'development') {
		return template;
	}

	return template.replace(/\.[^.]+$/, `.[${hash}]$&`);
}
