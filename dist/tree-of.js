module.exports = treeOf;

function treeOf( parser, options, contents ) {
	var tree = [];
	var current = null;
	var i, len;

	var stack = [];

	for( i = 0, len = contents.length; i < len; ++i ) {
		step(
			contents[ i ]
		);
	}

	return tree;

	function step( current ) {
		var tag = null;
		var error = null;

		switch( current.type ) {
			case 'text':
				currentContents().push( current );
				return;

			case 'tagOpen':
				// if supporting tags that are close-optional, check that here.  (eg list items.)
				tag = tagFrom( current );

				if( isSerialAutoClosingTag( tag ) && currentParent() && currentParent().tagName == tag.tagName ) {
					closeAndPop();
				}

				currentContents().push( tag );
				stack.push( tag );
				return;

			case 'tagClose':
				// This allows us to auto-close unclosed child tags when a parent closes.
				// Probably not a good idea, but oh well.
				if( isParentPresentForTagClose( current ) ) {
					while( currentParent() && currentParent().tagName !== current.tagName ) {
						// closeAndPop();
						handleUnclosedTagOpen( current );
					}

					closeAndPop( current );
					return;
				}

				// TODO: Make throwing optional.  In that case, different behavior would take over, but it can be documented.
				// It could even be an option, what to do with it.  (throw, drop, convert to text...)
				// error = new Error( "Orphaned tagClose '[/" + current.tagName + "]' encountered at line " + String( current.location.start.line ) + ", column " + String( current.location.start.colunm ) );
				// error.token = current;
				// error.location = current.location;
				// throw error;
				return handleOrphanedTagClose( current );
		}
	}

	function currentParent() {
		return stack[ stack.length - 1 ] || null;
	}

	function currentContents() {
		if( stack.length ) {
			return currentParent().contents;
		}

		return tree;
	}

	function isParentPresentForTagClose( tagClose ) {
		return ( stack
			.filter( function( parent ) {
				return parent.tagName == tagClose.tagName;
			})
			.length
		);
	}

	function closeAndPop( tagClose ) {
		var parent = currentParent();

		if( tagClose ) {
			parent.tagClose = tagClose;
		}

		normalizeLocation( parent );
		stack.pop();
	}

	function tagFrom( tagOpen ) {
		return {
			type: 'tag',
			tagName: tagOpen.tagName,
			attributes: tagOpen.attributes,
			contents: [],
			location: null,
			tagOpen: tagOpen,
			tagClose: null
		};
	}

	function normalizeLocation( tag ) {
		var startLocation = tag.tagOpen.location
		var endLocation;

		if( tag.tagClose ) {
			endLocation = tag.tagClose.location
		}
		else if( tag.contents.length ) {
			endLocation = tag.contents[ tag.contents.length - 1 ].location;
		}
		else {
			endLocation = startLocation;
		}

		tag.location = {
			start: startLocation.start,
			end: endLocation.end
		};
	}

	function isSerialAutoClosingTag( tag ) {
		return options.serialAutoClosingTags.indexOf( tag.tagName ) !== -1;
	}

	function handleOrphanedTagClose( tagClose ) {
		var error;

		switch( options.orphanedTagCloseBehavior ) {
			default:
			case 'throw':
				error = new Error(
					"Orphaned tagClose '[/" +
					tagClose.tagName +
					"]' encountered"
				);
				error.type = 'orphanedTagClose';
				error.token = tagClose;
				error.location = tagClose.location;
				throw error;

			case 'text':
				currentContents().push({
					type: 'text',
					text: '[/' + tagClose.tagName + ']',
					location: tagClose.location
				});
				return;

			case 'ignore':
				return;
		}
	}

	function handleUnclosedTagOpen( token ) {
		var error;
		var parent = currentParent();
		var parentTagOpen = parent.tagOpen;

		switch( options.unclosedTagOpenBehavior ) {
			default:
			case 'ignore':
				closeAndPop();
				return;

			case 'throw':
				// serial auto-closing tags (such as [li]/[*] by default) do not require a closing tag.
				if( isSerialAutoClosingTag( parent.tagname ) ) {
					closeAndPop();
					return;
				}

				error = new Error(
					"Unclosed [" + parent.tagName +
					"] tag; expected [/" + parent.tagName +
					"] at line " + String( token.location.start.line ) +
					", column " + String( token.location.start.column ) + ";" +
					" Instead found [/" + token.tagName + "]"
				);
				error.type = 'unclosedTagOpen';
				error.token = token;
				error.location = token.location;
				error.parentToken = parent.tagOpen;
				throw error;
		}
	}
}
