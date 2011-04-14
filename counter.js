var http = require('http');
var url = require('url');
var conf = require('simple-settings').init('settings.json', 'settings.local.json');
var redis = require("redis").createClient(conf.redis.port, conf.redis.host);

if (conf.response.img.fileName) {
	conf.response.img.content = require('fs').readFileSync(conf.response.img.fileName);
}

http.createServer(function (req, res) {
	
	var query = url.parse(req.url);
	var id;
	var keyPrefix;
	if (query.pathname == conf.url.counter.js || query.pathname == conf.url.counter.img) {
		if (query.pathname == conf.url.counter.js) {
			res.writeHead(200, conf.response.js.headers);
			res.end(conf.response.js.content);
		} else {
			res.writeHead(200, conf.response.img.headers);
			res.end(conf.response.img.content);
		}
		
		id = query.query;
		if (id === undefined) {
			id = req.headers['referrer'];
		}
		keyPrefix = conf.redis.keyPrefix.counter;
	} else if (query.pathname == conf.url.redirect) {
		res.writeHead(302, {'Location': query.query});
		res.end();
		id = query.query;
		keyPrefix = conf.redis.keyPrefix.redirect;
	} else {
		res.writeHead(404, {'Content-Type': 'text/plain'});
		res.end('Not Found\n');
		return;
	}
	
	if (id === undefined || id == '') {
		return;
	}

	var date = new Date();
	var day = date.getFullYear() + '-' + twoDigints(date.getMonth() + 1) + '-' + twoDigints(date.getDate());
	
	redis.incr(keyPrefix + conf.redis.keyPrefix.total + id);
	redis.incr(keyPrefix + conf.redis.keyPrefix.byDay + day + ':' + id);
	
	

}).listen(conf.web.port, conf.web.host);

function twoDigints(a) {
	if (a < 10) {
		a = '0' + a;
	}
	return a;
}