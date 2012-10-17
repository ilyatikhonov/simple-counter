var fs = require('fs');

exports.init = function(defaultSettings, customSettings) {
	try {
		if (defaultSettings.constructor == String) {
			defaultSettings = JSON.parse(fs.readFileSync(defaultSettings, 'UTF-8'));
		}

		if (customSettings.constructor == String) {
			customSettings = JSON.parse(fs.readFileSync(customSettings, 'UTF-8'));
		}
	} catch(Error) {}
	
	if (customSettings instanceof Object) {
		for (i in defaultSettings) {
			if (customSettings[i] !== undefined) {
				if (defaultSettings[i] instanceof Object) {
					defaultSettings[i] = exports.init(defaultSettings[i], customSettings[i]);
				} else {
					defaultSettings[i] = customSettings[i];
				}
			}
		}
	}

	return defaultSettings;
}