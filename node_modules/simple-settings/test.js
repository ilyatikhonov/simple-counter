var settings = require('./simple-settings.js').init;
var fs = require('fs');
var assert = require('assert');


var testJsonFileName = 'test.json';

var testFilesIndexes = [];

function fromFile(data) {
	var index = testFilesIndexes.length;
	testFilesIndexes.push(index);
	fs.writeFileSync(testJsonFileName + index, JSON.stringify(data));
	return testJsonFileName + index;
}

var tests = [
	[{one: 'one', two: 'two'}, {one: 'x', two: 'y'}, {one: 'x', two: 'y'}],
	[{one: 'one', two: 'two'}, {one: 'x'}, {one: 'x', two: 'two'}],
	[{one: {two: 'two', free: {four:'four'}}}, {one: {free: {four:'y'}}}, {one: {two: 'two', free: {four:'y'}}}]
];

tests.forEach(function(test) {
	assert.deepEqual(settings(test[0], test[1]), test[2]);
	assert.deepEqual(settings(test[0], fromFile(test[1])), test[2]);
	assert.deepEqual(settings(fromFile(test[0]), test[1]), test[2]);
});

testFilesIndexes.forEach(function(index) {
	fs.unlinkSync(testJsonFileName + index)
});
