let nodes = [];
let edges = [];
const svg = document.getElementById("graph");
let isDragging = false;
let currentNode = null;
let currentText = null;
let bfsInterval = null;

function generateGraph() {
    clearBFS();
    const nodeCount = parseInt(document.getElementById("nodeCount").value);
    if (isNaN(nodeCount) || nodeCount < 1) {
        alert("Please enter a valid number of nodes.");
        return;
    }

    nodes = [];
    edges = [];
    svg.innerHTML = '';
    document.getElementById('edgeList').textContent = "No edges yet.";
    document.getElementById('queueList').textContent = "Empty";
    document.getElementById('finalTraversal').value = "";
    document.getElementById('explanationText').value = "";
    document.getElementById('adjacencyList').textContent = "Generating adjacency list...";

    const radius = 250;
    const centerX = 400;
    const centerY = 300;

    for (let i = 0; i < nodeCount; i++) {
        const angle = (i / nodeCount) * 2 * Math.PI;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        nodes.push({ id: i + 1, x, y });
        drawNode(i + 1, x, y);
    }
    
    updateAdjacencyList();
}

function drawNode(id, x, y) {
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", x);
    circle.setAttribute("cy", y);
    circle.setAttribute("r", 15);
    circle.setAttribute("fill", "#69b3a2");
    circle.setAttribute("data-id", id);
    svg.appendChild(circle);

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", x);
    text.setAttribute("y", y + 5);
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("data-id", id);
    text.textContent = id;
    svg.appendChild(text);

    circle.addEventListener("mousedown", startDrag);
    text.addEventListener("mousedown", startDrag);
}

function startDrag(e) {
    isDragging = true;
    currentNode = e.target.closest("circle") || e.target;
    const nodeId = currentNode.getAttribute("data-id");
    currentText = svg.querySelector(`text[data-id="${nodeId}"]`);
    
    const svgRect = svg.getBoundingClientRect();
    const scale = svgRect.width / svg.viewBox.baseVal.width;
    
    function dragHandler(e) {
        if (!isDragging) return;
        
        const rect = svg.getBoundingClientRect();
        const x = (e.clientX - rect.left) / scale;
        const y = (e.clientY - rect.top) / scale;

        currentNode.setAttribute("cx", x);
        currentNode.setAttribute("cy", y);
        currentText.setAttribute("x", x);
        currentText.setAttribute("y", y + 5);

        const nodeIndex = nodes.findIndex(n => n.id === parseInt(nodeId));
        if (nodeIndex !== -1) {
            nodes[nodeIndex].x = x;
            nodes[nodeIndex].y = y;
        }

        drawEdges();
    }

    function endDrag() {
        isDragging = false;
        document.removeEventListener("mousemove", dragHandler);
        document.removeEventListener("mouseup", endDrag);
    }

    document.addEventListener("mousemove", dragHandler);
    document.addEventListener("mouseup", endDrag);
}

function addEdge() {
    const source = parseInt(document.getElementById("sourceNode").value);
    const target = parseInt(document.getElementById("targetNode").value);

    if (isNaN(source) || isNaN(target) || source === target) {
        alert("Please enter valid source and target nodes.");
        return;
    }

    const sourceNode = nodes.find(node => node.id === source);
    const targetNode = nodes.find(node => node.id === target);

    if (!sourceNode || !targetNode) {
        alert("One or both nodes do not exist.");
        return;
    }

    const edgeExists = edges.some(edge => 
        edge.source.id === source && edge.target.id === target
    );

    if (!edgeExists) {
        edges.push({ source: sourceNode, target: targetNode });
        drawEdges();
        updateEdgeList();
        updateAdjacencyList();
    }
}

function drawEdges() {
    svg.querySelectorAll("line").forEach(line => line.remove());

    edges.forEach(edge => {
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", edge.source.x);
        line.setAttribute("y1", edge.source.y);
        line.setAttribute("x2", edge.target.x);
        line.setAttribute("y2", edge.target.y);
        line.setAttribute("stroke", "black");
        line.setAttribute("stroke-width", "2");
        svg.insertBefore(line, svg.firstChild);
    });
}

function updateEdgeList() {
    const edgeList = edges.map(edge => `${edge.source.id} → ${edge.target.id}`).join(", ");
    document.getElementById("edgeList").textContent = edgeList || "No edges yet.";
}

function updateAdjacencyList() {
    if (nodes.length === 0) {
        document.getElementById('adjacencyList').textContent = "No nodes yet.";
        return;
    }

    const adjList = {};
    nodes.forEach(node => {
        adjList[node.id] = [];
    });

    edges.forEach(edge => {
        adjList[edge.source.id].push(edge.target.id);
    });

    let display = "";
    for (let nodeId in adjList) {
        const neighbors = adjList[nodeId].length > 0 ? 
            adjList[nodeId].sort((a, b) => a - b).join(", ") : 
            "[]";
        display += `Node ${nodeId} → ${neighbors}\n`;
    }

    document.getElementById('adjacencyList').textContent = display || "Empty graph";
}

function clearBFS() {
    if (bfsInterval) {
        clearInterval(bfsInterval);
        bfsInterval = null;
    }
    svg.querySelectorAll("circle").forEach(circle => {
        circle.setAttribute("fill", "#69b3a2");
    });
    document.getElementById('queueList').textContent = "Empty";
    document.getElementById('finalTraversal').value = "";
    document.getElementById('explanationText').value = "";
}

function runBFS() {
    clearBFS();
    const startNodeId = parseInt(document.getElementById("startNode").value);
    if (isNaN(startNodeId) || !nodes.find(n => n.id === startNodeId)) {
        alert("Please enter a valid start node.");
        return;
    }

    const visited = new Set();
    const queue = [startNodeId];
    const finalTraversal = [];
    let explanation = "";
    let step = 0;

    function getAdjacent(nodeId) {
        return edges
            .filter(edge => edge.source.id === nodeId)
            .map(edge => edge.target.id);
    }

    bfsInterval = setInterval(() => {
        if (queue.length === 0) {
            clearInterval(bfsInterval);
            document.getElementById('finalTraversal').value = finalTraversal.join(" → ");
            return;
        }

        const currentId = queue[0];
        if (!visited.has(currentId)) {
            visited.add(currentId);
            finalTraversal.push(currentId);

            const adjacent = getAdjacent(currentId);
            for (const neighbor of adjacent) {
                if (!visited.has(neighbor) && !queue.includes(neighbor)) {
                    queue.push(neighbor);
                }
            }

            svg.querySelectorAll("circle").forEach(circle => {
                const id = parseInt(circle.getAttribute("data-id"));
                if (id === currentId) {
                    circle.setAttribute("fill", "#4CAF50");
                } else if (queue.includes(id)) {
                    circle.setAttribute("fill", "#FFC107");
                }
            });

            step++;
            explanation += `Step ${step}: Visiting node ${currentId}. `;
            if (adjacent.length > 0) {
                explanation += `Adding unvisited neighbors ${adjacent.filter(n => !visited.has(n))} to queue.\n`;
            } else {
                explanation += "No unvisited neighbors.\n";
            }
            document.getElementById('explanationText').value = explanation;
        }

        queue.shift();
        document.getElementById('queueList').textContent = queue.length > 0 ? 
            queue.join(" → ") : "Empty";

    }, 1000);
}
