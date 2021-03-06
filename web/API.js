'use strict';
MODULE.define(
	'API',
	[        'DOM', 'common', 'operation'],
	function (DOM,   common,   operation) {

const {XMLSerializer} = require('xmldom');

function respond_empty(response, status) {
	response.setHeader('Content-Type', 'text/plain; charset=US-ASCII');
	return response.writeHead(status).end();
}

function respond_XML(response, xml) {
	const string = (new XMLSerializer).serializeToString(xml);
	response.setHeader('Content-Type', 'text/xml');
	return response.writeHead(200).end(string);
}

function simple_respond(response, implementation, result) {
	return respond_XML(response, implementation.createDocument(null, result[0] === null ? 'OK' : result[0]));
}

function text_respond(response, implementation, result) {
	if (result[0] !== null)
		return respond_XML(response, implementation.createDocument(null, result[0]));
	const output = implementation.createDocument(null, 'OK');
	output.documentElement.appendChild(output.createTextNode(result[1].toString()));
	return respond_XML(response, output);
}

const handle = {
	__proto__: null,
	async login(response, username, input) {
		return respond_XML(response, input.implementation.createDocument(null, 'OK'));
	},
	async passwd(response, username, input) {
		const password = common.get_text(common.get_element(input.documentElement, 'password'));
		if (password === null)
			return respond_empty(response, 400);
		return simple_respond(response, input.implementation, await operation.passwd(username, password));
	},
	async userdel(response, username, input) {
		return simple_respond(response, input.implementation, await operation.userdel(username));
	},
	async useradd(response, username, input) {
		const new_username = common.get_text(common.get_element(input.documentElement, 'username'));
		const new_password = common.get_text(common.get_element(input.documentElement, 'password'));
		return simple_respond(response, input.implementation, await operation.useradd(new_username, new_password));
	},
	async list(response, username, input) {
		const directory = common.get_int(common.get_element(input.documentElement, 'directory'));
		if (directory === null)
			return respond_empty(response, 400);
		const result = await operation.list(username, directory);
		if (result[0] !== null)
			return respond_XML(response, input.implementation.createDocument(null, result[0]));
		const output = input.implementation.createDocument(null, 'OK');
		const {T, E} = DOM(output);
		output.documentElement.appendChild(
			E('name', null, T(result[1].name)));
		output.documentElement.appendChild(
			E('directories', null,
				result[1].directories.map(
					directory =>
						E('directory', null,
							E('id', null, T(directory.id)),
							E('name', null, T(directory.name)))))
		);
		output.documentElement.appendChild(
			E('files', null,
				result[1].files.map(
					file =>
						E('file', null,
							E('name', null, T(file.name)))))
		);
		return respond_XML(response, output);
	},
	async parent(response, username, input) {
		const directory = common.get_int(common.get_element(input.documentElement, 'directory'));
		if (directory === null)
			return respond_empty(response, 400);
		return text_respond(response, input.implementation, await operation.parent(username, directory));
	},
	async mkdir(response, username, input) {
		const directory = common.get_int(common.get_element(input.documentElement, 'directory'));
		if (directory === null)
			return respond_empty(response, 400);
		const name = common.get_text(common.get_element(input.documentElement, 'name'));
		if (name === null)
			return respond_empty(response, 400);
		return simple_respond(response, input.implementation, await operation.mkdir(username, directory, name));
	},
	async rename_dir(response, username, input) {
		const directory = common.get_int(common.get_element(input.documentElement, 'directory'));
		if (directory === null)
			return respond_empty(response, 400);
		const name = common.get_text(common.get_element(input.documentElement, 'name'));
		if (name === null)
			return respond_empty(response, 400);
		return simple_respond(response, input.implementation, await operation.rename_dir(username, directory, name));
	},
	async rmdir(response, username, input) {
		const directory = common.get_int(common.get_element(input.documentElement, 'directory'));
		if (directory === null)
			return respond_empty(response, 400);
		return text_respond(response, input.implementation, await operation.rmdir(username, directory));
	},
	async erase(response, username, input) {
		const directory = common.get_int(common.get_element(input.documentElement, 'directory'));
		if (directory === null)
			return respond_empty(response, 400);
		const name = common.get_text(common.get_element(input.documentElement, 'name'));
		if (name === null)
			return respond_empty(response, 400);
		return simple_respond(response, input.implementation, await operation.erase(username, directory, name));
	},
	async read(response, username, input) {
		const directory = common.get_int(common.get_element(input.documentElement, 'directory'));
		if (directory === null)
			return respond_empty(response, 400);
		const name = common.get_text(common.get_element(input.documentElement, 'name'));
		if (name === null)
			return respond_empty(response, 400);
		const result = await operation.read(username, directory, name);
		if (result[0] !== null)
			return respond_XML(response, input.implementation.createDocument(null, result[0]));
		const output = input.implementation.createDocument(null, 'OK');
		const {T, E} = DOM(output);
		output.documentElement.appendChild(E('nonce', null, result[1].nonce.toString()));
		output.documentElement.appendChild(E('content', null, result[1].content.toString()));
		return respond_XML(response, output);
	},
	async create(response, username, input) {
		const directory = common.get_int(common.get_element(input.documentElement, 'directory'));
		if (directory === null)
			return respond_empty(response, 400);
		const name = common.get_text(common.get_element(input.documentElement, 'name'));
		if (name === null)
			return respond_empty(response, 400);
		const nonce = common.get_text(common.get_element(input.documentElement, 'nonce'));
		if (nonce === null)
			return respond_empty(response, 400);
		const content = common.get_text(common.get_element(input.documentElement, 'content'));
		if (content === null)
			return respond_empty(response, 400);
		return simple_respond(response, input.implementation, await operation.create(username, directory, name, nonce, content));
	},
	async change(response, username, input) {
		const directory = common.get_int(common.get_element(input.documentElement, 'directory'));
		if (directory === null)
			return respond_empty(response, 400);
		const origin = common.get_text(common.get_element(input.documentElement, 'origin'));
		if (origin === null)
			return respond_empty(response, 400);
		const name = common.get_text(common.get_element(input.documentElement, 'name'));
		if (name === null)
			return respond_empty(response, 400);
		const nonce = common.get_text(common.get_element(input.documentElement, 'nonce'));
		if (nonce === null)
			return respond_empty(response, 400);
		const content = common.get_text(common.get_element(input.documentElement, 'content'));
		if (content === null)
			return respond_empty(response, 400);
		const result = await operation.change(username, directory, origin, name, nonce, content);
		return simple_respond(response, input.implementation, result);
	}
};

async function dispatch(response, xml) {
	if (xml.documentElement === null)
		return respond_empty(response, 400);
	try {
		const identify_element = common.get_element(xml.documentElement, 'identify');
		if (identify_element === null)
			return respond_empty(response, 400);
		var username = common.get_text(common.get_element(identify_element, 'username'));
		var password = common.get_text(common.get_element(identify_element, 'password'));
	} catch (error) {
		if (error === common.FormatError)
			return respond_empty(response, 400);
		else
			throw error;
	}
	if (!await operation.authorize(username, password)) {
		const output = xml.implementation.createDocument();
		output.appendChild(DOM(output).E('UNAUTHORIZED'));
		return respond_XML(response, output);
	}
	const tag = xml.documentElement.tagName;
	const action = handle[tag];
	if (typeof action !== 'function') {
		console.warn('Unknown request action: "%o"', tag);
		return respond_empty(response, 400);
	}
	return action(response, username, xml);
}

return {dispatch};

});
