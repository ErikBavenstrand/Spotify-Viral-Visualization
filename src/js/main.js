var data_attrs;
var data_songs;
var dataWeek = "2020-01-23";
var worldJSON;
var worldCountryZoomJSON;
var countryCCJSON;
var currentAttribute = "danceability";
var filesLoaded = false;
var isInDetailView = false;
var selectedCountries = [];

var maxColor = {
  red: 30,
  green: 215,
  blue: 96
};
var minColor = {
  red: 5,
  green: 41,
  blue: 17
};

Promise.all([
  d3.json("data/week_mean_normalized.json"),
  d3.json("data/world_topology.json"),
  d3.json("data/world_country_zoom.json"),
  d3.json("data/countries.json"),
  d3.json("data/week_countries_songs_normalized.json")
]).then(function(files) {
  filesLoaded = true;
  data_attrs = files[0];
  worldJSON = files[1];
  worldCountryZoomJSON = files[2];
  countryCCJSON = files[3];
  data_songs = files[4];
  generateWorldMap(files[1]);
  updateWorldMap(data_attrs[dataWeek], data_attrs.minimum, data_attrs.maximum);
  loadAttrList();
  loadCountryList(data_attrs[dataWeek], countryCCJSON);
  loadTimeSlider();
});
