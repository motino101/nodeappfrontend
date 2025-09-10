import React, { useState, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Node from './components/Node';
import Edge from './components/Edge';
import NavBar from './components/NavBar';
import './App.css';

function App() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [isDraggingConnection, setIsDraggingConnection] = useState(false);
  const [justFinishedConnection, setJustFinishedConnection] = useState(false);
  const [dragConnection, setDragConnection] = useState(null);
  const canvasRef = useRef(null);

  const handleCanvasClick = useCallback((e) => {
    // Don't create nodes if we're dragging a connection or just finished one
    if (isDraggingConnection || justFinishedConnection) {
      return;
    }
    
    if (e.target === canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const newNode = {
        id: uuidv4(),
        x: x - 100, // Center the node on click
        y: y - 50,
        content: '',
        prompt: '',
        type: 'text',
        nodeType: 'source', // Default to source for double-click creation
        isEditing: false,
        isPromptMode: false
      };
      
      setNodes(prev => [...prev, newNode]);
    }
  }, [isDraggingConnection, justFinishedConnection]);

  const handleNodeUpdate = useCallback((nodeId, updates) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, ...updates } : node
    ));
  }, []);

  const handleNodeDelete = useCallback((nodeId) => {
    setNodes(prev => prev.filter(node => node.id !== nodeId));
    setEdges(prev => prev.filter(edge => 
      edge.sourceId !== nodeId && edge.targetId !== nodeId
    ));
  }, []);

  const handleConnectionStart = useCallback((nodeId, position) => {
    setIsDraggingConnection(true);
    setDragConnection({ sourceId: nodeId, position });
  }, []);

  const handleConnectionEnd = useCallback((targetNodeId) => {
    if (dragConnection && targetNodeId && dragConnection.sourceId !== targetNodeId) {
      const targetNode = nodes.find(n => n.id === targetNodeId);
      if (targetNode && (!targetNode.content || targetNode.content.trim() === '')) { // Only connect to empty nodes
        const newEdge = {
          id: uuidv4(),
          sourceId: dragConnection.sourceId,
          targetId: targetNodeId
        };
        setEdges(prev => [...prev, newEdge]);
        
        // Switch target node to prompt mode
        setNodes(prev => prev.map(node => 
          node.id === targetNodeId 
            ? { ...node, isPromptMode: true }
            : node
        ));
      }
    }
    setDragConnection(null);
    setIsDraggingConnection(false);
    setJustFinishedConnection(true);
    
    // Reset the flag after a short delay
    setTimeout(() => {
      setJustFinishedConnection(false);
    }, 100);
  }, [dragConnection, nodes]);

  const handleConnectionCancel = useCallback(() => {
    setDragConnection(null);
    setIsDraggingConnection(false);
    setJustFinishedConnection(true);
    
    // Reset the flag after a short delay
    setTimeout(() => {
      setJustFinishedConnection(false);
    }, 100);
  }, []);

  const addNodeAtCenter = useCallback((nodeType = 'source') => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const centerX = rect.width / 2 - 100; // Center the node
    const centerY = rect.height / 2 - 50;
    
    const newNode = {
      id: uuidv4(),
      x: centerX,
      y: centerY,
      content: '',
      prompt: '',
      type: 'text',
      nodeType: nodeType, // 'source' or 'output'
      isEditing: false,
      isPromptMode: false
    };
    
    setNodes(prev => [...prev, newNode]);
  }, []);

  const handleAddSourceNode = useCallback(() => {
    addNodeAtCenter('source');
  }, [addNodeAtCenter]);

  const handleAddOutputNode = useCallback(() => {
    addNodeAtCenter('output');
  }, [addNodeAtCenter]);

  return (
    <div className="app">
      <NavBar 
        onAddSourceNode={handleAddSourceNode}
        onAddOutputNode={handleAddOutputNode}
      />
      <div className="instructions">
        Double-click anywhere to create a new node • Drag from node borders to connect • Double-click nodes to edit
      </div>
        <div 
        ref={canvasRef}
        className="canvas" 
        onDoubleClick={handleCanvasClick}
        onMouseUp={(e) => {
          if (dragConnection) {
            e.preventDefault();
            e.stopPropagation();
            
            // Find the node under the mouse cursor
            const elements = document.elementsFromPoint(e.clientX, e.clientY);
            const targetNodeElement = elements.find(el => el.closest && el.closest('.node'));
            
            if (targetNodeElement) {
              const targetNode = targetNodeElement.closest('.node');
              const targetNodeId = targetNode.getAttribute('data-node-id');
              if (targetNodeId) {
                handleConnectionEnd(targetNodeId);
                return;
              }
            }
            
            // If no target node found, cancel connection
            handleConnectionCancel();
          }
        }}
      >
        <svg className="edges-layer">
          {edges.map(edge => (
            <Edge 
              key={edge.id} 
              edge={edge} 
              nodes={nodes}
            />
          ))}
          {dragConnection && (
            <Edge 
              edge={dragConnection} 
              nodes={nodes}
              isDragging={true}
            />
          )}
        </svg>
        
        {nodes.map(node => {
          const incomingEdges = edges.filter(edge => edge.targetId === node.id);
          const sourceNodes = incomingEdges.map(edge => 
            nodes.find(n => n.id === edge.sourceId)
          ).filter(Boolean);
          
          return (
            <Node
              key={node.id}
              node={node}
              sourceNodes={sourceNodes}
              onUpdate={handleNodeUpdate}
              onDelete={handleNodeDelete}
              onConnectionStart={handleConnectionStart}
              onConnectionEnd={handleConnectionEnd}
              dragConnection={dragConnection}
            />
          );
        })}
      </div>
    </div>
  );
}

export default App;
