const semver = require('semver');
const joseVersion = require('jose/package.json').version;

if (semver.gte(joseVersion, '3.0.0')) {
  console.log('jose version is compatible');
} else {
  console.log('jose version is not compatible');
}
