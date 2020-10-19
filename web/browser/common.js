'use strict';
MODULE.define(
	'common',
	[        'DOM'],
	function (DOM) {

const API_URL = '/api';

function get_element(parent, tag) {
	for (let index=0; index<parent.childNodes.length; ++index) {
		const child = parent.childNodes.item(index);
		if (child.nodeType === child.ELEMENT_NODE && child.nodeName === tag)
			return child;
	}
	return null;
}

function get_text(node) {
	if (node === null)
		return null;
	const text_collection = new Array;
	for (let index=0; index<node.childNodes.length; ++index) {
		const child = node.childNodes.item(index);
		switch (child.nodeType) {
			case child.TEXT_NODE:
			case child.CDATA_SECTION_NODE:
				text_collection.push(child.nodeValue);
				break;
			case child.COMMENT:
				break;
			default:
				return null;
		}
	}
	return text_collection.join('');
}

function get_int(node) {
	if (node === null)
		return null;
	const number = Number.parseInt(get_text(node));
	if (Number.isNaN(number))
		return null;
	return number;
}

return {API_URL, get_element, get_text, get_int};

});
