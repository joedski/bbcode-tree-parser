BBCode Tree Parser
==================

Not so frilly BBCode Parser which produces an AST.  Like all BBCode Parsers, this follows only its own standard.  [PEG][pegjs] is used to build the lexer while the treeification is carried out in plain JS on the token stream.

__This parser produces an AST only!__  It does not emit HTML, and it does not autotransform new-lines into `<br>` tags.

[pegjs]:http://pegjs.org/



Specific Behaviors
------------------

A few tags, mostly the list-item tags, are parsed by some BBCode Parsers like old HTML list-item tags, in that they only require an opening tag and do not require a closing tag.  That is, writing `[*]foo[*]bar` results in two non-nested list-item tags, rather than one list-item tag nested in another.  The parser has the option `serialAutoClosingTags` which is an array containing the names of the tags that display this behavior.  Default value: `[ 'li', '*' ]`.

Force-closing of unclosed children when parent closes: This is done to prevent issues where an unclosed bold-tag or whatever screws up formatting of everything else.  This behavior probably does not match that of many exsiting parsers.  Writing `[spoiler]foo bar [b]baz[/spoiler]` will yield `<spoiler>foo bar <b>baz</b></spoiler>`.

No-content or Self Closing tags: Parser currently doesn't support these as I haven't yet encountered any.



Usage
-----

```js
var BBcodeParser = require( 'bbcode-tree-parser' );
var ast = BBCodeParser.parse( `This is some [b]BBCode[/b]!
It has...[ul][*]Tags[*]And things[*]And stuff[/ul]`, {
	orphanedTagCloseBehavior: 'ignore'
});

console.log( JSON.stringify( ast, null, 2 ) );
```

### Options

The `parse` function accepts an optional options object.  It can have the following properties.

- `serialAutoClosingTags: Array<string>` list of tags which, should the same tag open twice in a row, the first one will be auto-closed first before the second one is opened.  This is akin to the behavior of old HTML engines around `<p>` and `<li>` tags, where only the opnening one was needed.
	- Default: `[ 'li', '*' ]`
- `orphanedTagCloseBehavior: string` What do do when encountering an orphaned closing tag, that is, a closing tag without a corresponding opening tag.  Such cases tend to occur when people are sloppy with copy/pasting or try to interleave tags, like with `[b]some [i]text[/b]![/i]`.
	- Default: `"throw"`
	- `"throw"` means to throw an error when such a tag is encountered.
	- `"text"` means to convert the tag into a text node and emit that as normal.
	- `"ignore"` means to just silently drop the tag.
- `unclosedTagOpenBehavior: string` What to do when a child tag is not closed before a parent tag, or perhaps never closed at all.
	- Default: `"ignore"`
	- `"ignore"` Unclosed tags are just closed.  Note that such tags will lack a `tagClose` value, and their `location` property will be set based on where their content ends.
	- `"throw"` Unclosed tags generate an error.  Note that this option also uses the value of `serialAutoClosingTags` to judge whether it should ignore certain tags being unclosed.  Set that to an empty list to catch all tags.



AST Objects
-----------

When you run the `BBCodeParser.parse()` function it emits an array of objects.  The following are the types of objects within there:


### Text

```js
type TextObject = {
	type: 'text',
	text: string, // Text of this text node.
	location: Location
};
```


### Tag

```js
type TagObject = {
	type: 'tag',
	tagName: string,
	attributes: {},
	contents: Array<TextObject | TagObject>
	location: Location
	tagOpen: TagOpen,
	tagClose: TagClose?
};
```

Notes:
- The `attributes` property will have an attribute named `@` if a tag is written in the form of `[tagname=attribute-value]`.


### Supplemental Types

#### TagOpen

```js
type TagOpen = {
	type: 'tagOpen',
	tagName: string,
	attributes: {},
	location: Location
};
```

Notes:
- The `attributes` property will have an attribute named `@` if a tag is written in the form of `[tagname=attribute-value]`.

#### TagClose

```js
type TagClose = {
	type: 'tagClose',
	tagName: string,
	location: Location
};
```

#### Location

```js
type Location = {
	start: {
		offset: number,
		line: number,
		column: number
	},
	end: {
		offset: number,
		line: number,
		column: number
	}
}
```

Notes:
- This object is literally the `location` object created by any call to PEGjs's auto-generated `location()` funtion.
- `offset` is the absolute char offset of a particular location in the source, to allow slicing of the source as a single string rather than as a bunch of lines.  This can be used to highlight an error in the source code, for instance.
- `line` and `column` are 1-indexed.



To Do
-----

- Specific detection of interleaved-tag errors so you can tell people they might want to fix it.
	- Example: `[b][i]foo[/b][/i]`
- Support for alternative behaviors when encountering an orphaned tagClose.
	- Emitting the tagClose as text might be more expected behavior.
