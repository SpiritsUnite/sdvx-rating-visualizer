const MEDALS = ["COMP", "EX", "UC", "PUC"];
const GRADES = ["D", "C", "B", "A", "A+", "AA", "AA+", "AAA", "AAA+", "S"];
const MEDAL_MULT = {
    COMP: 1,
    EX: 1.02,
    UC: 1.05,
    PUC: 1.10,
};
const GRADE_SCORE = {
    D: [0, 65],
    C: [65, 75],
    B: [75, 87],
    A: [87, 90],
    "A+": [90, 93],
    AA: [93, 95],
    "AA+": [95, 97],
    AAA: [97, 98],
    "AAA+": [98, 99],
    S: [99, 100],
};
const GRADE_MULT = {
    D: 0.8,
    C: 0.82,
    B: 0.85,
    A: 0.88,
    "A+": 0.91,
    AA: 0.94,
    "AA+": 0.97,
    AAA: 1.00,
    "AAA+": 1.02,
    S: 1.05,
};
let bounds = [];
const MIN_LVL = 10;
const MAX_LVL = 20;
const VF_INTERVAL = 0.25;
const visualizer = document.querySelector(".visualizer");
function draw_cols(minLvl, maxLvl) {
    const headers = visualizer.querySelector(".headers");
    headers.innerHTML = "";
    for (let lv = minLvl; lv <= maxLvl; lv++) {
        const col = document.createElement("div");
        col.classList.add("header");
        col.innerText = lv.toString();
        headers.appendChild(col);
    }
    return headers;
}
function draw_rows(maxVf) {
    const rows = visualizer.querySelector(".rows");
    rows.innerHTML = "";
    for (let r = maxVf - VF_INTERVAL; r >= 0; r -= VF_INTERVAL) {
        const row = document.createElement("div");
        row.classList.add("row");
        const label = document.createElement("div");
        label.classList.add("label");
        label.innerText = r.toFixed(2);
        row.appendChild(label);
        rows.appendChild(row);
    }
    return rows;
}
let boxes_events = false;
function init_boxes() {
    const boxes = visualizer.querySelector(".boxes");
    const boxScrollTop = parseInt(localStorage.getItem("boxScrollTop"));
    const boxScrollLeft = parseInt(localStorage.getItem("boxScrollLeft"));
    visualizer.scrollTo(isNaN(boxScrollLeft) ? visualizer.scrollWidth : boxScrollLeft, isNaN(boxScrollTop) ? 0 : boxScrollTop);
    if (boxes_events)
        return boxes;
    boxes_events = true;
    {
        let ticking = false;
        visualizer.addEventListener("scroll", () => {
            if (!ticking) {
                ticking = true;
                window.requestAnimationFrame(() => {
                    localStorage.setItem("boxScrollTop", `${visualizer.scrollTop}`);
                    localStorage.setItem("boxScrollLeft", `${visualizer.scrollLeft}`);
                    ticking = false;
                });
            }
        });
    }
    {
        let ticking = false;
        const onMouseMove = (event) => {
            if (!ticking) {
                ticking = true;
                window.requestAnimationFrame(() => {
                    visualizer.scrollBy(-event.movementX, -event.movementY);
                    ticking = false;
                });
            }
        };
        const onMouseUp = () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
            document.body.style.removeProperty("cursor");
            boxes.style.cursor = "grab";
            boxes.style.removeProperty("user-select");
        };
        boxes.addEventListener("mousedown", event => {
            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
            document.body.style.cursor = "grabbing";
            boxes.style.cursor = "grabbing";
            boxes.style.userSelect = "none";
        });
        boxes.addEventListener("contextmenu", e => {
            e.preventDefault();
        });
    }
    return boxes;
}
function draw_visualizer(minLvl, maxLvl) {
    for (let lv = minLvl; lv <= maxLvl; lv++) {
        if (bounds[lv])
            continue;
        bounds[lv] = MEDALS.reduce((bs, m) => {
            bs[m] = GRADES.reduce((o, g) => {
                let mult = lv * GRADE_MULT[g] * MEDAL_MULT[m] * 2;
                o[g] = [mult * GRADE_SCORE[g][0], mult * GRADE_SCORE[g][1]];
                o[g][0] = Math.trunc(o[g][0] * 10 + Number.EPSILON) / 100000;
                o[g][1] = Math.trunc(o[g][1] * 10 + Number.EPSILON) / 100000;
                return o;
            }, {});
            return bs;
        }, {});
    }
    const maxVf = Math.ceil(bounds[maxLvl]["PUC"]["S"][1] * 50 / VF_INTERVAL) * VF_INTERVAL;
    const cols = draw_cols(minLvl, maxLvl);
    const rows = draw_rows(maxVf);
    const boxes = init_boxes();
    boxes.innerHTML = "";
    for (let lv = minLvl; lv <= maxLvl; lv++) {
        const boxCol = document.createElement("div");
        boxCol.classList.add("box-col-parent");
        for (let mi = 0; mi < MEDALS.length; mi++) {
            const m = MEDALS[mi];
            if (m === "PUC")
                continue;
            const boxCol2 = document.createElement("div");
            boxCol2.classList.add("box-col");
            boxCol2.classList.add(m);
            for (let g of GRADES) {
                let block = document.createElement("div");
                block.classList.add("block");
                let bound = bounds[lv][m][g];
                block.innerText = g;
                block.style.top = `${(maxVf - bound[1] * 50) * 100 / maxVf}%`;
                block.style.height = `${(bound[1] - bound[0]) * 5000 / maxVf}%`;
                block.addEventListener("mousemove", event => {
                    const gradeBound = GRADE_SCORE[g];
                    let score = gradeBound[1] -
                        (gradeBound[1] - gradeBound[0]) * event.offsetY / block.clientHeight;
                    let vf = lv * score * GRADE_MULT[g] * MEDAL_MULT[m] * 2;
                    score = score * 100000;
                    vf = vf * 50 / 10000;
                    console.log(score.toFixed(0), vf.toFixed(2));
                    block.title = `${score.toFixed(0)} ${vf.toFixed(2)}`;
                });
                boxCol2.appendChild(block);
            }
            boxCol.appendChild(boxCol2);
        }
        {
            let block = document.createElement("div");
            block.classList.add("block");
            block.classList.add("PUC");
            let bound = bounds[lv]["PUC"]["S"];
            block.style.top = `${(maxVf - bound[1] * 50) * 100 / maxVf}%`;
            block.innerText = "PUC";
            block.addEventListener("mousemove", event => {
                let vf = bound[1] * 50;
                block.title = `${vf.toFixed(2)}`;
            });
            boxCol.appendChild(block);
        }
        boxes.appendChild(boxCol);
    }
}
draw_visualizer(MIN_LVL, MAX_LVL);
{
    let last = "";
    document.addEventListener("keypress", event => {
        if (!/^\w$/.test(event.key))
            return;
        last += event.key.toLowerCase();
        last = last.slice(-"joyeuse".length);
        if (last === "joyeuse") {
            localStorage.removeItem("boxScrollTop");
            localStorage.removeItem("boxScrollLeft");
            draw_visualizer(MIN_LVL, 21);
        }
    });
}
//# sourceMappingURL=index.js.map