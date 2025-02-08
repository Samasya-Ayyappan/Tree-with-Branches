import React, { useState, useEffect, useRef } from "react";
import { FaPlus } from "react-icons/fa";
import { VscEdit } from "react-icons/vsc";
import { RiDeleteBinLine } from "react-icons/ri";
import ReactFlow from 'reactflow';
import 'reactflow/dist/style.css';
import "./index.css";

function Tree() {
    const [nodes, setNodes] = useState([]);
    const [displayForm, setDisplayForm] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentNode, setCurrentNode] = useState(null);
    const [formData, setFormData] = useState({ title: "", question: "", childrenCount: 0 });
    const titleInputRef = useRef(null);

    useEffect(() => {
        if (displayForm) {
            setTimeout(() => {
                titleInputRef.current?.focus();
            }, 0);
        }
    }, [displayForm]);


    useEffect(() => {
        const savedNodes = localStorage.getItem("treeNodes");
        if (savedNodes) {
            setNodes(JSON.parse(savedNodes));
        }
    }, []);

    // Save nodes to localStorage whenever nodes change
    useEffect(() => {
        if (nodes.length > 0) {
            localStorage.setItem("treeNodes", JSON.stringify(nodes));
        }
    }, [nodes]);

    const toggleForm = (parent = null, node = null) => {
        if (node) {
            // Edit mode
            setEditMode(true);
            setCurrentNode(node.id);
            setFormData({
                title: node.title,
                question: node.question,
                childrenCount: node.childrenCount
            });
        } else {
            // Adding a new node
            if (parent !== null) {
                const parentNode = findNodeById(nodes, parent);
                if (parentNode && parentNode.children.length >= parentNode.childrenCount) {
                    alert("Cannot add more children. Maximum limit reached!");
                    return;
                }
            }
    
            setEditMode(false);
            setCurrentNode(parent);
            setFormData({ title: "", question: "", childrenCount: 0 });
        }
        setDisplayForm(true);
    };
    
    // Helper function to find a node by its ID
    const findNodeById = (nodes, id) => {
        for (const node of nodes) {
            if (node.id === id) return node;
            const found = findNodeById(node.children, id);
            if (found) return found;
        }
        return null;
    };
    
    const handleSubmit = (e) => {
        e.preventDefault();

        if (editMode) {
            const updateNode = (nodes) =>
                nodes.map((node) =>
                    node.id === currentNode
                        ? { ...node, title: formData.title, question: formData.question }
                        : { ...node, children: updateNode(node.children) }
                );
            setNodes((prevNodes) => updateNode(prevNodes));
        } else {
            const newNode = {
                id: Date.now(),
                title: formData.title,
                question: formData.question,
                childrenCount: formData.childrenCount, // Store max children allowed
                children: []
            };            

            if (currentNode === null) {
                setNodes((prevNodes) => [...prevNodes, newNode]);
            } else {
                const addChild = (node) =>
                    node.id === currentNode
                        ? { ...node, children: [...node.children, newNode] }
                        : { ...node, children: node.children.map(addChild) };

                setNodes((prevNodes) => prevNodes.map(addChild));
            }
        }
        setDisplayForm(false);
    };

    const handleDelete = (id) => {
        const deleteNode = (nodes) =>
            nodes.filter((node) => node.id !== id).map((node) => ({ ...node, children: deleteNode(node.children) }));

        setNodes((prevNodes) => deleteNode(prevNodes));
    };

    const renderTree = (nodes) =>
        nodes.map((node) => (
            <div key={node.id} className="node-container p-3 border rounded container">
                <h4>{node.title}</h4>
                <p>{node.question}</p>
                <p>Children Count: {node.children.length}</p>
                <div className="node-actions bg-secondary rounded-pill p-2">
                    <button onClick={() => toggleForm(null, node)} className="m-1 bg-secondary border-0">
                        <VscEdit className="text-light" />
                    </button>
                    <button onClick={() => toggleForm(node.id)} className="m-1 bg-secondary border-0">
                        <a href="#form">
                            <FaPlus className="text-light" />
                        </a>
                    </button>
                    {node.children.length === 0 && (
                        <button onClick={() => handleDelete(node.id)} className="m-1 bg-secondary border-0">
                            <RiDeleteBinLine className="text-light" />
                        </button>
                    )}
                </div>
                <div className="children-container ms-4">{renderTree(node.children)}</div>
            </div>
        ));
    const generateFlowNodes = (nodes) => {
        let flowNodes = [];
        let flowEdges = [];
        let levelSpacing = 150;
        let siblingSpacing = 200;
        let nodePositions = {};
        const traverse = (parentNode, parentX = 500, parentY = 50, level = 0, siblingIndex = 0, siblingCount = 1) => {
            let nodeX = parentX + (siblingIndex * siblingSpacing);
            let nodeY = parentY + levelSpacing;
            if (level in nodePositions) {
                nodeX = nodePositions[level] + siblingSpacing;
            }
            nodePositions[level] = nodeX;
            const node = {
                id: parentNode.id.toString(),
                type: "default",
                data: {
                    label: (
                        <div style={{ textAlign: "center", whiteSpace: "pre-line" }}>
                            <strong>{parentNode.title}</strong>
                            <br />
                            {parentNode.question}
                            <br />
                            <small>{parentNode.children.length} Children</small>
                        </div>
                    ),
                },
                position: { x: nodeX, y: nodeY },
            };
            flowNodes.push(node);
            parentNode.children.forEach((child, index) => {
                traverse(child, nodeX, nodeY, level + 1, index, parentNode.children.length);
                flowEdges.push({
                    id: `${parentNode.id}-${child.id}`,
                    source: parentNode.id.toString(),
                    target: child.id.toString(),
                    animated: true,
                });
            });
        };
        nodes.forEach((rootNode, index) => traverse(rootNode, 500, 0, 0, index, nodes.length));
        return { flowNodes, flowEdges };
    };
    const { flowNodes, flowEdges } = generateFlowNodes(nodes);

    return (
        <center>
            <div className="w-100 container-fluid row">
                <h1 className="display-1">Tree Structure</h1>

                {/* React Flow Chart */}
                {nodes.length === 0 ? (
                    <p className="mt-4">No nodes available. Please add a node to get started.</p>
                ) : (
                    <div style={{ width: "100%", height: "600px" }} className="w-100 p-3 p-md-5">
                        <ReactFlow
                            nodes={flowNodes}
                            edges={flowEdges}
                            fitView
                            className="border w-100"
                        />
                    </div>
                )}

                {nodes.length === 0 && (
                    <center>
                        <div className="bg-secondary rounded-pill p-2 w-25 m-5">
                            <button onClick={() => toggleForm(null)} className="m-2 bg-secondary border-0">
                                <FaPlus className="text-light" />
                            </button>
                        </div>
                    </center>
                )}
                {displayForm && (
                    <form onSubmit={handleSubmit} className="p-3 px-md-4 my-5 text-start col-10 col-lg-8 col-xl-6 border border-5 border-secondary border-top-0 border-bottom-0 container-fluid" id="form">
                        <h5 className="mb-5 ">{editMode ? "Edit Node" : "Add Node"}</h5>
                        <label className="w-100">
                            Title
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="mt-1 w-100 border-0 border-bottom"
                                required
                                ref={titleInputRef}  // <-- Add this line
                            />

                        </label>
                        <label className="w-100 mt-2">
                            Question/Statement
                            <input
                                type="text"
                                name="question"
                                value={formData.question}
                                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                                className="mt-1 w-100 border-bottom border-0"
                                required
                            />
                        </label>
                        <label className="w-100 mt-2">
                            # of Children
                            <input
                                type="number"
                                name="childrenCount"
                                value={formData.childrenCount}
                                onChange={(e) => setFormData({ ...formData, childrenCount: Number(e.target.value) })}
                                className="mt-1 w-100 border-bottom border-0"
                                required
                                min="0"
                                placeholder="# of Children"
                            />
                        </label>

                        <div className="mt-5">
                            <button type="submit" className="btn btn-warning text-light me-2 rounded-pill py-2 px-4">
                                {editMode ? "Update" : "Add"}
                            </button>
                            <button type="button" className="btn btn-secondary rounded-pill py-2 px-4" onClick={() => setDisplayForm(false)}>
                                Cancel
                            </button>
                        </div>
                    </form>
                )}

                <div className="mt-4">{renderTree(nodes)}</div>
            </div>
        </center>
    );
}

export default Tree;


