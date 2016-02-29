
var BBCodeParser = require( './bbcode' );

module.exports = BBCodeParser;

BBCodeParser.defaultOptions = {
	orphanedTagCloseBehavior: 'throw',
	unclosedTagOpenBehavior: 'ignore',
	serialAutoClosingTags: [ 'li', '*' ]
}
