// >$ npm install request --save 
var request = require("request");
var dal = require('./storage.js');

// http://stackoverflow.com/questions/10888610/ignore-invalid-self-signed-ssl-certificate-in-node-js-with-https-request
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";


var BASE_URL = "https://web-ims.thomasmore.be/datadistribution/API/2.0";
var Settings = function (url) {
    this.url = BASE_URL + url;
    this.method = "GET";
    this.qs = {format: 'json'};
    this.headers = {
        authorization: "Basic aW1zOno1MTJtVDRKeVgwUExXZw=="
    };
};

var Drone = function (id, name, mac, loc, lpd, files, fcount) {
    this._id = id;
    this.name = name;
    this.mac_address = mac;
    this.location = loc;
    this.last_packet_date = lpd;
    this.files = files;
    this.files_count = fcount;
};

var File = function (fid, dl, dfr, dlr, url, ref, cont, ccount) {
    this.file_id = fid;
    this.date_loaded = dl;
    this.date_first_record = dfr;
    this.date_last_record = dlr;
    this.url = url;
    this.ref = ref;
    this.contents = cont;
    this.contents_count = ccount;
};

var Content = function (id, mac, datetime, rssi, url, ref) {
    this.id = id;
    this.mac_address = mac;
    this.datetime = datetime;
    this.rssi = rssi;
    this.url = url;
    this.ref = ref;
};


var dronesSettings = new Settings("/drones?format=json");

dal.clearDrone();
dal.clearFile();
dal.clearContent();

request(dronesSettings, function (error, response, dronesString) {
var drones = JSON.parse(dronesString);
        // console.log(drones);
        console.log("***************************************************************************");
        drones.forEach(function (drone) {
        var droneSettings = new Settings("/drones/" + drone.id + "?format=json");
                request(droneSettings, function (error, response, droneString) {
                var drone = JSON.parse(droneString);
                        dal.insertDrone(new Drone(
                                drone.id,
                                drone.name,
                                drone.mac_address,
                                drone.location,
                                drone.last_packet_date,
                                drone.files,
                                drone.files_count
                                ));
                        var filesSetting = new Settings("/files?drone_id.is=" + drone.id + "&format=json&date_loaded.greaterOrEqual=2016-12-21");
                        request(filesSetting, function (error, response, filesString) {
                        var files = JSON.parse(filesString);
                                //console.log(files);
                                files.forEach(function (file) {
                                var fileDetailSetting = new Settings("/files/" + file.id + "?format=json");
                                        //console.log(fileDetailSetting);
                                        request(fileDetailSetting, function (error, response, fileDetailString) {
                                        var file = JSON.parse(fileDetailString);
                                                dal.insertFile(
                                                        new File(
                                                                file.id,
                                                                file.date_loaded,
                                                                file.date_first_record,
                                                                file.date_last_record,
                                                                file.url,
                                                                file.ref,
                                                                file.contents,
                                                                file.contents_count,
                                                                drone.id
                                                                ));
                                                var contentSetting = new Settings("/files/" + file.id + "/contents?format=json&embed");
                                                request(contentSetting, function (error, response, ContentString) {
                                                var content = JSON.parse(contentSetting);
                                                        dal.insertContent(
                                                                new Content(
                                                                        content.id,
                                                                        content.mac_address,
                                                                        content.datetime,
                                                                        content.rssi,
                                                                        content.url,
                                                                        content.ref
                                                                        ));
                                                });
                                        });
                                });
                        });
                });
        });
});

