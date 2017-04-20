/**
 * 渡されたスクリーンネームユーザーのツイートを取得するサンプル
 */
var __ = require('underscore');
var fs = require('fs-extra');
var moment = require('moment');
moment.locale('ja');
var bigInt = require('big-integer');

var twitterLib = require('twitter');
var twitterClient = new twitterLib({
  consumer_key   : '',
  consumer_secret: '',
  bearer_token   : ''
});

// 対象スクリーンネーム
if (process.argv.length < 3) {
  console.error('スクリーンネームを渡してください。');
  process.exit(1);
}
var targetScreenName = process.argv[2];

// 最大取得過去日時（※3ヶ月前まで）
var limitDateTime = moment().subtract(3, 'months');

var params = {
  screen_name: targetScreenName,
  count: 200,
  trim_user: true,      // ツイートごとにユーザー情報が付与するのを止める
  include_rts: false,   // リツイートは除外する
  exclude_replies: true // リプライを除外する
};

var tweets = [];

requestUserTimeline(params);

function requestUserTimeline(params) {
  twitterClient.get('statuses/user_timeline', params, callbackUserTimeline);
}

function callbackUserTimeline(error, data, response) {
  var maxId = null;

  if (error) {
    console.error(error);
    process.exit(1);
  }

  var tweetCreatedAt;
  __.every(data, function (element, index, list) {
    tweetCreatedAt = moment(new Date(element.created_at))

    if (tweetCreatedAt.isAfter(limitDateTime)) {
      tweets.push(element);
      maxId = element.id_str;
      return true;
    } else {
      maxId = null;
      return false;
    }
  });

  // 続けて取得する場合は、再度リクエストする
  if (maxId !== null) {
    params.max_id = bigInt(maxId).subtract(1).toString();
    requestUserTimeline(params);
  } else {
    // これで終わりならJSON形式でファイルを出力して終了する
    fs.writeJsonSync(targetScreenName + '.json', tweets);
    process.exit(0);
  }
}