/*! viral-50 v0.0.1 | (c) 2020 Erik Båvenstrand | MIT License | https://github.com/ErikBavenstrand/DH2321-Spotify-Project */
// variables for keeping track of data
var chartCountryLines = [];
var lineChartColors = ["#ef4760", "#fdd161", "#40c990", "#2f8ba0", "#845f80", "#ee840e"];
var usedLineChartColors = []; // one boolean per color
// initialize colors to unused
lineChartColors.forEach((function(){ usedLineChartColors.push(false); }));

var chart, lineMarker, chartTooltip, prevTooltipDate, lineAttrMinY, lineAttrMaxY;

// TODO:
/*
- Update with colors according to rest of detail view
- Review styling of graph glyphs with several countries
- Review tooltip position and data with new graph
- Better ticks on each axis (dynamic) - min/max per loaded data?
- Zooming of x-axis (?)
- Styling of tooltip and possibly change its animation (opacity?) - use tooltip.scss
*/
/* DONE:
- Hover animation
- Horizontal data picker/line marker
- Discrete movement of data picker (only on data points)
- Animation of line onload
- Horizontal grid lines
- Clean up classed properties of data point circles
- Tooltip over data picker
- Animated tooltip
- Basic Legend
- Put data marker at currently selected week from timeslider
- Scale size according to rest of detail view (currently hardcoded 60%x28% size)
- Adapt graph to work with multiple (up to 3) countries
- Add color difference in lines
- Y-axis rescale to min/max for whole dataset
- Reverse order on x-axis (dates inverted indices)
- Change x-axis to work with dates rather than indices
- Handle countries missing data for certain time periods
*/
/* SKIPPED:
  - Use <selection>.join() to animate when data enters/exits the graph -- Probably not
  - Animate line proportional to size
*/

var container = d3.select("#linechart");
// set up size and margin of chart
var margin = {top: 50, right: 30, bottom: 20, left: 50},
  totalWidth = +container.style("width").slice(0, -2),  // .style returns with 'px' after,
  innerWidth = totalWidth - margin.left - margin.right, //  slice it out and force the
  totalHeight = +container.style("height").slice(0, -2),//  result to a number
  innerHeight = totalHeight - margin.top - margin.bottom;

// number of weeks (utils.js) for indexing x axis
var xMax = weeks.length -1;

// set up scales for chart
var xScale = d3.scaleTime()
    .domain([ new Date(weeks[weeks.length-1]), new Date(weeks[0]) ])
    .range([0, innerWidth]);
// old x-scale
/*
var xScale = d3.scaleLinear()
    .domain([0, xMax])
    .range([0, innerWidth]);
*/

var yScale = d3.scaleLinear()
    .range([innerHeight, 0]);

// generate a line model that will be applied to each set of data
var lineModel = d3.line()
    .x((function(d) { return xScale(d.x); }))
    .y((function(d) { return yScale(d.y); }))
    .curve(d3.curveLinear); // strict straight lines between each data point

/* 
  ==================================
  ==========-FUNCTIONS-=============
  ==================================
*/

function changeLineChartAttribute(){
  prevCountryLines = chartCountryLines;
  // empty the array with countries' line data
  chartCountryLines = [];
  prevCountryLines.forEach((function(lineObj){
    // re-add the countries with same colors
    // function call will load from selected attribute
    addCountryToLineChart(lineObj.CC, lineObj.color);
  }));

  // update to match newly selected attribute
  updateLineChartMinMax();

}

function updateLineChartMinMax(){
  // find min and max for selected attribute
  lineAttrMinY = data_attrs.minimum[currentAttribute];
  lineAttrMaxY = data_attrs.maximum[currentAttribute];
  yScale.domain([lineAttrMinY, lineAttrMaxY]);
}

function addCountryToLineChart(CC, usedColor){
  // turn dates/min/max object into an array
  // where each element holds the values of the keys
  var objVals = Object.values(data_attrs);
  var line = [];
  objVals.filter((function(d, i){
    // filter out the min and max data for the period
    // and keep the data corresponding to dates instead
    return i < objVals.length - 2;
  })).map((function(d){
    // pick out the data from the right country
    // and the right attribute, avoid the weeks where
    // no data exists for selected country
    if(typeof d[CC] !== 'undefined')
      line.push(d[CC][currentAttribute]); 
  }));
  // get the first weeks (chronologically) at lowest indices
  line.reverse();
  // how many weeks should be skipped for this country
  var weeksOffset = weeks.length - line.length;
  line = line.map((function(d, i){
    // the index of the weeks-array (index 0 is last week)
    var wi = (weeks.length-1) - (i+weeksOffset);
    return {'x': new Date(weeks[wi]), 'y': d};
  }));

  // find available color
  var colorIdx;
  usedLineChartColors.some((function(d, i){
    // save any one that is free
    if(!d){
      colorIdx = i;
    }
    return !d; // exit once one is found
  }));
  // if the function is passed the color for the country,
  // i.e. it is being re-added for a different attribute,
  // use that color instead of the randomly selected
  if(typeof usedColor !== 'undefined') colorIdx = usedColor;

  // mark the selected color as used
  usedLineChartColors[colorIdx] = true;

  // add as an object to the array that will determine drawn lines
  // and save the index of the country to keep track of colors
  chartCountryLines.push({ "CC": CC, "data": line, "color": colorIdx });

  // reload the entire chart with the updated
  reloadLineChart();
}

function removeCountryFromLineChart(CC){
  // update the array of lists and the colors used
  chartCountryLines = chartCountryLines.filter((function(lineObj){
    // the country code corresponds to the one to remove
    if(lineObj.CC == CC){
      // mark its color as unused
      usedLineChartColors[lineObj.color] = false;
      return false; // do not include in new array
    }else return true; // keep the rest
  }));

  // redraw the graph without the removed country
  reloadLineChart();
}

function reloadLineChart(){
    // make sure to initialize the y-axis domain to the
    // currently selected attributes min and max values
    updateLineChartMinMax();

    // recreate the container and all of its essential elements
    createLineChart();
    // for dynamic y-axis if desired later (change countryLines to checking all 3)
    //yScale.domain(d3.extent(countryLines, function(d){return d.y;}))

    chartCountryLines.forEach((function(lineObj){
      // add the line path itself
      drawLine(lineObj);
      // add dots (~scatter plot) for each data point
      addDataPointDots(lineObj);  
    }));
    // add horizontal gridlines
    addGridLines();
    // make sure the data marker is at the right point in time
    changeLineChartWeek();
}

function createLineChart(){
    // remove the previously existing element
    container.selectAll("svg").remove();
    // create the svg container element
    chart = container.append("svg")
      .attr("width", totalWidth)
      .attr("height", totalHeight)
      .append("g")
      // move the chart according to the margin
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // append x- and y-axis
    //var xAxis = 
    chart.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + innerHeight+ ")")
      .call( d3.axisBottom(xScale) // create the (x) axis component itself
      .ticks(d3.timeYear.every(1))
      .tickFormat(d3.timeFormat('%Y'))
      ); 

    //var yAxis = 
    chart.append("g")
      .attr("class", "y axis")
      .call(d3.axisLeft(yScale)); // create the (y) axis component itself


    // provide mouse over vertical line
    lineMarker = chart.append("rect")
      .attr("class", "chart-marker")
      .style("position", "absolute")
      .style("z-index", "19")
      .style("width", "2px")
      .style("height", innerHeight);

    // prepare tooltip element for marked data
    d3.selectAll(".chart-tooltip").remove();
    chartTooltip = container.append("div")
      .attr("class", "chart-tooltip")
      .style("opacity", 0)
      .style("left", margin.left)
      .style("top", totalHeight);
    // used for smoother animation in tooltip movement
    prevTooltipX = 0;

    // end of createLineChart()
}

function drawLine(lineObj){
    // append the line itself
    chart
      .append("path")
      .attr("class", "line")
      .classed("line-loaded", true)
      .attr("stroke", lineChartColors[lineObj.color])
      .data([lineObj.data])       
      .attr("d", lineModel);
}

function addGridLines(){
    // add grid lines to y-axis
    var yTicks = d3.selectAll(".y.axis > .tick");
    yTicks.each((function(){
      var l = d3.create("svg:line")
        .attr("class", "y-gridline")
        .attr("x1", 0)
        .attr("x2", innerWidth);
      this.append(l.node());
    }));
}

function addDataPointDots(lineObj){
    // add one circle per data point
    chart.selectAll(".dot")
      .data(lineObj.data)
    .enter().append("circle")
      .attr("class", "chart-dot") // Assign a class for styling
      .attr("opacity", "0.5")
      .attr("cx", (function(d) { return xScale(d.x); }))
      .attr("cy", (function(d) { return yScale(d.y); }))
      .attr("r", 3) // radius of 3px
      .attr("fill", lineChartColors[lineObj.color]);
}

function changeLineChartWeek(){
  var currentDate = new Date(dataWeek);
  var mousex = xScale(currentDate);
  // center the marker on the data point's x-value
  lineMarker.attr("x", (mousex - 0.5) + "px");

  // rounded off to closest x index
  var xMouseVal = currentDate;

  // animate data point if on the line marker
  // and transition out if not on line marker anymore
  var dots = chart.selectAll(".chart-dot")
      .classed("focus", (function(d){
        return +d.x == +xMouseVal;
      }))
      .classed("nonfocus", (function(d){
        return +d.x != +xMouseVal;
      }));
  dots.each((function(d){
      if(+d.x == +xMouseVal ){
        updateChartTooltip(d, currentDate);
      }
      }));
}

function updateChartTooltip(d, currentDate){
  // dynamic positioning of tooltip
  var xpos = xScale(currentDate) + margin.left/2;
  var ypos = margin.top - 20;//yScale(countryLines[xIdx].y) + margin.top - 35;
  
  // show x- and y-values (y-value rounded off to 3 decimal places)
  var content = "Y: " + d.y.toFixed(3);

  // stop all previous transitions if marked data is new
  if(currentDate != prevTooltipDate)
    chartTooltip.interrupt();
  // move the tooltip to its new position
  chartTooltip.transition()
    .duration(200)
    .delay(100)
    .ease(d3.easeCubic)
    .style("opacity", 0.85)
    .style("left", xpos+"px")
    .style("top", ypos+"px");
  // update the content of the tooltip
  chartTooltip.html(content);
  prevTooltipDate = currentDate;
}