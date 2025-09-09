import React, { useState, useEffect } from 'react';
import './Edge.css';

const Edge = ({ edge, nodes, isDragging = false }) => {
  const [mousePosition, setMousePosition] = useState(null);
  const [hasMouseMoved, setHasMouseMoved] = useState(false);

  useEffect(() => {
    if (isDragging) {
      setHasMouseMoved(false);
      
      const handleMouseMove = (e) => {
        const canvas = document.querySelector('.canvas');
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          setMousePosition({ 
            x: e.clientX - rect.left, 
            y: e.clientY - rect.top 
          });
          setHasMouseMoved(true);
        }
      };

      document.addEventListener('mousemove', handleMouseMove);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        setHasMouseMoved(false);
        setMousePosition(null);
      };
    }
  }, [isDragging]);

  const getNodeCenter = (nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    // All nodes now have type selector, so use 240px width
    return {
      x: node.x + 120, // Node width / 2 (240px / 2)
      y: node.y + 50   // Node height / 2
    };
  };

  const getConnectionPoint = (sourceNode, targetNode) => {
    // All nodes now have type selector, so use 240px width
    const sourceCenter = { x: sourceNode.x + 120, y: sourceNode.y + 50 };
    const targetCenter = { x: targetNode.x + 120, y: targetNode.y + 50 };
    
    // Calculate direction from source to target
    const dx = targetCenter.x - sourceCenter.x;
    const dy = targetCenter.y - sourceCenter.y;
    
    // Calculate source edge point
    let sourcePoint;
    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal connection
      if (dx > 0) {
        // Connect from right edge of source (240px width, accounting for 2px border)
        sourcePoint = { x: sourceNode.x + 238, y: sourceCenter.y };
      } else {
        // Connect from left edge of source (accounting for border)
        sourcePoint = { x: sourceNode.x + 2, y: sourceCenter.y };
      }
    } else {
      // Vertical connection
      if (dy > 0) {
        // Connect from bottom edge of source (100px height, accounting for 2px border)
        sourcePoint = { x: sourceCenter.x, y: sourceNode.y + 98 };
      } else {
        // Connect from top edge of source (accounting for border)
        sourcePoint = { x: sourceCenter.x, y: sourceNode.y + 2 };
      }
    }
    
    // Calculate target edge point
    let targetPoint;
    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal connection
      if (dx > 0) {
        // Connect to left edge of target (accounting for border)
        targetPoint = { x: targetNode.x + 2, y: targetCenter.y };
      } else {
        // Connect to right edge of target (240px width, accounting for 2px border)
        targetPoint = { x: targetNode.x + 238, y: targetCenter.y };
      }
    } else {
      // Vertical connection
      if (dy > 0) {
        // Connect to top edge of target (accounting for border)
        targetPoint = { x: targetCenter.x, y: targetNode.y + 2 };
      } else {
        // Connect to bottom edge of target (100px height, accounting for 2px border)
        targetPoint = { x: targetCenter.x, y: targetNode.y + 98 };
      }
    }
    
    return { sourcePoint, targetPoint };
  };

  let startPoint, endPoint;

  if (isDragging && hasMouseMoved && mousePosition) {
    const sourceNode = nodes.find(n => n.id === edge.sourceId);
    if (sourceNode) {
      // For dragging, start from the center (240px width for all nodes with type selector)
      const sourceCenter = { x: sourceNode.x + 120, y: sourceNode.y + 50 };
      
      // Use mousePosition directly since it's already in canvas coordinates
      const mousePos = mousePosition;
      
      // Calculate direction from source center to mouse
      const dx = mousePos.x - sourceCenter.x;
      const dy = mousePos.y - sourceCenter.y;
      
      // Determine which edge to start from based on direction
      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal direction
        if (dx > 0) {
          startPoint = { x: sourceNode.x + 238, y: sourceCenter.y }; // Right edge (240px - 2px border)
        } else {
          startPoint = { x: sourceNode.x + 2, y: sourceCenter.y }; // Left edge
        }
      } else {
        // Vertical direction
        if (dy > 0) {
          startPoint = { x: sourceCenter.x, y: sourceNode.y + 98 }; // Bottom edge (100px - 2px border)
        } else {
          startPoint = { x: sourceCenter.x, y: sourceNode.y + 2 }; // Top edge
        }
      }
      
      endPoint = mousePos;
    } else {
      return null; // Don't render if no source node
    }
  } else {
    const sourceNode = nodes.find(n => n.id === edge.sourceId);
    const targetNode = nodes.find(n => n.id === edge.targetId);
    
    if (sourceNode && targetNode) {
      const connectionPoints = getConnectionPoint(sourceNode, targetNode);
      startPoint = connectionPoints.sourcePoint;
      endPoint = connectionPoints.targetPoint;
    } else {
      startPoint = getNodeCenter(edge.sourceId);
      endPoint = getNodeCenter(edge.targetId);
    }
  }

  // Calculate control points for curved path
  const dx = endPoint.x - startPoint.x;
  const dy = endPoint.y - startPoint.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  const controlOffset = Math.min(distance * 0.4, 120);
  
  // Calculate control points based on the direction of the connection
  let controlPoint1, controlPoint2;
  
  if (isDragging) {
    // For dragging, make the curve follow the mouse direction more naturally
    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal direction - curve horizontally
      controlPoint1 = {
        x: startPoint.x + (dx > 0 ? controlOffset : -controlOffset),
        y: startPoint.y
      };
      controlPoint2 = {
        x: endPoint.x + (dx > 0 ? -controlOffset : controlOffset),
        y: endPoint.y
      };
    } else {
      // Vertical direction - curve vertically
      controlPoint1 = {
        x: startPoint.x,
        y: startPoint.y + (dy > 0 ? controlOffset : -controlOffset)
      };
      controlPoint2 = {
        x: endPoint.x,
        y: endPoint.y + (dy > 0 ? -controlOffset : controlOffset)
      };
    }
  } else {
    // For established connections, use horizontal curves
    controlPoint1 = {
      x: startPoint.x + (dx > 0 ? controlOffset : -controlOffset),
      y: startPoint.y
    };
    controlPoint2 = {
      x: endPoint.x + (dx > 0 ? -controlOffset : controlOffset),
      y: endPoint.y
    };
  }

  // Don't render anything if we're dragging but mouse hasn't moved yet
  if (isDragging && !hasMouseMoved) {
    return null;
  }

  const pathData = `M ${startPoint.x} ${startPoint.y} C ${controlPoint1.x} ${controlPoint1.y}, ${controlPoint2.x} ${controlPoint2.y}, ${endPoint.x} ${endPoint.y}`;

  return (
    <g className="edge">
      <path
        d={pathData}
        className={`edge-path ${isDragging ? 'dragging' : ''}`}
        fill="none"
        stroke="#ff6b9d"
        strokeWidth="3"
        strokeDasharray="8 4"
        strokeLinecap="round"
      />
      {!isDragging && (
        <>
          {/* Flow animation dots */}
          <circle className="flow-dot dot-1" r="3" fill="#ff6b9d">
            <animateMotion dur="4s" repeatCount="indefinite">
              <mpath href={`#edge-${edge.id}`} />
            </animateMotion>
          </circle>
          <circle className="flow-dot dot-2" r="2" fill="#f06292">
            <animateMotion dur="4s" repeatCount="indefinite" begin="1s">
              <mpath href={`#edge-${edge.id}`} />
            </animateMotion>
          </circle>
          <circle className="flow-dot dot-3" r="2" fill="#e91e63">
            <animateMotion dur="4s" repeatCount="indefinite" begin="2s">
              <mpath href={`#edge-${edge.id}`} />
            </animateMotion>
          </circle>
        </>
      )}
      <path
        id={`edge-${edge.id}`}
        d={pathData}
        fill="none"
        stroke="transparent"
        strokeWidth="1"
      />
    </g>
  );
};

export default Edge;
