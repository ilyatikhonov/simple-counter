var http = require('http'),
	url = require('url'),
	querystring = require('querystring'),
	conf = require('simple-settings').init('settings.json', 'settings.local.json'),
	redis = require("redis").createClient(conf.redis.port, conf.redis.host),
	Cookies = require('cookies');

require('datejs');

if (conf.response.img.fileName) {
	conf.response.img.content = require('fs').readFileSync(conf.response.img.fileName);
}

http.createServer(function (req, res) {
	if (conf.uniq.enabled) {
		var cookies = new Cookies(req, res);
		var userId = cookies.get(conf.uniq.cookieName);
		if (userId === undefined || userId.length != conf.uniq.idLength) {
			userId = randomString(conf.uniq.idLength);
			cookies.set(conf.uniq.cookieName, userId, {expires: (new Date).add(conf.uniq.expireTime).seconds()});
		}
	}

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
		res.end('Not Found');
		return;
	}

	var id = querystring.parse(query.query).id || req.headers['referrer'];
	if (id) {
		var multi = redis.multi()
			.incr(conf.redis.keyPrefix.total + id)
			.incr(conf.redis.keyPrefix.byDay + Date.today().toString('yyyy-MM-dd') + ':' + id);

		if (userId) {
			var id = conf.redis.keyPrefix.userId + id + ':' + userId;
			redis.multi()
				.getset(id, '1')
				.expire(id, conf.uniq.expireTime)
				.exec(function(err, replies) {
					console.log(replies)
					if (replies[0] != '1') {
						multi.incr(conf.redis.keyPrefix.uniq + conf.redis.keyPrefix.total + id);
					}
					multi.exec();
				});

			var id = conf.redis.keyPrefix.userId + Date.today().toString('yyyy-MM-dd') + ':' + id + ':' + userId;
			redis.multi()
				.getset(id, '1')
				.expire(id, 86400) //24h
				.exec(function(err, replies) {
					console.log(replies)
					if (replies[0] != '1') {
						multi.incr(conf.redis.keyPrefix.uniq + conf.redis.keyPrefix.byDay + Date.today().toString('yyyy-MM-dd') + ':' + id);
					}
					multi.exec();
				});
		} else {
			multi.exec();
		}
		
	}
}).listen(conf.web.port, conf.web.host);

function randomString(charsCount){
	var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'; //64 chars, like BASE64
	var ret = '';
	while (charsCount > 0) {
		for (var i = 26; i > 0 && charsCount > 0; i -= 6, charsCount--) {
			ret+=chars[0x3F & Math.floor(Math.random()*0x100000000) >>> i];
		}
	}
	return ret;
}