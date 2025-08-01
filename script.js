//this code was tested and working on google chrome
const chartDiv = document.getElementById("chart");

const unpack = (data, key) => data.map((row) => row[key]);

//global variables
let interval;
let j = 0;

Promise.all([d3.csv("room1_data.csv"), d3.csv("room2_data.csv")]).then(
  ([room1Data, room2Data]) => {
    let time = unpack(room1Data, "time");

    //getting the time
    function getTime(x) {
      //splitting the time string into hours and minutes then mapping to number
      const [hours, minutes] = time[x].split(":").map(Number);
      //updating the clock on the page
      if (hours < 12) {
        document.getElementById("time").innerHTML = time[x]+"AM";
      } else {
        document.getElementById("time").innerHTML = time[x]+"PM";
      }
      //splitting the time string into hours and minutes then mapping to number
      return [hours, minutes];
    }

    //creating a function to define what is good or bad for each variable
    function comfort(min, max, deviation, value) {
      if (value >= min && value <= max) {
        // returning 10, the highest score
        return 10;
      } else {
        //calculating gap between the current value and the ideal range
        const gap = value < min ? min - value : value - max;

        if (gap > deviation) {
          return 0;
        } else {
          // using logarithms to calculate growth/decay
          //restricting boundaries between 0 and 1
          const decay = Math.log(gap + 1) / Math.log(deviation + 1);
          // inverting so that the closer the value is to the ideal value, then the higher the number is
          const score = 10 * (1 - decay);
          return Math.round(score * 10) / 10;
        }
      }
    }

    //good or bad for cycled varaibles- light and sound- where the min/max is defined by the time
    function cycleComfort(dayMax, nightMax, deviation, value, time) {
      const numVal = Number(value);
      const hour = time[0];
      //daytime
      if (hour > 7 && hour < 19) {
        if (numVal < dayMax) {
          return 10;
        } else {
          const over = numVal - dayMax;
          if (over > deviation) {
            return 0;
          } else {
            const decay = Math.log(over + 1) / Math.log(deviation + 1);
            const score = 10 * (1 - decay);
            return Math.round(score * 10) / 10;
          }
        }
        //nighttime
      } else {
        if (numVal < nightMax) {
          return 10;
        } else {
          const over = numVal - nightMax;
          if (over > deviation) {
            return 0;
          } else {
            const decay = Math.log(over + 1) / Math.log(deviation + 1);
            const score = 10 * (1 - decay);
            return Math.round(score * 10) / 10;
          }
        }
      }
    }

    function roomComfort(dataset, room) {
      let roomComfort =
        comfort(22, 26, 5, dataset.temp) +
        comfort(30, 60, 10, dataset.humidity) +
        cycleComfort(600, 25, 200, dataset.light, time) +
        cycleComfort(65, 45, 5, dataset.sound, time) +
        comfort(400, 900, 150, dataset.co2);
      roomComfort = roomComfort / 5;
      document.getElementById(room+"Rating").innerHTML = "Rating: " + Math.round(roomComfort * 10) / 10

      switch (true) {
        case roomComfort <= 1:
          document.getElementById(room).style.backgroundColor = "#D94545bb";
          break;
        case roomComfort <= 2:
          document.getElementById(room).style.backgroundColor = "#D2524Abb";
          break;
        case roomComfort <= 3:
          document.getElementById(room).style.backgroundColor = "#C26F56bb";
          break;
        case roomComfort <= 4:
          document.getElementById(room).style.backgroundColor = "#B6845Fbb";
          break;
        case roomComfort <= 5:
          document.getElementById(room).style.backgroundColor = "#AC9566bb";
          break;
        case roomComfort <= 6:
          document.getElementById(room).style.backgroundColor = "#9CB172bb";
          break;
        case roomComfort <= 7:
          document.getElementById(room).style.backgroundColor = "#A0AA6Fbb";
          break;
        case roomComfort <= 8:
          document.getElementById(room).style.backgroundColor = "#93C27Abb";
          break;
        case roomComfort <= 9:
          document.getElementById(room).style.backgroundColor = "#8ECB7Ebb";
          break;
        case roomComfort <= 10:
          document.getElementById(room).style.backgroundColor = "#86D984bb";
          break;
      }
    }

    //on click of a single room then it shows this
    function room(roomData, roomNumber) {
      //j++ will access the next row in the dataset
      // currently set to 00:00 (j = 0) (essentially j++ = + 1 minute)

      //function used on hover specifying the requirements of a variable depending on the time of day
      function hoverTime(dayMax, nightMax, time, unit) {
        const hour = time[0];
        if (hour > 7 && hour < 19) {
          return " Required: <b>< " + dayMax + unit + "</b>";
        } else {
          return " Required: <b>< " + nightMax + unit + "</b>";
        }
      }

      //drawing all of the traces
      function defineTraces(dataset, time) {
        /* ----- TEMPERATURE ----- */
        let tempTrace = {
          x: [comfort(22, 26, 5, dataset.temp)],
          y: [0.5],
          name: "Temperature",
          mode: "markers",
          type: "scatter",
          marker: {
            color: "#fff",
          },
          hovertemplate:
            "<b><i> Temperature </i></b><br>" +
            " Currently at <b>" +
            dataset.temp +
            "°C </b><br> Required: <b>22-26°C</b> <br><extra></extra>",
        };

        /* ----- HUMIDITY ----- */
        let humidTrace = {
          x: [comfort(30, 60, 10, dataset.humidity)],
          y: [1],
          name: "Humidity",
          mode: "markers",
          type: "scatter",
          marker: {
            color: "#fff",
          },
          hovertemplate:
            "<b><i> Humidity </i></b><br>" +
            " Currently at <b>" +
            dataset.humidity +
            "% </b><br> Required: <b>30-60%</b> <br><extra></extra>",
        };

        /* ----- LIGHT ----- */
        let lightTrace = {
          x: [cycleComfort(600, 25, 200, dataset.light, time)],
          y: [1.5],
          name: "Light",
          mode: "markers",
          type: "scatter",
          marker: {
            color: "#fff",
          },
          hovertemplate:
            "<b><i> Light levels </i></b><br>" +
            " Currently at <b>" +
            dataset.light +
            " lux </b><br>" +
            hoverTime(600, 25, time, " lux") +
            "<extra></extra>",
        };

        /* ----- SOUND ----- */
        let soundTrace = {
          x: [cycleComfort(65, 45, 5, dataset.sound, time)],
          y: [2],
          name: "Sound",
          mode: "markers",
          type: "scatter",
          marker: {
            color: "#fff",
          },
          hovertemplate:
            "<b><i> Sound levels </i></b><br>" +
            " Currently at <b>" +
            dataset.sound +
            " dB </b><br>" +
            hoverTime(65, 45, time, " dB") +
            "<extra></extra>",
        };

        /* ----- CO2 ----- */
        let co2Trace = {
          x: [comfort(400, 900, 150, dataset.co2)],
          y: [2.5],
          name: "CO2",
          mode: "markers",
          type: "scatter",
          marker: {
            color: "#fff",
          },
          hovertemplate:
            "<b><i> CO2 levels </i></b><br>" +
            " Currently at <b>" +
            dataset.co2 +
            " ppm </b><br> Required: <b>400-900 ppm</b> <br><extra></extra>",
        };

        let layout = {
          //adding images above the markers 
          images: [
            //temp
            {
              source:
                "https://img.icons8.com/?size=100&id=UxvbhlHDl0iU&format=png&color=000000",
              xref: "x",
              yref: "y",
              x: tempTrace.x[0],
              y: tempTrace.y[0],
              sizex: 1,
              sizey: 0.4,
              xanchor: "center",
              yanchor: "middle",
            },
            //humidity
            {
              source:
                "https://img.icons8.com/?size=100&id=nBxxj2r1YGsE&format=png&color=000000",
              xref: "x",
              yref: "y",
              x: humidTrace.x[0],
              y: humidTrace.y[0],
              sizex: 0.9,
              sizey: 0.4,
              xanchor: "center",
              yanchor: "middle",
            },
            //light
            {
              source:
                "https://img.icons8.com/?size=100&id=S20j1f60ruYA&format=png&color=000000",
              xref: "x",
              yref: "y",
              x: lightTrace.x[0],
              y: lightTrace.y[0],
              sizex: 0.9,
              sizey: 0.4,
              xanchor: "center",
              yanchor: "middle",
            },
            //sound
            {
              source:
                "https://img.icons8.com/?size=100&id=KttWmZDF4OIw&format=png&color=000000",
              xref: "x",
              yref: "y",
              x: soundTrace.x[0],
              y: soundTrace.y[0],
              sizex: 0.9,
              sizey: 0.4,
              xanchor: "center",
              yanchor: "middle",
            },
            //co2
            {
              source:
                "https://img.icons8.com/?size=100&id=si1rp6kD04Pt&format=png&color=000000",
              xref: "x",
              yref: "y",
              x: co2Trace.x[0],
              y: co2Trace.y[0],
              sizex: 0.9,
              sizey: 0.4,
              xanchor: "center",
              yanchor: "middle",
            },
          ],
          annotations: [
            {
              //temp annotation
              x: tempTrace.x[0],
              y: tempTrace.y[0],
              text: 'Temperature <br>' + dataset.temp + "°C",
              showarrow: false,
              bgcolor: "#EBF3FA",
              borderpad: 4,
              font: { family: "Arial", color: "#151568", size: 18, weight: "bold"},
              xanchor: "left",
              yanchor: "center",
              xshift: 60,
              align: "left",
            },
            {
              //humid annotation
              x: humidTrace.x[0],
              y: humidTrace.y[0],
              text: 'Humidity <br>' + dataset.humidity +"%",
              showarrow: false,
              bgcolor: "#EBF3FA",
              borderpad: 4,
              font: { family: "Arial", color: "#151568", size: 18, weight: "bold"},
              xanchor: "left",
              yanchor: "center",
              xshift: 60,
              align: "left",
            },
            {
              //light annotation
              x: lightTrace.x[0],
              y: lightTrace.y[0],
              text: 'Light <br>' +dataset.light +" lux",
              showarrow: false,
              bgcolor: "#EBF3FA",
              borderpad: 4,
              font: { family: "Arial", color: "#151568", size: 18, weight: "bold"},
              xanchor: "left",
              yanchor: "center",
              xshift: 60,
              align: "left",
            },
            {
              //sound annotation
              x: soundTrace.x[0],
              y: soundTrace.y[0],
              text: 'Sound <br>' +dataset.sound + " dB",
              showarrow: false,
              bgcolor: "#EBF3FA",
              borderpad: 4,
              font: { family: "Arial", color: "#151568", size: 18, weight: "bold"},
              xanchor: "left",
              yanchor: "center",
              xshift: 60,
              align: "left",
            },
            {
              //co2 annotation
              x: co2Trace.x[0],
              y: co2Trace.y[0],
              text: 'CO2 <br>' +dataset.co2 +" ppm",
              showarrow: false,
              bgcolor: "#EBF3FA",
              borderpad: 4,
              font: { family: "Arial", color: "#151568", size: 18, weight: "bold"},
              xanchor: "left",
              yanchor: "center",
              xshift: 60,
              align: "left",
            },
          ],
          height: 600,
          yaxis: {
            range: [0, 3],
            fixedrange: true, //removing zoom
            visible: false, //removing axes
          },
          xaxis: {
            range: [-0.5, 10.5],
            fixedrange: true,
            visible: false,
          },
          margin: {
            t: 0,
            l: 0,
            r: 150,
            b: 50,
          },
          paper_bgcolor: "#EBF3FA",
          layer: "below",
          hovermode: "closest",
          showlegend: false,
        };

        /* ---- adding a gradient background using heatmap ---- */
        // used code from https://plotly.com/javascript/colorscales/#custom-discretized-heatmap-colorscale
        let colourData = [
          {
            z: Array(4).fill([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
            zmin: 0,
            zmax: 11,
            colorscale: [
              [0, "#D94545bb"],
              [0.1, "#D2524Abb"],
              [0.2, "#C26F56bb"],
              [0.3, "#B6845Fbb"],
              [0.4, "#AC9566bb"],
              [0.5, "#A3A46Cbb"],
              [0.6, "#9CB172bb"],
              [0.7, "#93C27Abb"],
              [0.8, "#8ECB7Ebb"],
              [0.9, "#8AD381bb"],
              [1.0, "#86D984bb"],
            ],
            type: "heatmap",
            showscale: false,
            hoverinfo: "none",
            opactity: 0,
          },
        ];

        //responsive layout --> will auto-resize
        let config = { responsive: true };

        let traces = [tempTrace, humidTrace, lightTrace, soundTrace, co2Trace];

        //drawing the gradient map
        Plotly.newPlot(chartDiv, colourData, layout, config);

        //adding the points onto the graph
        Plotly.addTraces(chartDiv, traces);
      }

      defineTraces(roomData[j], getTime(j));
      roomComfort(room1Data[j], "room1");
      roomComfort(room2Data[j], "room2");
      getTime(j);

      //updating the traces as time goes on
      interval = setInterval(() => {
        j++;
        //restarts if it reaches the end of the array
        if (j >= roomData.length) {
          j = 0;
        }
        roomComfort(room1Data[j], "room1");
        roomComfort(room2Data[j], "room2");
        const updatedTraces = defineTraces(roomData[j], getTime(j));

        //updating the plot with the new traces
        Plotly.update(chartDiv, updatedTraces);
      }, 1000); //change this number to make the code cycle throguh the dataset faster (currently at 5 second interval) --> in a real application, this will be updated every 60 seconds
    }

    // on clicks
    document.getElementById("room1").onclick = function () {
      clearInterval(interval);
      room(room1Data, "Room 1");
      document.getElementById("roomNo").innerHTML = "Room 1";
    };

    document.getElementById("room2").onclick = function () {
      clearInterval(interval);
      room(room2Data, "Room 2");
      document.getElementById("roomNo").innerHTML = "Room 2";
    };

    //setup
    document.getElementById("roomNo").innerHTML = "Room 1";
    room(room1Data, "Room 1");
  }
  
);
