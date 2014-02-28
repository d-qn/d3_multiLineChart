var regions = { "SAS": "South Asia" , "ECS": "Europe and Central Asia", "MEA": "Middle East & North Africa", 
    "SSF": "Sub-Saharan Africa", "LCN": "Latin America & Caribbean", "EAS": "East Asia &amp; Pacific", "NAC": "North America" },
	w = 740,
	h = 550,
	margin = 30,
    // the column index from which the values start from in the given data table
    valuesFromColIdx = 2,
    minY = 15,
    maxY = 85;



var vis = d3.select("#vis")
    .append("svg:svg")
    .attr("width", w)
    .attr("height", h)
    .append("svg:g");
			
				
// Regions
var countries_regions = {};
d3.text('country-regions.csv', 'text/csv', function(text) {
    var regions = d3.csv.parseRows(text);
    for (i=1; i < regions.length; i++) {
        countries_regions[regions[i][0]] = regions[i][1];
    }
});

var startEnd = {},
    countryCodes = {};
d3.text('life-expectancy-cleaned-all.csv', 'text/csv', function(text) {
    // read each row of the file
    var countries = d3.csv.parseRows(text);

    // first line contain the header, get the years
    var years = countries[0].slice(valuesFromColIdx);

    var startYear = d3.min(years); 
    var endYear   = d3.max(years);
  
    // loop through each row after the header
    for (i=1; i < countries.length; i++) {
        var values = countries[i].slice(valuesFromColIdx, countries[i.length-1]);
        var currData = [];
        countryCodes[countries[i][1]] = countries[i][0];
        
        var started = false;
        for (j=0; j < values.length; j++) {
            if (values[j] != '') {
                currData.push({ x: years[j], y: values[j] });

                if (!started) {
                    startEnd[countries[i][1]] = { 'startYear':years[j], 'startVal':values[j] };
                    started = true;
                } else if (j == values.length-1) {
                    startEnd[countries[i][1]]['endYear'] = years[j];
                    startEnd[countries[i][1]]['endVal'] = values[j];
                }  
            }
        }
        
        var y = d3.scale.linear().domain([maxY, minY]).range([0 + margin, h - margin]),
            x = d3.scale.linear().domain([startYear, endYear]).range([0 + margin -5, w]);

        var line = d3.svg.line()
            .x(function(d,i) { return x(d.x); })
            .y(function(d) { return y(d.y); });

        // Actual line
        vis.append("svg:path")
            .data([currData])
            .attr("country", countries[i][1])
            .attr("class", countries_regions[countries[i][1]])
            .attr("d", line)
            .on("mouseover", onmouseover)
            .on("mouseout", onmouseout);
    }

vis.append("svg:line")
    .attr("x1", x(startYear))
    .attr("y1", y(minY))
    .attr("x2", x(endYear))
    .attr("y2", y(minY))
    .attr("class", "axis")

vis.append("svg:line")
    .attr("x1", x(startYear))
    .attr("y1", y(minY))
    .attr("x2", x(startYear))
    .attr("y2", y(maxY))
    .attr("class", "axis")
            
vis.selectAll(".xLabel")
    .data(x.ticks(5))
    .enter().append("svg:text")
    .attr("class", "xLabel")
    .text(String)
    .attr("x", function(d) { return x(d) })
    .attr("y", h-10)
    .attr("text-anchor", "middle")

vis.selectAll(".yLabel")
    .data(y.ticks(4))
    .enter().append("svg:text")
    .attr("class", "yLabel")
    .text(String)
    .attr("x", 0)
    .attr("y", function(d) { return y(d) })
    .attr("text-anchor", "right")
    .attr("dy", 3)
            
vis.selectAll(".xTicks")
    .data(x.ticks(5))
    .enter().append("svg:line")
    .attr("class", "xTicks")
    .attr("x1", function(d) { return x(d); })
    .attr("y1", y(minY))
    .attr("x2", function(d) { return x(d); })
    .attr("y2", y(minY)+7)
    
vis.selectAll(".yTicks")
    .data(y.ticks(4))
    .enter().append("svg:line")
    .attr("class", "yTicks")
    .attr("y1", function(d) { return y(d); })
    .attr("x1", x(startYear-0.5))
    .attr("y2", function(d) { return y(d); })
    .attr("x2", x(startYear))


});  
    


// function onclick(d, i) {
//     var currClass = d3.select(this).attr("class");
//     if (d3.select(this).classed('selected')) {
//         d3.select(this).attr("class", currClass.substring(0, currClass.length-9));
//     } else {
//         d3.select(this).classed('selected', true);
//     }
// }

// d3.select("#filters")
//     .on("click", function (d,i) {
//        d3.select("#filters").style("background", "black");
//     });

//d3.selectAll("input[name=region]").on("change", colorchange);

// display default text
function default_blurb (d,i) {
    d3.select("#blurb")
        .html("<h2>World</h2> <p>The average life expectancy in the world in 2011 was 69 years.</p>");
}

function onmouseover(d, i) {
    var currClass = d3.select(this).attr("class");
    d3.select(this)
        .attr("class", currClass + " current");
    
    var countryCode = d3.select(this).attr("country");
    var countryVals = startEnd[countryCode];
    var percentChange = 100 * (countryVals['endVal'] - countryVals['startVal']) / countryVals['startVal'];
    
    var blurb = '<h2>' + countryCodes[countryCode] + '</h2>';
    blurb += "<p>On average: a life expectancy of " + Math.round(countryVals['startVal']) + " years in " + countryVals['startYear'] + " and " + Math.round(countryVals['endVal']) + " years in " + countryVals['endYear'] + ", ";
    if (percentChange >= 0) {
        blurb += "an increase of " + Math.round(percentChange) + " %."
    } else {
        blurb += "a decrease of " + -1 * Math.round(percentChange) + " %."
    }
    blurb += "</p>";
    
    d3.select("#blurb")
        .html(blurb);
}
function onmouseout(d, i) {
    var currClass = d3.select(this).attr("class");
    var prevClass = currClass.substring(0, currClass.length-8);
    d3.select(this)
        .attr("class", prevClass);

    default_blurb();
}
