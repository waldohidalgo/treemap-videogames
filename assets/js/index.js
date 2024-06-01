import { darkenColor } from "./utils.js";

document.addEventListener("DOMContentLoaded", async () => {
  const data = await d3.json(
    "https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/video-game-sales-data.json"
  );

  // creacion de medidas
  const width = 1200;
  const height = 800;
  const margin = { top: 50, right: 50, bottom: 200, left: 50 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const svg = d3
    .select(".container_graph")
    .html("")
    .append("svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("width", width)
    .attr("height", height)
    .style("background-color", "#f2f2f2");

  // contenedor para el arbol
  const container = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`)
    .attr("width", innerWidth)
    .attr("height", innerHeight);

  // configuracion de escala de colores
  const color = d3.scaleOrdinal(
    data.children.map((d) => d.name),
    d3.schemeTableau10
  );

  // configuración de layout de arbol
  const root = d3
    .treemap()
    .tile(d3.treemapSquarify) //d3.treemapResquarify
    .size([innerWidth, innerHeight])
    .padding(1)
    .round(true);

  // configuracion de jerarquia
  const hierarchy = d3
    .hierarchy(data)
    .sum((d) => d.value)
    .sort((a, b) => b.value - a.value);

  const tree = root(hierarchy);

  // agregar celda a cada hoja de la jerarquia

  const leaf = container
    .selectAll("g")
    .data(tree.leaves())
    .join("g")
    .attr("transform", (d) => `translate(${d.x0},${d.y0})`)
    .attr("class", "leaf");

  // agregar rectangulo de cada hoja

  leaf
    .append("rect")
    .attr("id", (d, i) => (d.leafUid = `rect-${i}`))
    .attr("class", (d, i) => {
      if (d.depth > 1) d = d.parent;
      return "leaf-color-" + d.data.name + " tile";
    })
    .attr("fill", (d) => {
      if (d.depth > 1) d = d.parent;
      return color(d.data.name);
    })
    .attr("fill-opacity", 0.8)
    .attr("width", (d) => d.x1 - d.x0)
    .attr("height", (d) => d.y1 - d.y0)
    .attr("stroke", "white")
    .attr("stroke-width", 0.2)
    .attr("data-name", (d) => d.data.name)
    .attr("data-category", (d) => d.data.category)
    .attr("data-value", (d) => {
      // retornar el area del rectangulo
      return (d.x1 - d.x0) * (d.y1 - d.y0);
    });

  // agregar un clippath para que el rectangulo no se salga del svg

  leaf
    .append("clipPath")
    .attr("id", (d, i) => (d.clipUid = `clip-${i}`))
    .append("use")
    .attr("xlink:href", (d) => `#${d.leafUid}`);

  // creación de un rectangulo para el clippath

  const texto = leaf
    .append("text")
    .attr("id", (d, i) => (d.textUid = `text-${i}`))
    .attr("clip-path", (d) => `url(#${d.clipUid})`);

  // agregar texto a cada hoja

  texto
    .selectAll("tspan")
    .data((d) => d.data.name.split(/(?=[A-Z][^A-Z])/g))
    .enter()
    .append("tspan")
    .attr("x", 3)
    .attr(
      "y",
      (d, i, nodes) => `${(i === nodes.length - 1) * 0.3 + 1.1 + i * 0.9}em`
    )
    .text((d) => d)
    .style("font-size", "10px")
    .style("font-weight", "bold")
    .style("font-family", "arial, sans-serif");

  //agregar clase para el texto con la categoria

  texto.data(tree.leaves()).attr("class", (d) => `text-${d.data.category}`);

  // creación de tooltip

  const tooltip = d3
    .select(".container_graph")
    .append("div")
    .attr("id", "tooltip")
    .style("display", "none");

  // agregar color más oscuro al leaf al hacer mouse over

  leaf
    .on("mouseover", function (event, d) {
      d3.select(`#${d.textUid}`).attr("fill", "white");

      d3.select(`#${d.leafUid}`).attr("fill", function () {
        return darkenColor(this.getAttribute("fill"), 200);
      });
    })
    .on("mousemove", (event, d) => {
      const [x, y] = d3.pointer(event, svg.node());

      tooltip.style("display", "flex").html(
        `
        <div><strong>-Category <span class="square"></span>:</strong> ${d.data.category} </div>
        <div><strong>-Platform:</strong> ${d.data.name}</div>
        <div><strong>-Value:</strong> ${d.data.value}</div>
        `
      );

      const tooltipElement = document.getElementById("tooltip");

      const xPosition = x > 938 ? x - 200 - 20 : x + 20;
      const yPosition = y > 401 ? y - tooltipElement.offsetHeight - 20 : y + 20;

      tooltip.style("left", `${xPosition}px`).style("top", `${yPosition}px`);
      d3.select(".square").style("background-color", color(d.data.category));

      tooltip.attr("data-value", (d.x1 - d.x0) * (d.y1 - d.y0));
    })
    .on("mouseout", function (event, d) {
      tooltip.style("display", "none");
      tooltip.attr("data-value", "");

      d3.select(`#${d.textUid}`).attr("fill", "black");

      d3.select(`#${d.leafUid}`).attr("fill", function () {
        if (d.depth > 1) d = d.parent;
        return color(d.data.name);
      });
    });

  // creación de legend

  const categories = hierarchy.children.map((d) => d.data.name);

  const legend = svg
    .append("g")
    .attr("id", "legend")
    .attr("width", 500)
    .attr("height", 500)
    .attr(
      "transform",
      `translate(${innerWidth / 3}, ${innerHeight + margin.top + 30})`
    );

  // agregar titulo a la legenda

  legend
    .append("text")
    .attr("class", "legend-title")
    .attr("x", 0)
    .attr("y", -10)
    .text("Legend (Max to Min = Left to Right and Top to Bottom)")
    .style("font-weight", "bold");
  // agregar contenedor g de categorias a legenda mostrando 6 categorias por columna

  const legendContainer = legend
    .append("g")
    .attr("class", "legend-container")
    .attr("transform", `translate(0, 10)`);

  const elementosContenedores = legendContainer
    .selectAll("g")
    .data(categories)
    .enter();

  elementosContenedores
    .append("g")
    .attr(
      "transform",
      (d, i) => `translate(${(i % 6) * 80}, ${Math.floor(i / 6) * 40})`
    )
    .append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 20)
    .attr("height", 20)
    .attr("fill", (d) => color(d))
    .attr("class", "legend-color legend-item");

  // agregar etiquetas de categorias

  elementosContenedores
    .append("text")
    .attr("x", (d, i) => (i % 6) * 80 + 25)
    .attr("y", (d, i) => Math.floor(i / 6) * 40 + 15)
    .text((d) => d)
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .style("font-family", "arial, sans-serif");

  // al hacer mouse over sobre cuadrado de legenda, cambiar color de todos los cuadrados de categorias del tree map

  legend
    .selectAll("rect")
    .on("mouseover", function (event, d) {
      d3.selectAll(".leaf-color-" + d).attr("fill", "black");
      d3.selectAll(".text-" + d).attr("fill", "white");
    })
    .on("mouseout", function (event, d) {
      d3.selectAll(".leaf-color-" + d).attr("fill", function () {
        return color(d);
      });
      d3.selectAll(".text-" + d).attr("fill", "black");
    });
});
