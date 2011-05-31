var http = require('http');
var url = require('url');
var querystring = require('querystring');
var conf = require('simple-settings').init('settings.json', 'settings.local.json');
var redis = require("redis").createClient(conf.redis.port, conf.redis.host);
require('datejs');

if (conf.response.img.fileName) {
	conf.response.img.content = require('fs').readFileSync(conf.response.img.fileName);
}

http.createServer(function (req, res) {
	var query = url.parse(req.url);
	if (query.pathname == conf.url.js || query.pathname == conf.url.img) {
		var response = conf.response.img;
		if (query.pathname == conf.url.js) {
			response = conf.response.js;
		}
		res.writeHead(200, response.headers);
		res.end(response.content);
	} else if (query.pathname == conf.url.redirect && querystring.parse(query.query).to !== undefined) {
		res.writeHead(302, {'Location': querystring.parse(query.query).to});
		res.end();
	} else {
		res.writeHead(404, {'Content-Type': 'text/plain'});
		res.end('Not Found\n');
		return;
	}
	var id = querystring.parse(query.query).id || req.headers['referrer'];
	if (id) {
		redis.incr(conf.redis.keyPrefix.total + id);
		redis.incr(conf.redis.keyPrefix.byDay + Date.today().toString('yyyy-MM-dd') + ':' + id);
	}
}).listen(conf.web.port, conf.web.host);
