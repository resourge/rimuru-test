import { babel } from "@rollup/plugin-babel";
import { nodeResolve } from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import dts from "rollup-plugin-dts";
import fs from "fs";
import size from 'rollup-plugin-size';
import { terser } from "rollup-plugin-terser";
import { name, author, license } from './package.json';

const external = ["react"];
const globals = { react: "React" }

function createBanner(libraryName, version, authorName, license) {
	return `/**
 * ${libraryName} v${version}
 *
 * Copyright (c) ${authorName}.
 *
 * This source code is licensed under the ${license} license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license ${license}
 */`;
}
function capitalizeFirstLetter(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Package Json info
 */
const VERSION = process.env.PROJECT_VERSION;
const AUTHOR_NAME = author;
const LICENSE = license;

const getPackage = (
	SOURCE_INDEX_FILE,
	OUTPUT_DIR,
	PACKAGE_JSON
) => {
	const packageJSON = require(PACKAGE_JSON);

	packageJSON.version = VERSION;

	fs.writeFileSync(PACKAGE_JSON, JSON.stringify(packageJSON, null, 4), 'utf-8');

	const { name, author, license } = packageJSON;

	function getName() {
		const arr = name.split('/');

		return arr[arr.length - 1];
	}

	const PROJECT_NAME = getName()
	/**
	 * Folders
	 */
	const CJS_DIR = `${OUTPUT_DIR}/cjs`;
	const UMD_DIR = `${OUTPUT_DIR}/umd`;
	/**
	 * Options
	 */
	const filename = PROJECT_NAME;
	const sourcemap = true;
	const banner = createBanner(PROJECT_NAME, VERSION, AUTHOR_NAME, LICENSE);
	const umdName = PROJECT_NAME.split('-').map(capitalizeFirstLetter).join('')

	const defaultExtPlugin = [
		size(),
		nodeResolve({
			extensions: [".tsx", ".ts"]
		})
	]

	// JS modules for bundlers
	const modules = [
		{
			input: SOURCE_INDEX_FILE,
			output: {
				file: `${OUTPUT_DIR}/index.js`,
				format: "esm",
				sourcemap,
				banner: banner
			},
			external,
			plugins: [
				...defaultExtPlugin,
				babel({
					exclude: /node_modules/,
					babelHelpers: 'bundled',
					presets: [
						["@babel/preset-modules", { loose: true }],
						"@babel/preset-react",
						"@babel/preset-typescript",
					],
					plugins: ["babel-plugin-dev-expression"],
					extensions: [".ts", ".tsx"],
				})
			]
		},
		{
			input: SOURCE_INDEX_FILE,
			output: [{
				file: `${OUTPUT_DIR}/index.d.ts`,
				format: "esm",
				banner: banner
			}],
			plugins: [dts()],
		},
	];

	// JS modules for <script type=module>
	const cjsModules = [
		{
			input: SOURCE_INDEX_FILE,
			output: {
				file: `${CJS_DIR}/${filename}.development.js`,
				format: "cjs",
				sourcemap,
				banner: banner,
			},
			external,
			plugins: [
				...defaultExtPlugin,
				babel({
					exclude: /node_modules/,
					babelHelpers: 'bundled',
					presets: [
						"@babel/preset-modules",
						"@babel/preset-react",
						"@babel/preset-typescript",
					],
					plugins: ["babel-plugin-dev-expression"],
					extensions: [".ts", ".tsx"],
				}),
				replace({
					preventAssignment: true,
					'process.env.NODE_ENV': JSON.stringify('development')
				})
			]
		},
		{
			input: SOURCE_INDEX_FILE,
			output: {
				file: `${CJS_DIR}/${filename}.production.min.js`,
				format: "cjs",
				sourcemap,
				banner: banner,
			},
			external,
			plugins: [
				...defaultExtPlugin,
				babel({
					exclude: /node_modules/,
					babelHelpers: 'bundled',
					presets: [
						[
							"@babel/preset-modules",
							{
								// Don't spoof `.name` for Arrow Functions, which breaks when minified anyway.
								loose: true,
							},
						],
						[
							"@babel/preset-react",
							{
								// Compile JSX Spread to Object.assign(), which is reliable in ESM browsers.
								useBuiltIns: true,
							},
						],
						"@babel/preset-typescript",
					],
					plugins: ["babel-plugin-dev-expression"],
					extensions: [".ts", ".tsx"],
				}),
				replace({
					preventAssignment: true,
					'process.env.NODE_ENV': JSON.stringify('production')
				}),
				terser({ ecma: 8, safari10: true }),
			]
		},
	];

	// UMD modules for <script> tags and CommonJS (node)
	const umdModules = [
		{
			input: SOURCE_INDEX_FILE,
			output: {
				file: `${UMD_DIR}/${filename}.development.js`,
				format: "umd",
				sourcemap,
				banner: banner,
				globals,
				name: umdName,
			},
			external,
			plugins: [
				...defaultExtPlugin,
				babel({
					exclude: /node_modules/,
					babelHelpers: 'bundled',
					presets: [
						["@babel/preset-env", { loose: true }],
						"@babel/preset-react",
						"@babel/preset-typescript",
					],
					plugins: ["babel-plugin-dev-expression"],
					extensions: [".ts", ".tsx"],
				}),
				replace({
					preventAssignment: true,
					'process.env.NODE_ENV': JSON.stringify('development')
				}),
			]
		},
		{
			input: SOURCE_INDEX_FILE,
			output: {
				file: `${UMD_DIR}/${filename}.production.min.js`,
				format: "umd",
				sourcemap,
				banner: banner,
				globals,
				name: umdName,
			},
			external,
			plugins: [
				...defaultExtPlugin,
				babel({
					exclude: /node_modules/,
					babelHelpers: 'bundled',
					presets: [
						["@babel/preset-env", { loose: true }],
						"@babel/preset-react",
						"@babel/preset-typescript",
					],
					plugins: ["babel-plugin-dev-expression"],
					extensions: [".ts", ".tsx"],
				}),
				replace({
					preventAssignment: true,
					'process.env.NODE_ENV': JSON.stringify('production')
				}),
				terser()
			]
		},
	];
	return [...modules, ...cjsModules, ...umdModules];
}


export default function rollup(options) {
	return [
		...getPackage(
			'./src/packages/rimuru/isRimuruTheBest.ts',
			'./src/packages/rimuru/dist',
			'./src/packages/rimuru/package.json'
		),

		...getPackage(
			'./src/packages/shion/isShionTheBest.ts',
			'./src/packages/shion/dist',
			'./src/packages/shion/package.json'
		)
	];
}