var program = require( 'commander' );
var packageInfo = require( './package.json' );
var PEG = require( 'pegjs' );
var fs = require( 'fs' );
var path = require( 'path' );
var browserify = require( 'browserify' );
var mkdirp = require( 'mkdirp' );

var targets = {
	'dist': buildDist,
	'browser': buildBrowser
};

program
	.version( packageInfo.version )
	.description( `Build ${ packageInfo.name }.` )
	.usage( `node build <build-target>` )
	.parse( process.argv )
	;

var buildTarget = program.args[ 0 ];

if( ! buildTarget ) {
	program.help();
	process.exit();
}

if( ! (buildTarget in targets) ) {
	console.error( `No action specified for build target '${ buildTarget }'.` );
	program.help();
	process.exit();
}

console.log( `Build target: ${ buildTarget }` );

targets[ buildTarget ]( function( error ) {
	if( error ) {
		console.error( `Error trying to build:` );
		console.error( error );
		return;
	}

	console.log( `Completed target: ${ buildTarget }` );
});

////////

function buildDist( next ) {
	var bbcodeParserSourcePath = path.join( __dirname, 'source', 'bbcode.pegjs' );
	var bbcodeParserLibPath = path.join( __dirname, 'dist', 'bbcode.js' );

	var options = {
		// cache: false,
		// allowedStartRules: ...
		output: 'source',
		optimize: 'speed',
		// plugins: []
	};

	fs.readFile( bbcodeParserSourcePath, 'utf8', function( error, bbcodeParserSource ) {
		if( error ) return next( error );

		try {
			var generatedParserSource = PEG.buildParser( bbcodeParserSource, options );
		}
		catch( pegError ) {
			return next( pegError );
		}

		generatedParserSource = `module.exports = ${ generatedParserSource };`;

		fs.writeFile( bbcodeParserLibPath, generatedParserSource, next );
	});
}

function buildBrowser( next ) {
	buildDist( function( error ) {
		if( error ) return next( error );

		mkdirp( path.join( __dirname, 'bundle' ), function( error ) {
			if( error ) return next( error );

			var b = browserify({
				standalone: 'bbcode-pegjs-parser'
			});
			var bundlePath = path.join( __dirname, 'bundle', `${ packageInfo.name }.bundle.js` );
			var bundleStream = fs.createWriteStream( bundlePath );

			b.add( './dist/bbcode.js' );

			bundleStream.on( 'end', () => {
				next();
			});

			bundleStream.on( 'error', ( error ) => {
				next( error );
			});

			b.bundle().pipe( bundleStream );
		});
	});
}
