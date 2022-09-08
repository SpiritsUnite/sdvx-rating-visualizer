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
        let movementX = 0;
        let movementY = 0;
        const onMouseMove = (event) => {
            movementX += event.movementX;
            movementY += event.movementY;
            if (!ticking) {
                ticking = true;
                window.requestAnimationFrame(() => {
                    visualizer.scrollBy(-movementX, -movementY);
                    ticking = false;
                    movementX = 0;
                    movementY = 0;
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
    const indicator = document.createElement("div");
    indicator.classList.add("indicator");
    indicator.hidden = true;
    const indicatorDot = document.createElement("div");
    indicatorDot.classList.add("indicator-dot");
    indicator.appendChild(indicatorDot);
    const indicatorText = document.createElement("div");
    indicatorText.classList.add("indicator-text");
    indicator.appendChild(indicatorText);
    boxes.parentElement.appendChild(indicator);
    const rowIndicator = document.createElement("div");
    rowIndicator.classList.add("indicator");
    rowIndicator.hidden = true;
    const rowIndicatorScore = document.createElement("div");
    rowIndicatorScore.classList.add("block-score-text");
    rowIndicatorScore.style.position = "absolute";
    rowIndicatorScore.style.bottom = "0px";
    //rowIndicator.appendChild(rowIndicatorScore);
    //rows.appendChild(rowIndicator);
    let tooltipRight = true;
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
                block.style.top = `${Math.round((maxVf - bound[1] * 50) / maxVf * boxes.clientHeight)}px`;
                block.style.height = `${Math.round((bound[1] - bound[0]) * 50 / maxVf * boxes.clientHeight)}px`;
                let blockScore = document.createElement("div");
                blockScore.classList.add("block-score");
                blockScore.hidden = true;
                let blockScoreText = document.createElement("span");
                blockScoreText.classList.add("block-score-text");
                blockScore.appendChild(blockScoreText);
                block.appendChild(blockScore);
                block.addEventListener("mousemove", event => {
                    if (event.offsetY < 0 || event.offsetY > block.clientHeight ||
                        event.offsetX < 0 || event.offsetX > block.clientWidth) {
                        // Sometimes Chrome gives offsetY = -1
                        indicator.hidden = true;
                        return;
                    }
                    const gradeBound = GRADE_SCORE[g];
                    let score = gradeBound[1] -
                        (gradeBound[1] - gradeBound[0]) * (event.offsetY + 1) / block.clientHeight;
                    let vf = lv * score * GRADE_MULT[g] * MEDAL_MULT[m] * 2;
                    score = score * 100000;
                    vf = vf * 50 / 10000;
                    const indicatorBound = indicator.parentElement.getBoundingClientRect();
                    indicator.style.top = `${event.clientY - Math.round(indicatorBound.top)}px`;
                    indicatorDot.style.left = `${event.clientX - Math.round(indicatorBound.left)}px`;
                    indicatorText.textContent = `${(score / 1000).toFixed(0)}k ${vf.toFixed(2)}`;
                    if (event.clientX > visualizer.getBoundingClientRect().left + visualizer.clientWidth - indicatorText.clientWidth - 4) {
                        tooltipRight = false;
                    }
                    if (event.clientX < visualizer.getBoundingClientRect().left + rows.clientWidth + indicatorText.clientWidth + 4) {
                        tooltipRight = true;
                    }
                    if (tooltipRight) {
                        indicatorText.style.left = `${event.clientX - Math.round(indicatorBound.left) + 2}px`;
                        indicatorText.style.right = "";
                    }
                    else {
                        indicatorText.style.left = "";
                        indicatorText.style.right = `${Math.round(indicatorBound.right) - event.clientX + 2}px`;
                    }
                    indicator.hidden = false;
                });
                block.addEventListener("click", event => {
                    for (let e of document.querySelectorAll(".fixed")) {
                        e.remove();
                    }
                    const spacer = document.createElement("div");
                    spacer.classList.add("puc-spacer");
                    spacer.style.width = "1.5em";
                    spacer.style.left = "-0.75em";
                    const indicatorFixed = indicator.cloneNode(true);
                    indicatorFixed.classList.add("fixed");
                    indicatorFixed.querySelector(".indicator-dot").appendChild(spacer);
                    indicator.parentElement.appendChild(indicatorFixed);
                    indicatorFixed.addEventListener("click", () => {
                        indicatorFixed.remove();
                    });
                });
                block.addEventListener("mouseout", event => {
                    indicator.hidden = true;
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
            let pucSpacer = document.createElement("div");
            pucSpacer.classList.add("puc-spacer");
            block.appendChild(pucSpacer);
            let blockScore = document.createElement("div");
            blockScore.classList.add("block-score");
            blockScore.hidden = true;
            let blockScoreText = document.createElement("span");
            blockScoreText.classList.add("block-score-text");
            blockScore.appendChild(blockScoreText);
            block.appendChild(blockScore);
            block.addEventListener("mousemove", event => {
                let vf = bound[1] * 50;
                indicator.style.top = `${block.offsetTop + boxes.offsetTop}px`;
                const indicatorBound = indicator.parentElement.getBoundingClientRect();
                indicatorDot.style.left = `${event.clientX - Math.round(indicatorBound.left)}px`;
                indicatorText.textContent = `${vf.toFixed(2)}`;
                if (event.clientX > visualizer.getBoundingClientRect().left + visualizer.clientWidth - indicatorText.clientWidth - 4) {
                    tooltipRight = false;
                }
                if (event.clientX < visualizer.getBoundingClientRect().left + rows.clientWidth + indicatorText.clientWidth + 4) {
                    tooltipRight = true;
                }
                if (tooltipRight) {
                    indicatorText.style.left = `${event.clientX - Math.round(indicatorBound.left) + 2}px`;
                    indicatorText.style.right = "";
                }
                else {
                    indicatorText.style.left = "";
                    indicatorText.style.right = `${Math.round(indicatorBound.right) - event.clientX + 2}px`;
                }
                indicator.hidden = false;
            });
            block.addEventListener("click", event => {
                for (let e of document.querySelectorAll(".fixed")) {
                    e.remove();
                }
                const spacer = document.createElement("div");
                spacer.classList.add("puc-spacer");
                spacer.style.width = "1.5em";
                spacer.style.left = "-0.75em";
                const indicatorFixed = indicator.cloneNode(true);
                indicatorFixed.classList.add("fixed");
                indicatorFixed.querySelector(".indicator-dot").appendChild(spacer);
                indicator.parentElement.appendChild(indicatorFixed);
                indicatorFixed.addEventListener("click", () => {
                    indicatorFixed.remove();
                });
                indicator.hidden = true;
            });
            block.addEventListener("mouseout", event => {
                indicator.hidden = true;
            });
            boxCol.appendChild(block);
        }
        boxes.addEventListener("dblclick", () => {
            for (let e of document.querySelectorAll(".fixed")) {
                e.remove();
            }
        });
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