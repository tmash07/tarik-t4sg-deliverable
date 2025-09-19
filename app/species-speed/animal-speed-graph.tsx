/* eslint-disable */
"use client";
import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";

export type AnimalDatum = {
  name: string;
  speed: number;
  diet: "herbivore" | "omnivore" | "carnivore";
};

export default function AnimalSpeedGraph() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [data, setData] = useState<AnimalDatum[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const rows = (await d3.csv("/sample_animals.csv")) as unknown as Array<Record<string, string>>;
      const parsed: AnimalDatum[] = rows
        .map((r) => ({
          name: String(r["Animal"]).trim(),
          speed: Number.parseFloat(String(r["Average Speed (km/h)"])),
          diet: String(r["Diet"]).trim().toLowerCase() as AnimalDatum["diet"],
        }))
        .filter((d) => d.name && Number.isFinite(d.speed));
      setData(parsed);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || data.length === 0) return;
    el.innerHTML = "";

    const width = 960;
    const height = 500;
    const margin = { top: 20, right: 120, bottom: 100, left: 60 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const svg = d3.select(el).append("svg").attr("width", width).attr("height", height);
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleBand<string>()
      .domain(data.map((d: AnimalDatum) => d.name))
      .range([0, innerW])
      .padding(0.1);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d: AnimalDatum) => d.speed)!])
      .nice()
      .range([innerH, 0]);

    const color = d3
      .scaleOrdinal<AnimalDatum["diet"], string>()
      .domain(["herbivore", "omnivore", "carnivore"])
      .range(["#66c2a5", "#fc8d62", "#8da0cb"]);

    g.selectAll<SVGRectElement, AnimalDatum>("rect")
      .data(data)
      .enter()
      .append("rect")
      .attr("x", (d: AnimalDatum) => x(d.name)!)
      .attr("y", (d: AnimalDatum) => y(d.speed))
      .attr("width", x.bandwidth())
      .attr("height", (d: AnimalDatum) => innerH - y(d.speed))
      .attr("fill", (d: AnimalDatum) => color(d.diet));

    g.append("g")
      .attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(x))
      .selectAll<SVGTextElement, string>("text")
      .attr("transform", "rotate(-40)")
      .style("text-anchor", "end");

    g.append("g").call(d3.axisLeft(y));

    const legend = svg.append("g").attr("transform", `translate(${width - margin.right + 20}, ${margin.top})`);

    type LegendItem = { label: AnimalDatum["diet"]; color: string };
    const items: LegendItem[] = [
      { label: "herbivore", color: color("herbivore")! },
      { label: "omnivore", color: color("omnivore")! },
      { label: "carnivore", color: color("carnivore")! },
    ];

    const li = legend
      .selectAll<SVGGElement, LegendItem>("g")
      .data(items)
      .enter()
      .append("g")
      .attr("transform", (_: unknown, i: number) => `translate(0, ${i * 20})`);

    li.append("rect")
      .attr("width", 14)
      .attr("height", 14)
      .attr("fill", (d: LegendItem) => d.color);
    li.append("text")
      .attr("x", 20)
      .attr("y", 12)
      .text((d: LegendItem) => d.label);
  }, [data]);

  return <div ref={ref} />;
}
