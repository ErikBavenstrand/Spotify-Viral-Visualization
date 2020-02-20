var data;
var dataWeek = "2020-01-23";
var worldJSON;
var worldCountryZoomJSON;
var currentAttribute = "danceability";
var filesLoaded = false;

var maxColor = {
  red: 29,
  green: 185,
  blue: 80
};
var minColor = {
  red: 4,
  green: 55,
  blue: 79
};

Promise.all([
  d3.json("data/week_mean.json"),
  d3.json("data/world_topology.json"),
  d3.json("data/world_country_zoom.json")
]).then(function(files) {
  filesLoaded = true;
  data = files[0];
  worldJSON = files[1];
  worldCountryZoomJSON = files[2];
  generateWorldMap(files[1]);
  updateWorldMap(data[dataWeek], data.minimum, data.maximum);
  loadAttrList();
  loadCountryList(data[dataWeek]);
  loadTimeSlider();
});
