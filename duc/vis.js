
var vWidth = 740,
  vHeight = 500;

var margin = {top: 20, right: 5, bottom: 30, left: 30},
    width = vWidth - margin.left - margin.right,
    height = vHeight - margin.top - margin.bottom;


var parseDate   = d3.time.format("%Y");

var x = d3.time.scale()
    .range([0, width]);

var y = d3.scale.linear()
    .range([height, 0]);

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom")
    .ticks(5);

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left")
    .ticks(6);

var line = d3.svg.line()
    .interpolate("basis")
    .x(function(d) { return x(d.t); })
    .y(function(d) { return y(d.value); });

var svg = d3.select("#vis").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");



function showRegion(regionCode) {
    var countries = d3.selectAll("path." + regionCode);
    if (countries.classed('highlight')) {
        countries.attr("class", regionCode);
    } else {
        countries.classed('highlight', true);
    }
    var filters = d3.selectAll("#filters" + " #" + regionCode);
    if (filters.classed('highlight')) {
        filters.attr("class", regionCode);
    } else {
        filters.classed('highlight', true);
    }
}



// Load country code to regions data and make it a hash table
var countries2regions = d3.map();
d3.csv('country-regions.csv', function(d) {
  d.forEach(function(dd) {
    countries2regions.set(dd.CountryCode, dd.RegionCode);    
  });
});

var startEnd = {};
// load timeseries data
d3.csv("life-expectancy_tCleaned.csv", function(error, data) {
  id = d3.keys(data[0]).filter(function(key) { return key !== "date"; });

  //format time
  data.forEach(function(d) {
    d.date = parseDate.parse(d.date);
  });

  // create a nested associative array, with country name as key
  var tSeries = id.map(function(name) {
    return {
      name: name,
      values: data.map(function(d) {
        return {t: d.date, value: +d[name]};
      }),
      region: countries2regions.get(name)
    };
  });

  d3.selectAll("#filters a")
    .on("click", function() {
      showRegion(this.id);
      var regionId = this.id;

      var dataset = tSeries.filter(function(d) { return d.region == regionId; });
  });



  // populate startEnd, a hash table for each country id 
  tSeries.forEach(function(d,i) {
    startEnd[d['name']] = { 
      'startT': parseInt(parseDate(tSeries[0]['values'][0]['t'])),
      'endT'  : parseInt(parseDate(tSeries[0]['values'][d.values.length-1]['t'])),
      'startVal': d.values[0]['value'],
      'endVal'  : d.values[d.values.length-1]['value']     
      };
    }) 

  x.domain(d3.extent(data, function(d) { return d.date; }));

  y.domain([
    d3.min(tSeries, function(c) { return d3.min(c.values, function(v) { return v.value; }); }),
    d3.max(tSeries, function(c) { return d3.max(c.values, function(v) { return v.value; }); })
  ]);

  svg.append("g")
      .attr("class", "axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  svg.append("g")
      .attr("class", "axis")
      .call(yAxis);

  var country = svg.selectAll(".country")
      .data(tSeries)
      .enter();
      // .append("g"); remove grouping for speed increase

  country.append("path")
      .attr("d", function(d) { return line(d.values); })
      .attr("country", function(d) {return d.name})
      .attr("class", function(d) {return d.region})
      .on("mouseover", onmouseover)
      .on("mouseout", onmouseout);


// display default text
function default_blurb (d,i) {

    d3.select("#blurb")
        .html("<h2>World</h2> <p>The average life expectancy in the world in " + startEnd[d3.keys(startEnd)[0]]['endT'] + 
        " was 69 years.</p>");
}
default_blurb();

function onmouseover(d, i) {
    var currClass = d3.select(this).attr("class");
    d3.select(this)
        .attr("class", currClass + " current");
    
    var id = d3.select(this).attr("country");
    var countryVals = startEnd[id];
    var percentChange = 100 * (countryVals['endVal'] - countryVals['startVal']) / countryVals['startVal'];
    
    var blurb = '<h2>' + id + '</h2>';
    blurb += "<p>On average: a life expectancy of " + Math.round(countryVals['startVal']) + " years in " + countryVals['startT'] + 
      " and " + Math.round(countryVals['endVal']) + " years in " + countryVals['endT'] + ", ";
    if (percentChange >= 0) {
        blurb += "an increase of " + Math.round(percentChange) + " %."
    } else {
        blurb += "a decrease of " + -1 * Math.round(percentChange) + " %."
    }
    blurb += "</p>";
    
    d3.select("#blurb").html(blurb);
}
function onmouseout(d, i) {
    var currClass = d3.select(this).attr("class");
    var prevClass = currClass.substring(0, currClass.length-8);
    d3.select(this)
        .attr("class", prevClass);
    default_blurb();
}

}); // End d3.csv



