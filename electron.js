'use strict';

globalThis.MODULE = require('./common/module.js');
const path = require('path');
const electron = require('electron');
require('./operation.js');
require('./electron/API.js');

MODULE.define('electron', [], function () {
	return electron;
});

electron.app.whenReady().then(
	function () {
		electron.Menu.setApplicationMenu(
			new electron.Menu.buildFromTemplate(
				[
					{
						label: 'Program',
						submenu: [
							{role: 'toggleDevTools'},
							{type: 'separator'},
							{role: 'quit'}
						]
					}
				]
			)
		);
		const browser =
			new electron.BrowserWindow(
				{
					width: 800,
					height: 600,
					webPreferences: {
						contextIsolation: false,
						preload: path.join(electron.app.getAppPath(), 'electron/browser/preload.js'),
						//	nodeIntegration: true,
						//	devTools: false,
						spellcheck: false
					}
				}
			);
		//	browser.webContents.openDevTools();
		return browser.loadFile('electron/browser/index.xhtml');
	}
);
