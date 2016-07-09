const co     = require('co');
const config = require('config');
const Client = require('node-rest-client').Client;
const moment = require('moment');
const log4js = require('log4js');
const fs     = require('fs');

const client = new Client();

log4js.configure(config.log4js.configure);
const logger = {
	error: log4js.getLogger('error'),
	app: log4js.getLogger('app'),
}
for (const key in logger) {
    logger[key].setLevel(config.log4js.level);
}

function getReport(hash) {
	const args = {
		headers: { "Content-Type": "application/json" },
		parameters: {
			apikey: config.appconf.api_key,
			resource: hash
		}
	};

	return new Promise((resolve, reject) => {
		client.post(config.appconf.api_url, args, function (data, response) {
			resolve(data);
		});
	});
}

function sleep(ms) {
	return new Promise((resolve, reject) => {
		setTimeout(()=>{
			resolve();
		}, ms);
	});
}

function getResultHeader() {
	const av_list = config.appconf.av_list;

	// set result header
	const result_header = [];
	result_header.push('sha256');
	result_header.push('sha1');
	result_header.push('md5');
	for(let av_idx = 0, av_len = av_list.length; av_idx < av_len; av_idx++) {
		result_header.push(`${av_list[av_idx]}_detected`);
		result_header.push(`${av_list[av_idx]}_result`);
	}
	return result_header;
}

function getResultRecord(data) {
	const av_list = config.appconf.av_list;

	const result = [];
	// [0]sha256
	result.push(data.sha256);
	// [1]sha1
	result.push(data.sha1);
	// [2]md5
	result.push(data.md5);
	// av_list loop
	for(let av_idx = 0, av_len = av_list.length; av_idx < av_len; av_idx++) {
		result.push(data.scans[av_list[av_idx]].detected);
		result.push(data.scans[av_list[av_idx]].result);
	}
	return result;
}

/*
	ファイルからレポート取得対象のハッシュ値のリストを取得する。
	ファイルフォーマットは１行１ハッシュ値。
*/ 
function loadHashList(filepath) {
	const text = fs.readFileSync(filepath, 'UTF-8');
	return text.split(/\r\n|\r|\n/);
}

function writeResultCSV(result_list, filepath) {
	let result_text = '';
	for(let r_idx = 0, r_len = result_list.length; r_idx < r_len; r_idx++) {
		result_text = result_text + result_list[r_idx].join(',') + '\r\n';
	}
	fs.writeFileSync(filepath, result_text);
}

// Main flow
co(function* () {
	const result_list = [];

	const hash_list = loadHashList('hashlist.txt');
	result_list.push(getResultHeader());

	// hash_list loop
	for(let idx = 0, len = hash_list.length; idx < len; idx++) {
		// check hash
		if(hash_list[idx].length < 1) {
			continue;
		}
		logger.app.info(`Getting report for [${hash_list[idx]}]`);
		if(idx !== 0) {
			yield sleep(15000);
		}
		const data = yield getReport(hash_list[idx]);
		logger.app.info(`report: ${JSON.stringify(data)}`);

		result_list.push(getResultRecord(data));
	}

	writeResultCSV(result_list, 'result.csv');

}).catch((err) => {
	console.log(err);
});
