{
	var objectAssign = require( 'object-assign' );
	var defaultOptions = parser.defaultOptions || {};

	function treeOf( contents ) {
		return (require( './tree-of' )( parser, options, contents ));
	}

	options = objectAssign( {}, defaultOptions, options );
}

Contents
	= contents:(TagOpen / TagClose / Text)+ {
		return treeOf( contents );
	}

OrphanedTagClose
	= close:TagClose {
		return {
			type: 'orphanedClose',
			tagName: close.tagName,
			location: location()
		};
	}

TagOpen
	= TagOpenWithSelfAttribute / TagOpenWithAttributes / TagOpenNoAttributes

TagOpenWithSelfAttribute
	= '[' name:TagName _ '=' _ value:TagSelfAttributeValue _ ']' {
		return {
			type: 'tagOpen',
			tagName: name,
			attributes: { '@': value },
			location: location()
		};
	}

TagOpenWithAttributes
	= '[' name:TagName attrs:TagAttributeSeq ']' {
		return {
			type: 'tagOpen',
			tagName: name,
			attributes: attrs.reduce( function( res, a ) {
				res[ a.name ] = a.value;
				return res;
			}, {} ),
			location: location()
		};
	}

TagOpenNoAttributes
	= '[' name:TagName ']' {
		return {
			type: 'tagOpen',
			tagName: name,
			attributes: {},
			location: location()
		};
	}

TagClose
	= '[/' name:TagName ']' {
		return {
			type: 'tagClose',
			tagName: name,
			location: location()
		};
	}

TagName
	= name:[a-z*@#$%_-]i+ { return name.join( '' ).toLowerCase(); }

TagSelfAttributeValue
	= "'" value:[^']+ "'" { return value.join( '' ); }
	/ '"' value:[^"]+ '"' { return value.join( '' ); }
	/ value:[^\[\]]+ { return value.join( '' ); }

TagAttributeSeq
	= attrs:(_ TagAttributePair _)+ {
		return attrs.map( function( attrMatchItems ) {
			return attrMatchItems.filter( function( thing ) {
				debugger;
				return (typeof thing !== 'string');
			})[ 0 ];
		})
		.filter( function( attr ) { return !! attr; });
	}

TagAttributeValue
	= "'" value:[^']+ "'" { return value.join( '' ); }
	/ '"' value:[^"]+ '"' { return value.join( '' ); }
	/ value:[^\[\] \t\n\r]+ { return value.join( '' ); }

TagAttributePair
	= name:TagAttributeName '=' value:TagAttributeValue {
		return {
			type: 'attribute',
			name: name,
			value: value
		};
	}

TagAttributeName
	= name:[a-z]i+ { return name.join( '' ).toLowerCase(); }

Text
	= text:('\\[' / [^\[] / [ \t\n\r])+ {
		return {
			type: 'text',
			text: text.join( '' ),
			location: location()
		};
	}

// Optional whitespace.
_
	= space:[ \t\n\r]* { return space.join( '' ); }
