'use strict';
MODULE.define(
	null,
	[        'API', 'DOM', 'document'],
	function (API,  {T, E}) {

function State() {
	this.reset();
	return this;
}
Object.assign(
	State.prototype,
	{
		reset() {
			this.username = null;
			this.password = null;
			this.directory = 0;
			this.key = {
				text: '',
				file: null,
				crypto: null
			};
		}
	}
);

const state = new State;

const base16 = {
	encode(buffer) {
		var i, x0, x1;
		var u8a = new Uint8Array(buffer);
		var a = new Array(u8a.length);
		for (i = 0; i < u8a.length; ++i) {
			x1 = this.encode.table[(u8a[i] >> 4) & 0x0F];
			x0 = this.encode.table[u8a[i] & 0x0F];
			a[i] = x1 + x0;
		}
		return a.join('');
	},
	decode(string) {
		var i, x0, x1;
		var length = string.length >> 1;
		var bytes = new Uint8Array(length);
		for (i = 0; i < length; ++i) {
			x1 = this.decode.table[string[i << 1]];
			x0 = this.decode.table[string[(i << 1) + 1]];
			bytes[i] = (x1 << 4) | x0;
		}
		return bytes.buffer;
	}
};
base16.encode.table = '0123456789ABCDEF';
base16.decode.table = {
	__proto__: null,
	'0': 0, '1': 1, '2': 2, '3': 3, '4': 4,
	'5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
	'A': 10, 'B': 11, 'C': 12, 'D': 13, 'E': 14, 'F': 15,
	'a': 10, 'b': 11, 'c': 12, 'd': 13, 'e': 14, 'f': 15
};

function incorrect_password_page() {
	const page =
		E('main', {'class': 'incorrect_password'},
			'Incorrect login password!',
			E('a', {'class': 'link', 'event$': {'click': click}},
				'Back to login page'));
	function click(event) {
		event.preventDefault();
		const parent = page.parentNode;
		if (parent != null) {
			parent.insertBefore(login_page(), page)
			return parent.removeChild(page);
		}
	}
	return page;
}

function login_page() {
	const page =
		E('main', {'class': 'login'},
			E('form', {'event$': {'submit': submit}},
				E('label', null,
					'Username ',
					E('input', {'type': 'text'})),
				E('label', null,
					'Password ',
					E('input', {'type': 'password'})),
				E('button', {'type': 'submit'},
					'Log-in')));
	async function submit(event) {
		event.preventDefault();
		const inputs = page.getElementsByTagName('input');
		const username_input = inputs.item(0);
		const password_input = inputs.item(1);
		const parent = page.parentNode;
		const username = username_input.value;
		const password = password_input.value;
		if (await API.login(username, password)) {
			state.username = username;
			state.password = password;
			if (parent != null) {
				parent.insertBefore(main_page(), page)
				return parent.removeChild(page);
			}
		} else {
			if (parent != null) {
				parent.insertBefore(incorrect_password_page(), page)
				return parent.removeChild(page);
			}
		}
	}
	return page;
}

function main_error(main) {
	state.reset();
	alert('Error!');
	const parent = main.parentNode;
	parent.insertBefore(login_page(), main)
	return parent.removeChild(main);
}

function logout_section(main) {
	const section =
		E('section', {'class': 'logout'},
			E('form', {'event$': {'submit': submit}},
				'Confirm ', E('button', {'type': 'submit'}, 'Log-out'), ' ', T(state.username)));
	function submit(event) {
		event.preventDefault();
		state.reset();
		const parent = main.parentNode;
		if (parent !== null) {
			parent.insertBefore(login_page(), main)
			return parent.removeChild(main);
		}
	}
	return section;
}

function key_section() {
	const text_input = E('input', {'type': 'text', 'value': state.key.text});
	const file_input = E('input', {'type': 'file', 'event$': {'change': file_change}});
	const section =
		E('section' , {'class': 'key'},
			E('form' , {'event$': {'submit': form_submit}},
				E('label', null, 'Key text ', text_input),
				E('label', null, 'Key file ', file_input),
				E('button', {'type': 'submit'}, 'Use')));
	function file_change(event) {
		event.preventDefault();
		if (file_input.files.length < 1) {
			state.key.file = null;
			return;
		}
		const reader = new FileReader;
		reader.addEventListener(
			'load',
			function () {
				state.key.file = new Uint8Array(this.result);
			}
		);
		return reader.readAsArrayBuffer(file_input.files.item(0));
	}
	async function update_key() {
		const text_buffer = (new TextEncoder).encode(state.key.text);
		if (state.key.file === null) {
			var clear = text_buffer;
		} else {
			var clear = new Uint8Array(text_buffer.length + state.key.file.length);
			clear.set(text_buffer, 0);
			clear.set(state.key.file, text_buffer.length);
		}
		const hash = await crypto.subtle.digest('SHA-256', clear);
		const usages = ['encrypt', 'decrypt'];
		state.key.crypto = await crypto.subtle.importKey('raw', new Uint8Array(hash), {name: 'AES-GCM'}, true, usages);
	}
	async function form_submit(event) {
		event.preventDefault();
		state.key.text = text_input.value;
		return update_key();
	}
	return section;
}

function list_section(main, open_file) {
	const output = E('div', null, 'Loading...');
	const section =
		E('section', {'class': 'list'},
			E('button', {'type': 'button', 'event$': {'click': refresh_click}}, 'Refresh'),
			output);
	var directories = [];
	var files = [];
	async function load() {
		const result = await API.list(state.username, state.password, state.directory);
		if (result === null)
			return main_error(main);
		output.textContent = null;
		directories = result.directories;
		files = result.files;
		if (state.directory !== 0)
			output.appendChild(
				E('button', {'type': 'button', 'event$': {'click': parent_click}},
					'upper directory')
			);
		void function () {
			const container = E('ul');
			for (const directory of directories)
				container.appendChild(
					E('li', null,
						E('button', {'type': 'button', 'event$': {'click': directory_click(directory.id)}},
							'open'),
						' ',
						T(directory.name))
				);
			return output.appendChild(container);
		}();
		void function () {
			const container = E('ol');
			for (const file of files)
				container.appendChild(
					E('li', null,
						E('button', {'type': 'button', 'event$': {'click': delete_click(file.name)}},
							'delete'),
						E('button', {'type': 'button', 'event$': {'click': edit_click(file.name)}},
							'edit'),
						' ',
						T(file.name))
				);
			return output.appendChild(container);
		}();
	}
	async function refresh_click() {
		event.preventDefault();
		return load();
	}
	async function parent_click(event) {
		event.preventDefault();
		const parent = await API.parent(state.username, state.password, state.directory);
		if (parent === null)
			return main_error(main);
		state.directory = parent;
		return load();
	}
	function directory_click(directory) {
		return async function click(event) {
			event.preventDefault();
			state.directory = directory;
			return load();
		};
	}
	function delete_click(file) {
		return async function click(event) {
			event.preventDefault();
			if (confirm('Delete file "' + file + '" ?')) {
				await API.erase(state.username, state.password, state.directory, file);
				return load();
			}
		};
	}
	function edit_click(file) {
		return async function click(event) {
			event.preventDefault();
			return open_file(file);
		};
	}
	load();
	return section;
}

function data_section(main, origin) {
	var origin_input, origin_field;
	if (state.key.crypto === null)
		return E('section', {'class': 'data-empty-key'}, 'Encryption key is not set properly.');
	const section = E('section', {'class': 'data'}, 'Loading...');
	const name_input = E('input', {'type': 'text'});
	const content_input = E('textarea', null);
	function make_origin_field() {
		origin_input =
			E('input', {'type': 'text', 'disabled': '', 'value': origin});
		origin_field =
			E('div', null, 'Origin title ',
				origin_input,
				E('button', {'type': 'button', 'event$': {'click': new_click}}, 'Create new file'));
	}
	async function load_origin() {
		if (origin === null) {
			origin_input = null;
			origin_field = E('div', null, 'New file');
		} else {
			if (state.key.crypto === null)
				return alert('Encryption key is not set properly.');
			const data = await API.read(state.username, state.password, state.directory, origin);
			if (data === false)
				return main_error(main);
			const iv = base16.decode(data.nonce);
			const chiper_code = base16.decode(data.content);
			try {
				const clear_code = await crypto.subtle.decrypt({name: "AES-GCM", iv}, state.key.crypto, chiper_code);
				const clear_text = (new TextDecoder).decode(clear_code);
				make_origin_field();
				name_input.value = origin;
				content_input.value = clear_text;
			} catch (error) {
				return section.replaceChild(
					E('section', {'class': 'data-wrong-key'},
						'Encryption key is not matched for ',
						E('span', null, origin)),
					section.firstChild
				);
			}
		}
		return section.replaceChild(
			E('form', {'event$': {'submit': submit}},
				origin_field,
				E('div', null, E('label', null, 'Title ', name_input)),
				E('div', null, E('label', null, 'Content ', content_input)),
				E('div', null, E('button', {'type': 'submit'}, 'Save'))),
			section.firstChild
		);
	}
	async function submit(event) {
		event.preventDefault();
		const name = name_input.value;
		const content = content_input.value;
		if (state.key.crypto === null)
			return alert('Encryption key is not set properly.');
		const iv = crypto.getRandomValues(new Uint8Array(12));
		const nonce = base16.encode(iv);
		const clear_code = (new TextEncoder).encode(content);
		const cipher_code = await crypto.subtle.encrypt({name: "AES-GCM", iv}, state.key.crypto, clear_code);
		const cipher_text = base16.encode(cipher_code);
		if (origin === null) {
			if (!await API.create(state.username, state.password, state.directory, name, nonce, cipher_text))
				return alert('Fail to create new content');
			const parent = origin_field.parentNode;
			const old_field = origin_field;
			origin = name;
			make_origin_field();
			parent.insertBefore(origin_field, old_field);
			parent.removeChild(old_field);
		} else {
			if (!await API.change(state.username, state.password, state.directory, origin, name, nonce, cipher_text))
				return alert('Fail to change data');
		}
	}
	async function new_click(event) {
		event.preventDefault();
		const new_field = E('div', null, 'New file from: ', T(origin));
		const parent = origin_field.parentNode;
		parent.insertBefore(new_field, origin_field);
		parent.removeChild(origin_field);
		origin = null;
		origin_input = null;
		origin_field = new_field;
	}
	load_origin();
	return section;
}

function main_page() {
	var active = null;
	const container = E('div', {'class': 'tab'});
	const logout_tag = E('a', {'class': 'inactive', 'event$': {'click': logout_click}}, 'Log-out');
	const key_tag = E('a', {'class': 'inactive', 'event$': {'click': key_click}}, 'Key');
	const list_tag = E('a', {'class': 'inactive', 'event$': {'click': list_click}}, 'List');
	const data_tag = E('a', {'class': 'inactive', 'event$': {'click': data_click}}, 'File');
	const page =
		E('main', {'class': 'main'},
			E('div', {'class': 'tag'},
				logout_tag, key_tag, list_tag, data_tag, E('span')),
			container);
	function activate(tag, tab) {
		if (active !== null) {
			active.tag.setAttribute('class', 'inactive');
			container.removeChild(active.tab);
		}
		active = {tag, tab};
		tag.setAttribute('class', 'active');
		return container.appendChild(tab);
	}
	function logout_click(event) {
		event.preventDefault();
		return activate(logout_tag, logout_section(page));
	}
	function key_click(event) {
		event.preventDefault();
		return activate(key_tag, key_section());
	}
	function list_click(event) {
		function open_file(file) {
			return activate(data_tag, data_section(page, file));
		}
		event.preventDefault();
		return activate(list_tag, list_section(page, open_file));
	}
	function data_click(event) {
		event.preventDefault();
		return activate(data_tag, data_section(page, null));
	}
	activate(logout_tag, logout_section(page));
	return page;
}

document.body.appendChild(login_page());

});
