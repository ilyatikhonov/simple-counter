var http = require('http');
var url = require('url');
var querystring = require('querystring');
var conf = require('simple-settings').init('settings.json', 'settings.local.json');
var redis = require("redis").createClient(conf.redis.port, conf.redis.host);
require('datejs');

http.createServer(function (req, res) {
	var query = querystring.parse(url.parse(req.url).query);
	if (if404(!query.type || !query.id, res)) return;
	var keys = [];
	var id = query.id;
	query.type = query.type.split(',');
	if (query.type.indexOf('total') != -1) {
		keys.push(['total', conf.redis.keyPrefix.total + id]);
	}
	if (query.type.indexOf('total-uniq') != -1) {
		keys.push(['total-uniq', conf.redis.keyPrefix.uniq + conf.redis.keyPrefix.total + id]);
	}
	if (query.type.indexOf('today') != -1) {
		keys.push(['today', conf.redis.keyPrefix.byDay + getToday() + id]);
	}
	if (query.type.indexOf('today-uniq') != -1) {
		keys.push(['today-uniq', conf.redis.keyPrefix.uniq + conf.redis.keyPrefix.byDay + getToday() + id]);
	}
	if (query.type.indexOf('week') != -1) {
		keys.push(['week', getWeek(conf.redis.keyPrefix.byDay, id)]);
	}
	if (query.type.indexOf('week-uniq') != -1) {
		keys.push(['week-uniq', getWeek(conf.redis.keyPrefix.uniq + conf.redis.keyPrefix.byDay, id)]);
	}

	if (if404(keys.length == 0, res)) return;

	var multi = redis.multi();
	keys.forEach(function(row) {
		var name = row[0];
		var prefix = row[1];
		if (prefix instanceof Array) {
			multi.mget.apply(multi, prefix);
		} else {
			multi.get(prefix);
		}
	});
	
	multi.exec(function(err, values) {
		var result = {};
		if (values.length == keys.length) {
			if (values.length == 1) {
				result = values[0];
			} else {
				values.forEach(function(value, i) {
					result[keys[i][0]] = value;
				});
			}
		}
		if (result instanceof Array || result instanceof Object) {
			result = JSON.stringify(result);
		}
		if (query.jsonp_callback) {
			res.writeHead(200, {'Content-type': 'application/x-javascript'});
			res.end(query.jsonp_callback + '(\'' + result + '\');');
		} else {
			res.writeHead(200, {'Content-type': 'text/plain'});
			res.end(result);
		}
		
	});
}).listen(conf.interface.port, conf.interface.host);

function if404(expr, res) {
	if (expr) {
		res.writeHead(404, {'Content-type': 'text/plain'});
		res.end('not found');
	}
	return expr;
}

function getToday() {
	return Date.today().toString('yyyy-MM-dd') + ':';
}

function getWeek(prefix, postfix) {
	var ret = [];
	for (var i = 0; i > -7; i--) {
		ret.push([prefix + Date.today().add(i).days().toString('yyyy-MM-dd') + ':' + postfix]);
	}
	return ret;
}
