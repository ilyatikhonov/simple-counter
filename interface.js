var http = require('http');
var url = require('url');
var querystring = require('querystring');
var conf = require('simple-settings').init('settings.json', 'settings.local.json');
var redis = require("redis").createClient(conf.redis.port, conf.redis.host);
require('datejs');

http.createServer(function (req, res) {
	var query = querystring.parse(url.parse(req.url).query);
	var prefixes = [];
	query.type = query.type.split(',');
	if (query.type.indexOf('total') != -1) {
		prefixes.push(conf.redis.keyPrefix.total);
	}

	if (query.type.indexOf('today') != -1) {
		prefixes.push[conf.redis.keyPrefix.byDay + Date.today().toString('yyyy-MM-dd') + ':'];
	}

	if (query.type.indexOf('week') != -1) {
		
	}
	
	if (!query.id || prefixes.length == 0) {
		res.writeHead(404, {'Content-type': 'text/plain'});
		res.end();
		return;
	}

	redis.mget(prefix + query.id, function(err, value) {
		if (query.jsonp_callback) {
			res.writeHead(200, {'Content-type': 'application/x-javascript'});
			res.end(query.jsonp_callback + '(\'' + value + '\');');
		} else {
			res.writeHead(200, {'Content-type': 'text/plain'});
			res.end(value);
		}
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