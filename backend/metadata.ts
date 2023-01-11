import * as d3 from "d3";
import * as IpfsCore from "ipfs-core";

export enum Colors {
    white, silver, gray, black, red, maroon, yellow, olive,
    lime, green, aqua, teal, blue, navy, fuchsia, purple,
}

export enum Shapes {
    circle, triangle, cross, star,
}

function getShape(svg: any, size: number, shape: Shapes) {
    switch (shape) {
    case Shapes.circle:
        return svg.append("circle")
            .attr("cx", size * 0.5)
            .attr("cy", size * 0.48)
            .attr("r", size * 0.3);
    case Shapes.triangle:
        return svg.append("path")
            .attr("d", d3.symbol(d3.symbolTriangle, size * 35))
            .attr("transform", "translate(" + size * 0.5 + "," + size * 0.54 + ")");
    case Shapes.cross:
        return svg.append("path")
            .attr("d", d3.symbol(d3.symbolCross, size * 35))
            .attr("transform", "translate(" + size * 0.5 + "," + size * 0.48 + ")");
    case Shapes.star:
        return svg.append("path")
            .attr("d", d3.symbol(d3.symbolStar, size * 30))
            .attr("transform", "translate(" + size * 0.5 + "," + size * 0.48 + ")");
    }
}

function generateSvg(
    doc: Document, fgColor: number, bgColor: number, shape: number, timestamp: number) {

    const size = 200;
    const root = d3.select(doc).select("body");

    const svg = root.append("svg")
        .attr("xmlns", "http://www.w3.org/2000/svg")
        .attr("width", size)
        .attr("height", size);

    svg.append("rect")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("fill", Colors[bgColor]);

    const contrast = bgColor == Colors.black ? Colors.white : Colors.black;
    const s = getShape(svg, size, shape)
        .attr("fill", Colors[fgColor]);
    if (bgColor == fgColor) {
        s.attr("stroke", Colors[contrast])
            .attr("stroke-width", 2);
    }

    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("x", size * 0.5)
        .attr("y", size * 0.96)
        .attr("font-family", "Arial")
        .attr("font-size", size * 0.1 + "px")
        .attr("fill", Colors[contrast])
        .text(new Date(timestamp * 1000).toISOString().substring(0, 19));

    return (root.node() as HTMLElement).innerHTML;
}

export function getId(fgColor: number, bgColor: number, shape: number) {
    return (fgColor & 15) + ((bgColor & 15) << 4) + ((shape & 3) << 8) + 1;
}

export function getColorAndShape(id: number) {
    const id0base = id - 1;
    const fgColor = id0base & 15;
    const bgColor = (id0base >> 4) & 15;
    const shape = (id0base >> 8) & 3;
    return [fgColor, bgColor, shape];
}

export function generateMetadata(doc: Document, id: number, timestamp: number) {
    const [fgColor, bgColor, shape] = getColorAndShape(id);
    const svg = generateSvg(doc, fgColor, bgColor, shape, timestamp);

    const obj = {
        name: `My Shape (${id} / 1024)`,
        description: `A ${Colors[fgColor]} ${Shapes[shape]} on ${Colors[bgColor]} background.`,
        image_data: svg,
        attributes: [
            {
                trait_type: "Shape",
                value: Shapes[shape],
            },
            {
                trait_type: "Issued timestamp",
                display_type: "date",
                value: timestamp
            }
        ],
    };
    return JSON.stringify(obj, null, "  ");
}

export async function getCid(ipfs: IpfsCore.IPFS, content: string) {
    const { cid } = await ipfs!.add(content);
    return cid.toString();
}
