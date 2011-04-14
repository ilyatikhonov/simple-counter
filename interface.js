var http = require('http');
var url = require('url');
var querystring = require('querystring');
var conf = require('simple-settings').init('settings.json', 'settings.local.json');
var redis = require("redis").createClient(conf.redis.port, conf.redis.host);

http.createServer(function (req, res) {
	var bad = false;
	var query = querystring.parse(url.parse(req.url).query);
	if (!query.jsonp_callback) {
		bad = true;
	}
	var prefix;
	if (query.what == 'counter') {
		prefix = conf.redis.keyPrefix.counter;
	} else if (query.what == 'redirect') {
		prefix = conf.redis.keyPrefix.redirect;
	} else {
		bad = true;
	}
	
	if (query.type == 'total') {
		prefix += conf.redis.keyPrefix.total;
	} else if (query.type == 'today') {
		var date = new Date();
		var day = date.getFullYear() + '-' + twoDigits(date.getMonth() + 1) + '-' + twoDigits(date.getDate());
		prefix += conf.redis.keyPrefix.byDay + day + ':';
	} else {
		bad = true;
	}
	
	if (!query.id) {
		bad = true;
	}
	
	if (bad) {
		res.writeHead(404, {'Content-type': 'text/plain'});
		res.end();
		return;
	}

	redis.get(prefix + query.id, function(err, value) {
		res.writeHead(200, {'Content-type': 'application/x-javascript'});
		res.end(query.jsonp_callback + '("' + value + '");');
	});
	
	/*redis.keys('*', function(err, data) {
		data.forEach(function(key, x) {
			redis.get(key, function(err, value) {
				res.write(key + '\t' + value.toString() + '\n');
				if (x == data.length - 1) {
					res.end();
				}
			});
		});
	})*/
	
	
}).listen(conf.interface.port, conf.interface.host);

function twoDigits(a) {
	if (a < 10) {
		a = '0' + a;
	}
	return a;
}