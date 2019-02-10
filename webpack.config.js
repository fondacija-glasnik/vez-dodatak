const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const ZipPlugin = require('zip-webpack-plugin');

module.exports = () => ({
    entry: {
        options: ['./src/scripts/options.js', './src/styles/options.scss'],
        popup: ['./src/scripts/popup.js', './src/styles/popup.scss'],
        history: ['./src/scripts/history.js', './src/styles/history.scss'],
        background: ['./src/scripts/background.js']
    },
    output: {
        path: path.resolve(__dirname, 'extension', process.env.TARGET),
        filename: 'js/[name].js',
        publicPath: ''
    },
    node: {
        fs: 'empty'
    },
    module: {
        rules: [
            {
                test: /\.m?js$/,
                exclude: /(node_modules|bower_components)/,
                loader: 'babel-loader'
            },
            {
                test: /\.(html)$/,
                use: {
                    loader: 'html-loader',
                    options: {
                        attrs: [':data-src']
                    }
                }
            },
            {
                test: /\.svg$/,
                loader: 'url-loader'
            },
            {
                test: /\.scss$/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            name: '[name].css',
                            context: './src/styles/',
                            outputPath: 'css/',
                            publicPath: '../'
                        }
                    },
                    {
                        loader: 'extract-loader'
                    },
                    {
                        loader: 'css-loader',
                        options: {
                            sourceMap: true
                        }
                    },
                    {
                        loader: 'resolve-url-loader'
                    },
                    {
                        loader: 'postcss-loader',
                        options: {
                            plugins: function () {
                                return [
                                    require('precss'),
                                    require('autoprefixer')
                                ];
                            }
                        }
                    },
                    {
                        loader: 'sass-loader',
                    }
                ]
            }
        ]
    },
    plugins: [
        new CleanWebpackPlugin([
            `extension/${process.env.TARGET}`,
            `extension/${process.env.TARGET}.zip`
        ]),
        new CopyWebpackPlugin([
            {
                from: 'src/assets',
                to: 'assets'
            },
            {
                from: `src/manifest.${process.env.TARGET}.json`,
                to: 'manifest.json'
            }
        ]),
        new HtmlWebpackPlugin({
            template: 'src/opcije.html',
            inject: false,
            filename: 'opcije.html'
        }),
        new HtmlWebpackPlugin({
            template: 'src/prozor.html',
            inject: false,
            filename: 'prozor.html'
        }),
        new HtmlWebpackPlugin({
            template: 'src/istorija.html',
            inject: false,
            filename: 'istorija.html'
        })
    ],
    optimization: {
        minimizer: [
            new OptimizeCssAssetsPlugin({
                assetNameRegExp: /\.css$/g,
                cssProcessor: require('cssnano'),
                cssProcessorOptions: {
                    map: false
                },
                cssProcessorPluginOptions: {
                    preset: ['default', { discardComments: { removeAll: true } }],
                },
                canPrint: true
            }),
            new TerserPlugin({
                cache: true,
                parallel: true
            }),
            new ZipPlugin({
                path: path.resolve(__dirname, 'extension'),
                filename: `${process.env.TARGET}.zip`
            })
        ]
    },
    devServer: {
        port: 3000,
        contentBase: './extensions'
    }
});
 
