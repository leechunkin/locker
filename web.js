'use strict';

globalThis.MODULE = require('./common/module.js');
const path = require('path');
const fs = require('fs');
const xmldom = require('xmldom');
require('./common/DOM.js');
require('./operation.js');
require('./web/browser/common.js');
require('./web/API.js');

MODULE.define(
	null,
	[        'common', 'API'],
	function (common,   API) {

const certificate_file = 'certificate.pem';
const key_file = 'key.pem';

const BODY_LENGTH_LIMIT = 1048576;

var port = Number.parseInt(process.env['PORT']);

const server = (
	function () {
		try {
			fs.accessSync(certificate_file, fs.constants.R_OK);
			fs.accessSync(key_file, fs.constants.R_OK);
		} catch (error) {
			port = port || 443;
			console.info('HTTP on', port);
			return require('http').createServer();
		}
		port = port || 80;
		console.info('HTTPS on', port);
		return require('http2').createSecureServer(
			{
				cert: fs.readFileSync(certificate_file),
				key: fs.readFileSync(key_file),
				allowHTTP1: true
			}
		);
	}()
);

const type_extension = {
	__proto__: null,
	'.xhtml': 'application/xhtml+xml',
	'.css': 'text/css; charset=UTF-8',
	'.js': 'application/javascript; charset=UTF-8'
};

function type_file(file) {
	for (const extension in type_extension)
		if (file.endsWith(extension))
			return type_extension[extension];
	return null;
}

function respond_file(response, file) {
	const type = type_file(file);
	if (type === null)
		return response.writeHead(404).end();
	return fs.readFile(
		path.join(file),
		(error, content) => {
			if (error !== null) {
				return response.writeHead(404).end();
			} else {
				response.setHeader('Content-Type', type);
				response.writeHead(200);
				return response.end(content);
			}
		}
	);
}

function handle_GET(response, request) {
	const rawpath = new URL(request.url, 'http://[::1]').pathname;
	if (!rawpath.startsWith('/'))
		return response.writeHead(404).end();
	const pathname = rawpath === '/' ? '/index.xhtml' : path.normalize(rawpath);
	const type = type_file(pathname);
	if (type === null)
		return response.writeHead(404).end();
	if (pathname.startsWith('/common/') || pathname.startsWith('/browser/'))
		return respond_file(response, path.join(__dirname, pathname));
	else
		return respond_file(response, path.join(__dirname, 'web', 'browser', pathname));
}

function handle_XML(response, request, body) {
	const pathname = new URL(request.url, 'http://[::1]').pathname;
	if (pathname !== common.API_URL) {
		response.setHeader('Content-Type', 'text/plain; charset=US-ASCII');
		return response.writeHead(404).end();
	}
	const xml = (new xmldom.DOMParser).parseFromString(body.toString());
	const action = xml.documentElement.tagName;
	return API.dispatch(response, xml);
}

function handle_POST(response, request) {
	const data_collection = new Array;
	request.on(
		'end',
		function () {
			if (data_collection === null) {
				response.setHeader('Content-Type', 'text/plain; charset=US-ASCII');
				return response.writeHead(500).end();
			}
			const body = Buffer.concat(data_collection);
			if (request.headers['content-type'] === 'text/xml')
				return handle_XML(response, request, body);
			return response.writeHead(400).end();
		}
	);
	request.on(
		'data',
		function (data) {
			if (data_collection === null) {
				response.setHeader('Content-Type', 'text/plain; charset=US-ASCII');
				return response.writeHead(500).end();
			}
			if (data_collection.reduce((length, chunk) => length + chunk.length, 0) > BODY_LENGTH_LIMIT) {
				data_collection = null;
				request.destory();
				response.setHeader('Content-Type', 'text/plain; charset=US-ASCII');
				return response.writeHead(413).end();
			}
			return data_collection.push(data);
		}
	);
}

server.on(
	'request',
	function (request, response) {
		switch (request.method) {
			case 'GET':
				return handle_GET(response, request);
			case 'POST':
				return handle_POST(response, request);
			default:
				return response.writeHead(405).end();
		}
	}
);

server.listen(port);

});
