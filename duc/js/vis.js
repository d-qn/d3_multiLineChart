// Do not replot line chart but simply mask lines with CSS
// 1. Ensure the fluid / responsive design
// WTF with the nesting of functions d3.csv ?? plotLineChart
// 2. Imporve animation
// 3. on window resize remove filter regions or reset filters
// 3. select regions

var margin = {top: 20, right: 30, bottom: 20, left: 30},
  heightWidthRatio = 2.5,
  offsetWidthMargin = 40;

var width = document.getElementById('container').offsetWidth - offsetWidthMargin;
var height = width / heightWidthRatio;

function setup(width,height){

  svg = d3.select("#container").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
}
setup(width,height);


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


// function showRegion(regionCode) {

//     var filters = d3.selectAll("#filters" + " #" + regionCode);
//     // if highlighted filters, un-highlight them if filter selected is different than selected filters
//     var hFilters = d3.selectAll("#filters .highlight");
//     if(hFilters[0].length != 0 && hFilters.attr("id") != filters.attr("id")) {
//       hFilters.classed("highlight", false);
//     }

//     if (filters.classed('highlight')) {
//         filters.classed('highlight', false);
//     } else {
//         filters.classed('highlight', true);
//     }
// } // showRegion end


// Load country code to regions data and make it a hash table / object
var countries2regions = d3.map();
d3.csv('country-regions.csv', function(error, d) {
  d.forEach(function(dd) {
    countries2regions.set(dd.CountryCode, dd.RegionCode);    
  });
});

var startEnd = {};
// display default top text
function default_blurb (d,i) {

    d3.select("#blurb")
        .html("<h2>World</h2> <p>The average life expectancy in the world in " + startEnd[d3.keys(startEnd)[0]]['endT'] + 
        " was 69 years.</p>");
}


function plotLineChart (dataset) {
  // enter mode
  svg.selectAll("[country]")
      .data(dataset)
      .enter()
      // .append("g"); remove grouping for speed increase?
      .append("path")
      .attr("country", function(d) {return d.name});

 svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")");

  svg.append("g")
      .attr("class", "y axis");

  //update mode
  svg.selectAll("[country]")
      .data(dataset)
      .attr("country", function(d) {return d.name})
      .attr("d", function(d) { return line(d.values); })
      .attr("class", function(d) {return d.region})
      .on("mouseover", onmouseover)
      .on("mouseout", onmouseout);

  svg.select(".x.axis")
      .call(xAxis);

  svg.select(".y.axis")
      .call(yAxis);

  // exit mode
  svg.selectAll("[country]")
      .data(dataset)
      .exit()
      .style("stroke", "white")
      .remove();


} // function plotLineChart

var tSeries;
// load timeseries data
d3.csv("life-expectancy_tCleaned.csv", function(error, data) {
  id = d3.keys(data[0]).filter(function(key) { return key !== "date"; });

  //format time
  data.forEach(function(d) {
    d.date = parseDate.parse(d.date);
  });

  // create a nested associative array, with country name as key
  tSeries = id.map(function(name) {
    return {
      name: name,
      values: data.map(function(d) {
        return {t: d.date, value: +d[name]};
      }),
      region: countries2regions.get(name)
    };
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

  default_blurb();

  x.domain(d3.extent(tSeries[0]['values'], function(d) { return d.t;}));
  y.domain([
    d3.min(tSeries, function(c) { return d3.min(c.values, function(v) { return v.value; }); }),
    d3.max(tSeries, function(c) { return d3.max(c.values, function(v) { return v.value; }); })
  ]);

  plotLineChart(tSeries, 500)

  // d3.selectAll("#filters a")
  //   .on("click", function() {
  //     showRegion(this.id);
  //     var regionId = this.id;

  //     plotLineChart(tSeries, 100);
  //     var filters = d3.selectAll("#filters .highlight");
  //       if (filters.classed('highlight')) {
  //           plotLineChart(tSeries.filter(function(d) { return d.region == regionId; }), 700);
  //       } 
  // });

}); // End d3.csv !!!!!!



function onclick(d, i) {
    var currClass = d3.select(this).attr("class");
    if (d3.select(this).classed('selected')) {
        d3.select(this).attr("class", currClass.substring(0, currClass.length-9));
    } else {
        d3.select(this).classed('selected', true);
    }
}


function showRegion(regionCode) {
    var countries = d3.selectAll("path."+regionCode);
    if (countries.classed('highlight')) {
        countries.attr("class", regionCode);
    } else {
        countries.classed('highlight', true);
    }
}


$(document).ready(function() {
    $('#filters a').click(function() {
        var countryId = $(this).attr("id");
        $(this).toggleClass(countryId);
        showRegion(countryId);
    });
    
});





// window resize
d3.select(window).on("resize", throttle);

var throttleTimer;
function redraw() {
  width = document.getElementById('container').offsetWidth - offsetWidthMargin;
  height = width / heightWidthRatio;

  x.range([0, width]);
  y.range([height, 0]);

  d3.select('svg').remove();
  setup(width,height);
  plotLineChart(tSeries,0);
}

function throttle() {
  window.clearTimeout(throttleTimer);
    throttleTimer = window.setTimeout(function() {
      redraw();
    }, 300);
}

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
function onmouseout(d,i) {
    var currClass = d3.select(this).attr("class");
    var prevClass = currClass.substring(0, currClass.length-8);
    d3.select(this)
        .attr("class", prevClass);
    default_blurb();
}


