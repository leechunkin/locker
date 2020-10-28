'use strict';
MODULE.define(
	null,
	[        'DOM', 'API', 'document'],
	function (DOM,   API,   document) {

const {T, E} = DOM(document);

function State() {
	return this.reset();
}
Object.assign(
	State.prototype,
	{
		reset() {
			this.identify = null;
			this.directory = 0;
			this.key = {
				text: '',
				file: null,
				crypto: null
			};
			this.changing = false;
			return this;
		}
	}
);

const state = new State;

const base64 = {
	/* RFC 4648 base64 */
	encode(buffer) {
		var input = new Uint8Array(buffer);
		var output = new Uint8Array(Math.ceil(input.length * 4 / 3));
		var b = 0;
		var c = 0;
		var j = 0;
		for (var i=0; i<input.length; ++i) {
			b = ((b << 8) | input[i]) & 0xFFFF;
			c += 8;
			while (c >= 6) {
				c -= 6;
				output[j] = this.encode.table[(b >> c) & 0x3F];
				++j;
			}
		}
		if (c > 0) {
			b <<= 5;
			c += 5;
			while (c >= 6) {
				c -= 6;
				output[j] = this.encode.table[(b >> c) & 0x3F];
				++j;
			}
		}
		return (new TextDecoder).decode(output);
	},
	decode(string) {
		var bytes = new Uint8Array(Math.floor(string.length * 3 / 4));
		var b = 0;
		var c = 0;
		var j = 0;
		for (var i=0; i<string.length; ++i) {
			b = ((b << 6) | this.decode.table[string.charCodeAt(i)]) & 0x0FFF;
			c += 6;
			while (c >= 8) {
				c -= 8;
				bytes[j] = (b >> c) & 0xFF;
				++j;
			}
		}
		return bytes.buffer;
	}
};
base64.encode.table =
	function (table) {
		var s = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
		for (var i=0; i<64; ++i) table[i] = s.charCodeAt(i);
		return table;
	}(new Array(64));
base64.decode.table =
	function (table) {
		for (var i=0; i<64; ++i) table[base64.encode.table[i]] = i;
		return table;
	}(new Array(128));

function incorrect_password_page() {
	const page =
		E('main', {'class': 'incorrect_password'},
			'Incorrect login password!',
			E('a', {'href': '#', 'event$': {'click': click}},
				'Back to login page'));
	function click(event) {
		event.preventDefault();
		const parent = page.parentNode;
		if (parent != null) {
			parent.insertBefore(login_page(), page);
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
					E('input', {'type': 'text', 'required': ''})),
				E('label', null,
					'Password ',
					E('input', {'type': 'password', 'required': ''})),
				E('button', {'type': 'submit'},
					'Log-in')));
	async function submit(event) {
		event.preventDefault();
		const inputs = page.getElementsByTagName('input');
		const username_input = inputs.item(0);
		const password_input = inputs.item(1);
		const parent = page.parentNode;
		const identify = {username: username_input.value, password: password_input.value};
		const result = await API.login(identify);
		if (Array.isArray(result) && result[0] === null) {
			state.identify = identify;
			if (parent != null) {
				parent.insertBefore(main_page(), page);
				return parent.removeChild(page);
			}
		} else {
			if (parent != null) {
				parent.insertBefore(incorrect_password_page(), page);
				return parent.removeChild(page);
			}
		}
	}
	return page;
}

function main_error(main, reason) {
	state.reset();
	console.error(reason);
	alert('Error! ' + String(reason));
	const parent = main.parentNode;
	parent.insertBefore(login_page(), main);
	return parent.removeChild(main);
}

function account_section(main) {
	const passwd_password_input = E('input', {'type': 'password', 'required': '', 'placeholder': 'new password'});
	const useradd_username_input = E('input', {'type': 'text', 'required': '', 'placeholder': 'username'});
	const useradd_password_input = E('input', {'type': 'password', 'required': '', 'placeholder': 'password'});
	const section =
		E('section', {'class': 'account'},
			'Current user: ',
			E('strong', null, T(state.identify.username)),
			E('form', {'event$': {'submit': logout_submit}},
				'Log-out this session ',
				E('button', {'type': 'submit'}, 'Log-out')),
			E('form', {'event$': {'submit': passwd_submit}},
				'Change password to ',
				passwd_password_input,
				' ',
				E('button', {'type': 'submit'}, 'Change')),
			E('form', {'event$': {'submit': userdel_submit}},
				'Delete this account ',
				E('button', {'type': 'submit'}, 'Delete')),
			E('form', {'event$': {'submit': useradd_submit}},
				'Create new account ',
				useradd_username_input,
				' password ',
				useradd_password_input,
				' ',
				E('button', {'type': 'submit'}, 'Create')));
	function logout() {
		state.reset();
		const parent = main.parentNode;
		if (parent !== null) {
			parent.insertBefore(login_page(), main);
			return parent.removeChild(main);
		}
	}
	function logout_submit(event) {
		event.preventDefault();
		return logout();
	}
	async function passwd_submit(event) {
		event.preventDefault();
		const password = passwd_password_input.value;
		const result = await API.passwd(state.identify, password);
		if (!Array.isArray(result) || result[0] !== null)
			return alert('Fail to change change password: ' + String(result));
		state.identify.password = password;
		passwd_password_input.value = '';
	}
	async function userdel_submit(event) {
		event.preventDefault();
		if (confirm('Delete account "' + state.identify.username + '"')) {
			const result = await API.userdel(state.identify);
			if (!Array.isArray(result) || result[0] !== null)
				return alert('Fail to change delete account: ' + String(result));
			return logout();
		}
	}
	async function useradd_submit(event) {
		event.preventDefault();
		const username = useradd_username_input.value;
		const password = useradd_password_input.value;
		const result = await API.useradd(state.identify, username, password);
		if (!Array.isArray(result) || result[0] !== null)
			return alert('Fail to change create account: ' + String(result));
		useradd_username_input.value = '';
		useradd_password_input.value = '';
	}
	return section;
}

function key_section() {
	const text_input = E('input', {'type': 'password', 'value': state.key.text, 'event$': {'change': text_change}});
	const file_input = E('input', {'type': 'file', 'event$': {'change': file_change}});
	const section =
		E('section' , {'class': 'key'},
			E('form' , {'event$': {'submit': form_submit}},
				E('div', null, E('label', null, 'Key text ', text_input)),
				E('div', null, E('label', null, 'Key file ', file_input)),
				E('div', null, E('button', {'type': 'submit'}, 'Use'))));
	function text_change(event) {
		state.changing = true;
	}
	function file_change(event) {
		if (file_input.files.length < 1) {
			state.key.file = null;
			return;
		}
		state.changing = true;
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
		state.changing = false;
	}
	async function form_submit(event) {
		event.preventDefault();
		state.key.text = text_input.value;
		return update_key();
	}
	return section;
}

function list_section(main, open_file) {
	const rename_input = E('input', {'type': 'text'});
	const mkdir_input = E('input', {'type': 'text'});
	const section = E('section', {'class': 'list'});
	var directories = [];
	var files = [];
	async function load() {
		const result = await API.list(state.identify, state.directory);
		if (!Array.isArray(result) || result[0] !== null)
			return main_error(main, result);
		section.textContent = null;
		directories = result[1].directories;
		files = result[1].files;
		const toolbar =
			E('div', null,
				E('button', {'type': 'button', 'event$': {'click': refresh_click}}, 'Refresh'));
		section.appendChild(toolbar);
		if (state.directory !== 0) {
			toolbar.appendChild(E('button', {'type': 'button', 'event$': {'click': parent_click}}, 'Upper'));
			toolbar.appendChild(E('button', {'type': 'button', 'event$': {'click': rmdir_click}}, 'Remove'));
			rename_input.value = result[1].name;
			section.appendChild(
				E('div', null,
					E('form', {'event$': {'submit': rename_submit}},
						E('label', null, 'Directory ', rename_input),
						' ',
						E('button', {'type': 'submit'}, 'Rename')))
			);
		}
		section.appendChild(
			E('div', null,
				E('form', {'event$': {'submit': mkdir_submit}},
					E('label', null, 'Create directory ', mkdir_input, ' ', E('button', {'type': 'submit'}, 'Create'))))
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
			return section.appendChild(container);
		}();
		void function () {
			const container = E('ol');
			for (const file of files)
				container.appendChild(
					E('li', null,
						E('button', {'type': 'button', 'event$': {'click': erase_click(file.name)}},
							'erase'),
						E('button', {'type': 'button', 'event$': {'click': edit_click(file.name)}},
							'edit'),
						' ',
						T(file.name))
				);
			return section.appendChild(container);
		}();
	}
	async function refresh_click() {
		event.preventDefault();
		return load();
	}
	async function parent_click(event) {
		event.preventDefault();
		const result = await API.parent(state.identify, state.directory);
		if (!Array.isArray(result) || result[0] !== null)
			return main_error(main, result);
		state.directory = result[1];
		return load();
	}
	async function rmdir_click(event) {
		event.preventDefault();
		if (confirm('Remove this directory and all contained files ?\nSub-directories will be moved to parent directory.')) {
			const result = await API.rmdir(state.identify, state.directory);
			if (!Array.isArray(result) || result[0] !== null)
				return alert('Fail to remove directory: ' + String(result));
			state.directory = result[1];
			return load();
		}
	}
	async function rename_submit() {
		event.preventDefault();
		const result = await API.rename_dir(state.identify, state.directory, rename_input.value);
		if (!Array.isArray(result) || result[0] !== null)
			return alert('Fail to rename directory: ' + String(result));
	}
	async function mkdir_submit(event) {
		event.preventDefault();
		const result = await API.mkdir(state.identify, state.directory, mkdir_input.value);
		if (!Array.isArray(result) || result[0] !== null)
			return alert('Fail to create directory: ' + String(result));
		mkdir_input.value = '';
		return load();
	}
	function directory_click(directory) {
		return async function click(event) {
			event.preventDefault();
			state.directory = directory;
			return load();
		};
	}
	function erase_click(file) {
		return async function click(event) {
			event.preventDefault();
			if (confirm('Erase file "' + file + '" ?')) {
				const result = await API.erase(state.identify, state.directory, file);
				if (!Array.isArray(result) || result[0] !== null)
					return alert('Fail to erase file: ' + String(result));
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
	const name_input = E('input', {'type': 'text', 'required': '', 'event$': {'change': name_change}});
	const content_input = E('textarea', {'rows': '24', 'event$': {'change': content_change}});
	function make_origin_field() {
		origin_input =
			E('input', {'type': 'text', 'disabled': '', 'value': origin});
		origin_field =
			E('div', null,
				'Origin title ',
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
			const result = await API.read(state.identify, state.directory, origin);
			if (!Array.isArray(result) || result[0] !== null)
				return main_error(main, result[0]);
			const iv = base64.decode(result[1].nonce);
			const chiper_code = base64.decode(result[1].content);
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
				E('div', null, E('label', null, 'Content (to be encrypted)', content_input)),
				E('div', null, E('button', {'type': 'submit'}, 'Save'))),
			section.firstChild
		);
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
	function name_change(event) {
		state.changing = true;
	}
	function content_change(event) {
		state.changing = true;
	}
	async function submit(event) {
		event.preventDefault();
		const name = name_input.value;
		const content = content_input.value;
		if (state.key.crypto === null)
			return alert('Encryption key is not set properly.');
		const iv = crypto.getRandomValues(new Uint8Array(12));
		const nonce = base64.encode(iv);
		const clear_code = (new TextEncoder).encode(content);
		const cipher_code = await crypto.subtle.encrypt({name: "AES-GCM", iv}, state.key.crypto, clear_code);
		const cipher_text = base64.encode(cipher_code);
		if (origin === null) {
			const result = await API.create(state.identify, state.directory, name, nonce, cipher_text);
			if (!Array.isArray(result) || result[0] !== null)
				return alert('Fail to create new content: ' + String(result));
		} else {
			const result = await API.change(state.identify, state.directory, origin, name, nonce, cipher_text);
			if (!Array.isArray(result) || result[0] !== null)
				return alert('Fail to change data: ' + String(result));
		}
		const parent = origin_field.parentNode;
		const old_field = origin_field;
		origin = name;
		make_origin_field();
		parent.insertBefore(origin_field, old_field);
		parent.removeChild(old_field);
		state.changing = false;
	}
	load_origin();
	return section;
}

function generation_section() {
	var limit = 56;
	var key = ''
	var last_x, last_y;
	const characters = "ZN23456789ABCDEFGHJKLMPQRSTUVWXY";
	const output = E('output', null);
	const section =
		E('section', {'class': 'generation'},
			E('form', {'event$': {'click': form_click}},
				E('p', null, 'Randomly click somewhere on the page to generate random string for password.'),
				E('div', null,
					E('label', null, 'Strength: ',
						E('select', {'event$': {'change': strength_change}},
							[16, 24, 32, 40, 48, 56, 64, 72, 80, 88, 96, 104]
								.map(
									function (n) {
										const c = n.toString();
										const b = (n * 5).toString();
										const a = {'value': c};
										if (n === limit) a['selected'] = '';
										return E("option", a, c + " characters, " + b + " bits");
									}
								)))),
				E('div', null, E('label', null, 'Generated password: ', output))));
	function update_output(value) {
		key = value.slice(0, limit);
		output.value = key;
		output.className = key.length >= limit ? 'ready' : 'progress';
	}
	function form_click(event) {
		if (last_x == event.clientX && last_y == event.clientY) return;
		last_x = event.clientX;
		last_y = event.clientY;
		const x = Math.abs(last_x + Math.floor(Math.random() * 32));
		const y = Math.abs(last_y + Math.floor(Math.random() * 32));
		return update_output(characters[x % 32].toString() + characters[y % 32].toString() + key);
	}
	function strength_change(event) {
		limit = Number.parseInt(this.value);
		return update_output(key);
	}
	return section;
}

function main_page() {
	var active = null;
	const container = E('div', {'class': 'tab'});
	const account_tag = E('a', {'class': 'inactive', 'href': '#', 'event$': {'click': account_click}}, 'Account');
	const key_tag = E('a', {'class': 'inactive', 'href': '#', 'event$': {'click': key_click}}, 'Key');
	const list_tag = E('a', {'class': 'inactive', 'href': '#', 'event$': {'click': list_click}}, 'List');
	const data_tag = E('a', {'class': 'inactive', 'href': '#', 'event$': {'click': data_click}}, 'File');
	const generation_tag = E('a', {'class': 'inactive', 'href': '#', 'event$': {'click': generation_click}}, 'Generation');
	const page =
		E('main', {'class': 'main'},
			E('div', {'class': 'tag'},
				account_tag, key_tag, list_tag, data_tag, generation_tag, E('span')),
			container);
	function activate(tag, tab) {
		if (state.changing)
			if (!confirm('Discard unsaved changes ?'))
				return;
		state.changing = false;
		if (active !== null) {
			active.tag.setAttribute('class', 'inactive');
			container.removeChild(active.tab);
		}
		active = {tag, tab};
		tag.setAttribute('class', 'active');
		return container.appendChild(tab);
	}
	function account_click(event) {
		event.preventDefault();
		return activate(account_tag, account_section(page));
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
	function generation_click(event) {
		event.preventDefault();
		return activate(generation_tag, generation_section());
	}
	activate(account_tag, account_section(page));
	return page;
}

document.body.appendChild(login_page());

});
