var Service, Characteristic;

module.exports = function (homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;

  homebridge.registerPlatform("homebridge-trendnet-babycam", "TrendnetBabyCam", TrendnetPlatform);
  homebridge.registerAccessory("homebridge-trendnet-babycam", "TrendnetBabyCamSwitch", TrendnetMusicSwitch);
  homebridge.registerAccessory("homebridge-trendnet-babycam", "TrendnetBabyCam", TrendnetTemp);
};

function TrendnetPlatform(log, config) {
  this.log = log;
  this.config = config;
}

TrendnetPlatform.prototype = {

  accessories: function (callback) {
    var accessories = [];
    var switchAccessory = new TrendnetMusicSwitch(this.log, this.config);
    accessories.push(switchAccessory);

    var tempAccessory = new TrendnetTemp(this.log, this.config);
    accessories.push(tempAccessory);

    callback(accessories);
    this.log("platform loaded.")
  }
}

function TrendnetMusicSwitch(log, config) {
  this.log = log;
  this.password = config["password"];
  this.username = config["username"];
  this.host = config["host"];
  this.name = "TrendnetMusic";

  this.digest = require('http-digest-client')(this.username, this.password);

  this.service = new Service.Switch(this.name);
  this.service.getCharacteristic(Characteristic.On)
    .on('get', this.getState.bind(this))
    .on('set', this.setState.bind(this));
}

TrendnetMusicSwitch.prototype.getState = function (callback) {
  this.digest.request({
    host: this.host,
    path: '/cgi/web_event.cgi',
    port: 80,
    method: 'GET',
    headers: { "User-Agent": "IP Camera Viewer" } // Set any headers you want
  }, function (response) {
    var body = '';
    response.on('data', function (data) {
      ///console.log("chunk received :" + i.toString());
      //console.log(data.toString());
      body += data.toString();
      if (body.indexOf('playing_music=') > 0) {
        response.destroy();
      }
    });

    response.on('end', function (err) {

      var state = false;
      if (body.indexOf("playing_music=on") > 0)
        state = true;
      callback(null, state)

      //console.log(body);
    });

    response.on('error', function (err) {
      console.log('oh noes');
    });
  });
}

TrendnetMusicSwitch.prototype.setState = function (toggle, callback, context) {
  var callbacked = false;
  var path = '/eng/music_control.cgi?command=play&shuffleOn=1';
  if (!toggle) {
    path = '/eng/music_control.cgi?command=stop';
  }
  this.digest.request({
    host: this.host,
    path: path,
    port: 80,
    method: 'GET',
  }, function (res) {
    res.on('data', function (data) {
      console.log("request ok");
      //console.log(data.toString());
      if (!callbacked) {
        callbacked = true;
        callback(null);
      }
    });
    res.on('error', function (err) {
      console.log('oh shit');
      if (!callbacked) {
        callbacked = true;
        callback(err);
      }
    });
  });
}

TrendnetMusicSwitch.prototype.getServices = function () {
  return [this.service];
}

function TrendnetTemp(log, config) {
  this.log = log;
  this.password = config["password"];
  this.username = config["username"];
  this.host = config["host"];
  this.name = "TrendnetTemp";

  this.digest = require('http-digest-client')(this.username, this.password);

  this.service = new Service.TemperatureSensor(this.name);
  this.service.getCharacteristic(Characteristic.CurrentTemperature)
    .on('get', this.getState.bind(this));
}

TrendnetTemp.prototype.getState = function (callback) {
  this.digest.request({
    host: this.host,
    path: '/cgi/web_event.cgi',
    port: 80,
    method: 'GET',
    headers: { "User-Agent": "IP Camera Viewer" } // Set any headers you want
  }, function (response) {
    var body = '';
    response.on('data', function (data) {
      ///console.log("chunk received :" + i.toString());
      //console.log(data.toString());
      body += data.toString();
      var index = 0;
      index = body.indexOf('tdC=');
      if (index > 0) {
        console.log('foud Temp at' + index.toString())
        //console.log('destroying...');
        response.destroy();
      }
    });

    response.on('end', function (err) {

      var state = false;
      console.log(body);
      var index = body.indexOf('tdC=');
      if (index > 0) {
        var tempC = body.substring(index + 4, index + 6);
        console.log("temp:" + tempC);
        var theTemp = parseFloat(tempC);
        theTemp -= 4;
        callback(null, theTemp);
      }
      else {
        callback("tempnotfound");
      }
    });

    response.on('error', function (err) {
      console.log('oh noes');
      callback(err);
    });
  });
}

TrendnetTemp.prototype.getServices = function () {
  return [this.service];
}