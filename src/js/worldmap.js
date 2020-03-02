var world = d3.select("#world").append("svg");
var g = world.append("g");
var worldWidth = parseInt(d3.select(".Root__main-view").style("width"));
var worldHeight = parseInt(d3.select(".Root__main-view").style("height"));

var worldProjection = d3
  .geoMercator()
  .rotate([-12, 0, 0])
  .center([0, 0])
  .scale(worldHeight / 1.3 / Math.PI)
  .translate([worldWidth / 2, worldHeight / 1.5]);
var worldGraticule = d3.geoGraticule();

var worldPath = d3.geoPath().projection(worldProjection);

/* World map zoom */
var zoom = d3
  .zoom()
  .scaleExtent([1, 7])
  .on("zoom", function() {
    var t = d3.event.transform;

    var w_max = 0;
    var w_min = worldWidth * (1 - t.k);
    var h_max = 0;
    var h_min = worldHeight * (1 - t.k);

    t.x = Math.min(w_max, Math.max(w_min, t.x));
    t.y = Math.min(h_max, Math.max(h_min, t.y));

    g.selectAll("path").attr("transform", t);
  });

world.call(zoom);

function generateWorldMap(worldJSON) {
  /* Countries */
  g.selectAll("path")
    .data(worldJSON.features, function(d) {
      return d;
    })
    .enter()
    .append("path")
    .attr("d", worldPath)
    .classed("defaultCountry", true)
    .each(function(d, i) {
      d3.select(this).classed(d.id, true);
    })
    /* On Mouse Enter */
    .on("mouseover", function(d, i) {
      if (d3.select(this).classed("countryIsInCurrentData")) {
        highlightCountryInList(d.id, true);
        highlightCountryOnMap(d.id, true);
      }
    })
    /* On Click */
    .on("click", function(d, i) {
      handleCountryClickShowDetail(d.id);
    })
    /* On Mouse Out */
    .on("mouseout", function(d, i) {
      if (d3.select(this).classed("countryIsInCurrentData")) {
        highlightCountryInList(d.id, false);
        highlightCountryOnMap(d.id, false);
      }
    });
}

function existsOnMap(CC) {
  return d3.select("." + CC)._groups[0][0] !== null;
}

function updateWorldMap(data, minimum, maximum) {
  var CCinData = Object.keys(data);

  d3.selectAll(".defaultCountry")
    .classed("countryIsInCurrentData", false)
    .style("fill", null)
    .filter(function(d) {
      return CCinData.indexOf(d.id) > -1;
    })
    .classed("countryIsInCurrentData", true)
    .each(function(d) {
      d3.select(this).style(
        "fill",
        calculateColorFromValue(
          data[d.id][currentAttribute],
          minimum[currentAttribute],
          maximum[currentAttribute],
          minColor,
          maxColor
        )
      );
    });
  updateLegend(data, minimum, maximum);
}

function handleCountryClickShowDetail(CC) {
  zoomInCountry(CC);
  isInDetailView = true;
}

function highlightCountryOnMap(CC, highlit) {
  if (!existsOnMap(CC)) return;

  if (highlit) {
    g.append("path")
      .attr("d", d3.select("." + CC).attr("d"))
      .classed("countryHighlight", true)
      .attr("id", CC + "-highlit")
      .attr("transform", d3.select("." + CC).attr("transform"));
  } else {
    d3.select("#" + CC + "-highlit").remove();
  }
}

function zoomInCountry(CC) {
  toggleDetailViewVisibility();
  var coords = worldProjection(worldCountryZoomJSON[CC]);
  var x = coords[0];
  var y = coords[1];
  d3.event.stopPropagation();
  world
    .transition()
    .duration(1500)
    .call(
      zoom.transform,
      d3.zoomIdentity
        .translate(worldWidth / 2, worldHeight / 2)
        .scale(1000)
        .translate(-x, -y)
    );
}

function zoomOutCountryHideDetail() {
  toggleDetailViewVisibility();
  d3.event.stopPropagation();
  world
    .transition()
    .duration(1500)
    .call(zoom.transform, d3.zoomIdentity.scale(1));
}
