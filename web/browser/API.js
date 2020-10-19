'use strict';
MODULE.define(
	'API',
	[        'DOM', 'common', 'document'],
	function (DOM,   common,   document) {

const network_error = ['NETWORK'];
const format_error = ['FORMAT'];

async function XHR(path, body) {
	return new Promise(
		function (resolve, reject) {
			const xhr = new XMLHttpRequest;
			xhr.addEventListener('error', reject);
			xhr.addEventListener(
				'load',
				function () {
					if (this.status !== 200)
						return reject(this.status);
					return resolve(this.responseXML);
				}
			);
			xhr.open('POST', path, true);
			xhr.setRequestHeader('Content-Type', 'text/xml');
			return xhr.send(body);
		}
	);
}

function create_request(tag, identify) {
	const request = document.implementation.createDocument(null, tag);
	const {T, E} = DOM(request);
	request.documentElement.appendChild(
		E('identify', null,
			E('username', null, T(identify.username)),
			E('password', null, T(identify.password)))
	);
	return request;
}

async function XHR_ok(body, handle) {
	return XHR(common.API_URL, body).then(
		response => {
			if (response === null)
				return network_error;
			if (response.documentElement.tagName !== 'OK')
				return [response.documentElement.tagName];
			return handle(response);
		},
		() => network_error
	);
}

async function login(identify) {
	return XHR_ok(create_request('login', identify), async response => [null]);
}

async function list(identify, directory) {
	const request = create_request('list', identify);
	const {T, E} = DOM(request);
	request.documentElement.appendChild(
		E('directory', null, T(directory))
	);
	return XHR_ok(
		request,
		async response => {
			const directory_element_list = response.querySelectorAll('OK:root > directories:first-of-type > directory');
			const file_element_list = response.querySelectorAll('OK:root > files:first-of-type > file');
			const directories = new Array;
			for (const directory_element of directory_element_list.values()) {
				const id = common.get_int(common.get_element(directory_element, 'id'));
				if (id === null)
					return format_error;
				const name = common.get_text(common.get_element(directory_element, 'name'));
				if (name === null)
					return format_error;
				directories.push({id, name});
			}
			const files = new Array;
			for (const file_element of file_element_list.values()) {
				const name = common.get_text(common.get_element(file_element, 'name'));
				if (name === null)
					return format_error;
				files.push({name});
			}
			return [null, {directories, files}];
		}
	);
}

async function parent(identify, directory) {
	const request = create_request('parent', identify);
	const {T, E} = DOM(request);
	request.documentElement.appendChild(E('directory', null, T(directory)));
	return XHR_ok(
		request,
		async response => {
			const parent = common.get_int(response.documentElement);
			if (parent === null)
				return format_error;
			return [null, parent];
		}
	);
}

async function erase(identify, directory, name) {
	const request = create_request('erase', identify);
	const {T, E} = DOM(request);
	request.documentElement.appendChild(E('directory', null, T(directory)));
	request.documentElement.appendChild(E('name', null, T(name)));
	return XHR_ok(request, async response => [null]);
}

async function read(identify, directory, name) {
	const request = create_request('read', identify);
	const {T, E} = DOM(request);
	request.documentElement.appendChild(E('directory', null, T(directory)));
	request.documentElement.appendChild(E('name', null, T(name)));
	return XHR_ok(
		request,
		async response => {
			const nonce = common.get_text(common.get_element(response.documentElement, 'nonce'));
			if (nonce === null)
				return format_error;
			const content = common.get_text(common.get_element(response.documentElement, 'content'));
			if (content === null)
				return format_error;
			return [null, {nonce, content}];
		}
	);
}

async function create(identify, directory, name, nonce, content) {
	const request = create_request('create', identify);
	const {T, E} = DOM(request);
	request.documentElement.appendChild(E('directory', null, T(directory)));
	request.documentElement.appendChild(E('name', null, T(name)));
	request.documentElement.appendChild(E('nonce', null, T(nonce)));
	request.documentElement.appendChild(E('content', null, T(content)));
	return XHR_ok(request, async response => [null]);
}

async function change(identify, directory, origin, name, nonce, content) {
	const request = create_request('change', identify);
	const {T, E} = DOM(request);
	request.documentElement.appendChild(E('directory', null, T(directory)));
	request.documentElement.appendChild(E('origin', null, T(origin)));
	request.documentElement.appendChild(E('name', null, T(name)));
	request.documentElement.appendChild(E('nonce', null, T(nonce)));
	request.documentElement.appendChild(E('content', null, T(content)));
	return XHR_ok(request, async response => [null]);
}

return {login, list, parent, erase, read, create, change};

});
