
var BBCodeParser = require( './bbcode' );

module.exports = BBCodeParser;

BBCodeParser.defaultOptions = {
	orphanedTagCloseBehavior: 'throw',
	serialAutoClosingTags: [ 'li', '*' ]
}
