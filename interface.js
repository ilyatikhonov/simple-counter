var http = require('http'),
	url = require('url'),
	querystring = require('querystring'),
	conf = require('simple-settings').init('settings.json', 'settings.local.json'),
	redis = require("redis").createClient(conf.redis.port, conf.redis.host)
require('datejs')

http.createServer(function (req, res) {
	try {
		var query = querystring.parse(url.parse(req.url).query)
		if (!query.type || !query.id) {
			throw 'You must set "id" and "type"'
		}
		var keys = []
		var ids = query.id.split(',')
		var types = query.type.split(',')

		ids.forEach(function(id) {
			types.forEach(function(type) {
				if (type == 'total') {
					keys.push(conf.redis.keyPrefix.total + id)
				} else if (type == 'total-uniq') {
					keys.push(conf.redis.keyPrefix.uniq + conf.redis.keyPrefix.total + id)
				} else if (type == 'today') {
					keys.push(conf.redis.keyPrefix.byDay + getToday() + id)
				} else if (type == 'today-uniq') {
					keys.push(conf.redis.keyPrefix.uniq + conf.redis.keyPrefix.byDay + getToday() + id)
				} else if (type == 'week') {
					keys.push(getWeek(conf.redis.keyPrefix.byDay, id))
				} else if (type == 'week-uniq') {
					keys.push(getWeek(conf.redis.keyPrefix.uniq + conf.redis.keyPrefix.byDay, id))
				} else {
					throw 'Unknown type "' + type + '"'
				}

			})
		})
		
		var multi = redis.multi()
		keys.forEach(function(key) {
			if (key instanceof Array) {
				multi.mget.apply(multi, key)
			} else {
				multi.get(key)
			}
		})
		
		multi.exec(function(err, values) {
			var result = {}
			if (values.length != keys.length) {
				throw "Unknown"
			}
			if (ids.length == 1) {
				if (values.length == 1) {
					result = formatValue(values[0])
				} else {
					values.forEach(function(value, i) {
						result[types[i]] = formatValue(value)
					})
				}
			} else {
				if (ids.length == values.length) {
					values.forEach(function(value, i) {
						result[ids[i]] = formatValue(value)
					})
				} else {
					ids.forEach(function(id, i) {
						types.forEach(function(type, j) {
							if (!result[id]) {
								result[id] = {}
							}
							result[id][type] = formatValue(values[i*types.length+j])
						})
					})
				}
			}

			result = JSON.stringify(result)
			if (query.jsonp_callback) {
				res.writeHead(200, {'Content-type': 'application/x-javascript'})
				res.end(query.jsonp_callback + '(\'' + result + '\')')
			} else {
				res.writeHead(200, {'Content-type': 'text/plain'})
				res.end(result)
			}
			
		})
	} catch(err) {
		res.writeHead(403, {'Content-type': 'text/plain'})
		res.end('Error: ' + err)
	}
}).listen(conf.interface.port, conf.interface.host)


function getToday() {
	return Date.today().toString('yyyy-MM-dd') + ':'
}

function getWeek(prefix, postfix) {
	var ret = []
	for (var i = 0; i > -7; i--) {
		ret.push([prefix + Date.today().add(i).days().toString('yyyy-MM-dd') + ':' + postfix])
	}
	return ret
}

function formatValue(val) {
	if (val instanceof Array) {
		val.forEach(function(value, index) {
			val[index] = formatValue(value)
		})
	} else {
		val = parseInt(val)
		if (!val) {
			val = 0
		}
	}
	return val
}
