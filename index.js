const app = new Vue({
  mounted: async function () {

    // Initialize SVGs
    this.svgChart1 = this.initSvg("#chart1");
    this.svgChart2 = this.initSvg("#chart2");
    this.svgChart3 = this.initSvg("#chart3");
    this.svgChart4 = this.initSvg("#chart4", "Difference in Means", "Quantity");

    // Load data
    await d3.csv("./dataA.csv").then((data) => {
      data.forEach(d => this.dataA.push(Number(d.value)));
    });
    this.dataADisplay = this.dataA.toString();
    await d3.csv("./dataB.csv").then((data) => {
      data.forEach(d => this.dataB.push(Number(d.value)));
    });
    this.dataBDisplay = this.dataB.toString();

    // Plot histograms
    this.hist(this.svgChart1, [this.dataA, this.dataB], 5, [this.colors.binsA, this.colors.binsB]);
    this.hist(this.svgChart2, [this.dataUniversal], 5, [this.colors.binsUniversal]);

  },
  el: '#app',
  data: {
    margin: {top: 10, right: 30, bottom: 40, left: 50},
    sampleA: [],
    sampleB: [],
    dataA: [],
    dataB: [],
    dataADisplay: [],
    dataBDisplay: [],
    colors: {
      binsA: "#1abc9c",
      binsB: "#f39c12",
      binsUniversal: "#3498db",
      binsSampleA: "#34495e", //"#f39c12",
      binsSampleB: "#9b59b6", //"#16a085",
      binsBelow: "#34495e",
      binsAbove: "#ff0000",
    },
    diffs: [],
    interactive: false,
  },
  watch: {
    dataADisplay: function(newDataA, oldDataA) {
      let data = []
      newDataA.split(',').forEach(d => {
        if (!Number.isNaN(Number(d)))
          data.push(Number(d));
      });
      this.dataA = data;
      this.hist(this.svgChart1, [this.dataA, this.dataB], 5, [this.colors.binsA, this.colors.binsB]);
      this.hist(this.svgChart2, [this.dataUniversal], 5, [this.colors.binsUniversal]);
      this.reset();
    },
    dataBDisplay: function(newDataB, oldDataB) {
      let data = []
      newDataB.split(',').forEach(d => {
        data.push(Number(d));
      });
      this.dataB = data;
      this.hist(this.svgChart1, [this.dataA, this.dataB], 5, [this.colors.binsA, this.colors.binsB]);
      this.hist(this.svgChart2, [this.dataUniversal], 5, [this.colors.binsUniversal]);
      this.reset();
    }
  },
  computed: {
    dataUniversal: function() {
      return this.dataA.concat(this.dataB);
    },
    meanSampleA: function() {
      return d3.mean(this.sampleA, d => d) || 0;
    },
    meanSampleB: function() {
      return d3.mean(this.sampleB, d => d) || 0;
    },
    diffMeanSample: function() {
      return Math.abs(this.meanSampleA - this.meanSampleB);
    },
    meanA: function() {
      return d3.mean(this.dataA, d => d) || 0;
    },
    meanB: function() {
      return d3.mean(this.dataB, d => d) || 0;
    },
    diffMean: function() {
      return Math.abs(this.meanA - this.meanB);
    },
    pValue: function() {
      if (this.diffs.length == 0) return 0
      const pass = this.diffs.filter(diff => diff >= this.diffMean);
      return this.formatDp(100 * pass.length / this.diffs.length);
    },
    width: function() {
      return Math.min(window.innerWidth - 50, 600) - this.margin.left - this.margin.right;
    },
    height: function() {
      return Math.min(this.width * 1.1, 400) - this.margin.top - this.margin.bottom;
    },
    pValueComment: function() {
      if (this.diffs.length == 0) return "";
      if (this.pValue > 5) return "That's not very significant...";
      if (this.pValue <= 5) return "That might be significant!";
    }
  },
  methods: {
    initSvg: function (id, xAxisLabel="Weight of Trout (lbs)", yAxisLabel="Quantity") {
      // Initialize SVG element
      const svg = d3.select(id)
        .append("svg")
          .attr("width", this.width + this.margin.left + this.margin.right)
          .attr("height", this.height + this.margin.top + this.margin.bottom)
        .append("g")
          .attr("transform",
                "translate(" + this.margin.left + "," + this.margin.top + ")");
      
      // Initialize x-axis
      const xAxis = d3.scaleLinear()
        .domain([0, 50])
        .range([0, this.width]);
      svg.append("g")
        .attr("class", "xaxis")
        .attr("transform", "translate(0," + this.height + ")");
      svg.select("g.xaxis")
        .call(d3.axisBottom(xAxis));
      svg.append("text")  
        .attr("class", "xaxis-label")           
        .attr("transform", "translate(" + (this.width / 2) + " ," + (this.height + this.margin.top + 25) + ")")
        .style("text-anchor", "middle")
        .text(xAxisLabel);

      // Initialize y-axis
      const yAxis = d3.scaleLinear()
        .range([this.height, 0])
        .domain([0, 10]);
      svg.append("g")
        .attr("class", "yaxis");
      svg.select("g.yaxis")
          .call(d3.axisLeft(yAxis));
      svg.append("text")
        .attr("class", "yaxis-label")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - this.margin.left)
        .attr("x", 0 - (this.height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text(yAxisLabel);

      return svg;
    },
    reset: function() {
      this.sampleA = [];
      this.sampleB = [];
      this.diffs = [];
      this.hist(this.svgChart3, [], 5, [this.colors.binsSampleA, this.colors.binsSampleB])
      this.hist(this.svgChart4, [], 0.5, [this.colors.binsBelow, this.colors.binsAbove]);
    },
    hist: function (svg, data, binSize, colors) {

      // Initialize x-axis
      const xAxis = d3.scaleLinear()
        .domain([d3.min(data, d => Math.min(...d)) - 2 * binSize, d3.max(data, d => Math.max(...d)) + 2 * binSize])
        .range([0, this.width]);
      svg.select("g.xaxis")
        .call(d3.axisBottom(xAxis));

      // Initialize histogram based on x-axis
      const histogram = d3.histogram()
        .value(d => d)
        .domain(xAxis.domain())
        .thresholds(xAxis.ticks(Math.max(10, d3.max(data, d => Math.max(...d)) / binSize)));

      // Bin data based on histogram
      let allBins = [];
      let maxBinHeight = [];
      data.forEach(lst => {
        let bins = histogram(lst)
        allBins.push(bins);
        maxBinHeight.push(d3.max(bins, d => d.length));
      });

      // Initialize y-axis based on max bin height
      const yAxis = d3.scaleLinear()
        .range([this.height, 0]);
      yAxis.domain([0, Math.max(...maxBinHeight)]);
      svg.select("g.yaxis")
          .call(d3.axisLeft(yAxis));

      // Clear histogram bars
      svg.selectAll(`rect`)
        .data([])
        .exit().remove();

      // Draw histogram bars
      allBins.forEach((bin, i) => {
        svg.selectAll(`rect.bin-${i}`)
          .data(bin)
          .enter()
          .append("rect")
            .attr("class", `bin-${i}`)
            .attr("x", 1)
            .attr("transform", d => "translate(" + (1.5 * xAxis(d.x0) - 0.5 * xAxis(d.x1)) + "," + yAxis(d.length) + ")")
            .attr("width", d => xAxis(d.x1) - xAxis(d.x0) - 1)
            .attr("height", d => this.height - yAxis(d.length))
            .style("fill", colors[i])
            .attr("opacity", 0.5);
      })
    },
    choose: function (choices) {
      let index = Math.floor(Math.random() * choices.length);
      return choices[index];
    },
    fastforward: function() {
      let diffs = [];
      for (let i = 0; i < 1000; i++) {
        sampleA = [];
        sampleB = [];
        for (let i = 0; i < this.dataA.length; i++) {
          sampleA.push(this.choose(this.dataUniversal));
        }
        for (let i = 0; i < this.dataB.length; i++) {
          sampleB.push(this.choose(this.dataUniversal));
        }
        diffs.push(Math.abs(d3.mean(sampleA, d => d) - d3.mean(sampleB, d => d)));
      }
      this.sampleA = sampleA;
      this.sampleB = sampleB;
      this.diffs = this.diffs.concat(diffs);
      this.hist(this.svgChart3, [this.sampleA, this.sampleB], 5, [this.colors.binsSampleA, this.colors.binsSampleB])
      this.hist(this.svgChart4, [this.diffs.filter(d => d < Math.round(this.diffMean * 2) / 2), this.diffs.filter(d => d >= Math.round(this.diffMean * 2) / 2)], 0.5, [this.colors.binsBelow, this.colors.binsAbove]);
      // this.hist(this.svgChart4, [this.diffs.filter(d => d < this.diffMean), this.diffs.filter(d => d >= this.diffMean)], 0.5, ['black', 'red']);
    },
    sample: function () {

      this.sampleA = [];
      this.sampleB = [];
      for (let i = 0; i < this.dataA.length; i++) {
        this.sampleA.push(this.choose(this.dataUniversal));
      }
      for (let i = 0; i < this.dataB.length; i++) {
        this.sampleB.push(this.choose(this.dataUniversal));
      }

      this.hist(this.svgChart3, [this.sampleA, this.sampleB], 5, [this.colors.binsSampleA, this.colors.binsSampleB])
      this.diffs.push(this.diffMeanSample);

      this.hist(this.svgChart4, [this.diffs.filter(d => d < Math.round(this.diffMean * 2) / 2), this.diffs.filter(d => d >= Math.round(this.diffMean * 2) / 2)], 0.5, [this.colors.binsBelow, this.colors.binsAbove]);

    },
    formatDp: function (num, dp=3) {
      return Math.round(num * (10 ** dp)) / (10 ** dp);
    }
  }
})