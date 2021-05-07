$(document).ready(function () {
    $("#map").click(() => {
        $('#map-conatiner').show()
        $('#map').addClass("active")
        $('#info').hide()
        $("#chart").removeClass("active")
        $("#references-container").hide()
        $("#references").removeClass("active")
    })

    $("#chart").click(() => {
        $('#map-conatiner').hide()
        $("#map").removeClass("active")
        $('#info').show()
        $("#chart").addClass("active")
        $("#references-container").hide()
        $("#references").removeClass("active")
    })

    $("#references").click(() => {
        $('#references-container').show()
        $("#references").addClass("active")
        $('#map-conatiner').hide()
        $("#map").removeClass("active")
        $('#info').hide()
        $("#chart").removeClass("active")
    })
});

function processCSV(filter) {
    Plotly.d3.csv("mortality.csv", function (data) {
        make_plot(data, filter)
    });
};

function make_plot(csv_data, filter) {
    // let country_data = csv_data.filter(d => d.country == "Afghanistan");
    let country_data = csv_data.filter(d => d.country == filter);

    //To normalise our data, we need to know the minimum and maximum values
    //Math.min doesn't work with strings so we need to convert
    let mortality_data = country_data.map(d => Number(d.mortality))
    let min_mortality = Math.min(...mortality_data)
    let max_mortality = Math.max(...mortality_data)

    //This regression library needs values stored in arrays
    //We are using the strech function to normalise our data
    let regression_data = country_data.map(d => [stretch(d.year, 1950, 2017, 0, 1),
    stretch(d.mortality, min_mortality, max_mortality, 0, 1)])

    //Here is where we train our regressor, experiment with the order value
    let regression_result = regression.polynomial(regression_data, { order: 3 });

    //Now we have a trained predictor, lets actually use it!
    let extension_x = [];
    let extension_y = [];
    for (let year = 2017; year < 2030; year++) {
        //We've still got to work in the normalised scale
        let prediction = regression_result.predict(stretch(year, 1950, 2017, 0, 1))[1]

        extension_x.push(year);
        //Make sure to un-normalise for displaying on the plot
        extension_y.push(stretch(prediction, 0, 1, min_mortality, max_mortality));
    }


    let data = [{
        x: country_data.map(d => d.year),
        y: country_data.map(d => d.mortality),
        mode: 'lines',
        line: {
            color: '#00003f'
        }
    },
    //adding our extension as a second trace
    {
        x: extension_x,
        y: extension_y,
        mode: 'lines',
        line: {
            color: '#a50000'
        }
    }]

    let layout = {
        title: {
            text: `<b>${filter}'s Child Mortality Rate</b>`,
            font: {
                family: 'Courier New, monospace',
                size: 24,
                color: '#fff',
            }
        },
        xaxis: {
            title: {
                text: '<b>Year</b>',
                font: {
                    family: 'Courier New, monospace',
                    size: 16,
                    color: '#fff',
                }
            },
        },
        yaxis: {
            title: {
                text: '<b>Rate</b>',
                font: {
                    family: 'Courier New, monospace',
                    size: 16,
                    color: '#fff',
                }
            }
        },
        paper_bgcolor: "rgba(0,0,0,0)",
        font: { color: "#fff", family: "Arial" }
    }

    Plotly.newPlot('info', data, layout);
}

//This stretch function is actually just the map function from p5.js
function stretch(n, start1, stop1, start2, stop2) {
    return ((n - start1) / (stop1 - start1)) * (stop2 - start2) + start2;
};

function map() {
    var chart = am4core.create("chartdiv", am4maps.MapChart);

    // Config map
    // var title = chart.titles.create();
    // let text = ""
    // title.text = text.toUpperCase();
    // title.fontSize = 28;
    // title.fontWeight = 500;

    // Set map definition

    let countrySelected = ['Angola', 'Benin', 'Botswana', 'Burkina Faso', 'Burundi', 'Cameroon', 'Cape Verde', 'Central African Republic', 'Chad', 'Comoros', 'Congo', 'Ivory Coast', 'D.R. Congo', 'Djibouti', 'Equatorial Guinea', 'Eritrea', 'Ethiopia', 'Gabon', 'Gambia', 'Ghana', 'Guinea', 'Guinea Bissau', 'Kenya', 'Lesotho', 'Liberia', 'Madagascar', 'Malawi', 'Mali', 'Mauricio', 'Mozambique', 'Namibia', 'Niger', 'Nigeria', 'Rwanda', 'Sao Tome and Principe', 'Senegal', 'Seychelles', 'Sierra Leona', 'Somalia', 'South Africa', 'Sudan', 'Swaziland', 'Tanzania', 'Togo', 'Uganda', 'Zambia', 'Zimbabwe']


    // chart.geodata = am4geodata_worldLow;
    chart.geodata = am4geodata_region_world_africaHigh;

    let x = chart.geodata.features

    let y = x.map(e => {
        return e.properties
    })

    let z = y.map(e => {
        if (countrySelected.indexOf(e.name) > -1) {
            return e
        }
        return null
    })

    chart.geodata.features.forEach((e, i) => {
        e.properties = z[i]
    })

    // Set projection
    chart.projection = new am4maps.projections.Miller();

    // Create map polygon series
    var polygonSeries = chart.series.push(new am4maps.MapPolygonSeries());

    // Make map load polygon (like country names) data from GeoJSON
    polygonSeries.useGeodata = true;

    // Configure series
    var polygonTemplate = polygonSeries.mapPolygons.template;
    polygonTemplate.tooltipText = "{name}"; // add chart in hereeeeee
    polygonTemplate.fill = am4core.color("#3e5151"); // color map
    polygonTemplate.propertyFields.fill = "color";
    polygonTemplate.events.on("hit", function (ev) {
        var data = ev.target.dataItem.dataContext;
        if (data.name) {
            processCSV(data.name)
            $('#map-conatiner').hide()
            $("#map").removeClass("active")
            $('#info').show()
            $("#chart").addClass("active")
        }
    });

    // Set up tooltips
    // polygonSeries.calculateVisualCenter = true;
    // polygonTemplate.tooltipPosition = "fixed";
    // polygonSeries.tooltip.label.interactionsEnabled = true;
    // polygonSeries.tooltip.keepTargetHover = true;

    // Create hover state and set alternative fill color
    var hs = polygonTemplate.states.create("hover");
    hs.properties.fill = am4core.color("#feddc4"); //color map hover

    // Remove Antarctica
    polygonSeries.exclude = ["AQ"];

    // Add zoom control
    chart.zoomControl = new am4maps.ZoomControl();
}

map()