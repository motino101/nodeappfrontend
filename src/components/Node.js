import React, { useState, useEffect, useRef } from 'react';
import './Node.css';

const Node = ({ 
  node, 
  sourceNodes = [],
  onUpdate, 
  onDelete, 
  onConnectionStart, 
  onConnectionEnd, 
  dragConnection 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isConnecting, setIsConnecting] = useState(false);
  const nodeRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (node.isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [node.isEditing]);

  const handleMouseDown = (e) => {
    if (e.target.classList.contains('node-border')) {
      // Start connection
      setIsConnecting(true);
      onConnectionStart(node.id, { x: e.clientX, y: e.clientY });
      e.stopPropagation();
      return;
    }

    // Start dragging
    const rect = nodeRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      const canvas = document.querySelector('.canvas');
      const canvasRect = canvas.getBoundingClientRect();
      const newX = e.clientX - canvasRect.left - dragOffset.x;
      const newY = e.clientY - canvasRect.top - dragOffset.y;
      
      onUpdate(node.id, { x: newX, y: newY });
    }
  };

  const handleMouseUp = (e) => {
    setIsDragging(false);
    setIsConnecting(false);
  };

  const handleDoubleClick = () => {
    if (node.isPromptMode) {
      onUpdate(node.id, { isEditing: true });
    } else {
      onUpdate(node.id, { isEditing: true });
    }
  };

  const handleTextChange = (e) => {
    if (node.isPromptMode) {
      onUpdate(node.id, { prompt: e.target.value });
    } else {
      onUpdate(node.id, { content: e.target.value });
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onUpdate(node.id, { content: event.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          onUpdate(node.id, { content: event.target.result });
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const renderImageUpload = () => {
    return (
      <div 
        className={`image-upload ${isDragOver ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          id={`file-${node.id}`}
        />
        <label htmlFor={`file-${node.id}`} className="upload-label">
          {node.content ? (
            <img src={node.content} alt="Node content" className="node-image" />
          ) : (
            <>
              <div className="upload-icon">📁</div>
              <div className="upload-text">
                Drop image here or click to upload
              </div>
            </>
          )}
        </label>
      </div>
    );
  };

  const renderImageDisplay = () => {
    if (node.content) {
      return <img src={node.content} alt="Node content" className="node-image" />;
    }
    return <div className="empty-content">Click to upload image</div>;
  };

  const handleTextBlur = () => {
    onUpdate(node.id, { isEditing: false });
  };

  const handleImageClick = () => {
    if (node.type === 'image') {
      onUpdate(node.id, { isEditing: true });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onUpdate(node.id, { isEditing: false });
    }
    if (e.key === 'Escape') {
      onUpdate(node.id, { isEditing: false });
    }
  };

  const insertSourceReference = (sourceNodeId) => {
    const sourceNode = sourceNodes.find(n => n.id === sourceNodeId);
    if (sourceNode) {
      const currentPrompt = node.prompt || '';
      const reference = `{{${sourceNode.content || 'source'}}}`;
      onUpdate(node.id, { prompt: currentPrompt + reference });
    }
  };

  const handleGenerate = () => {
    // Placeholder for generation logic
    console.log('Generate with prompt:', node.prompt);
    // You can implement actual generation logic here
    onUpdate(node.id, { content: `Generated from: ${node.prompt}`, isPromptMode: false });
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onDelete(node.id);
  };

  const handleTypeChange = (newType) => {
    console.log('Type changing from', node.type, 'to', newType);
    // Clear content when changing types to avoid display issues
    if (newType !== node.type) {
      onUpdate(node.id, { 
        type: newType, 
        content: '', 
        isEditing: newType === 'image' || newType === 'text' || newType === 'link' || newType === 'doc'
      });
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'image': return '🖼️';
      case 'text': return '📝';
      case 'link': return '🔗';
      case 'doc': return '📄';
      default: return '📝';
    }
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  const isEmpty = !node.content || node.content.trim() === '';
  const hasIncomingConnection = dragConnection && 
    dragConnection.sourceId !== node.id && isEmpty;
  const isPromptNode = node.isPromptMode && sourceNodes.length > 0;

  return (
    <div
      ref={nodeRef}
      className={`node ${isEmpty ? 'empty' : 'filled'} ${hasIncomingConnection ? 'connection-target' : ''} has-type-selector ${node.nodeType || 'source'}`}
      style={{
        left: node.x,
        top: node.y,
        transform: isDragging ? 'scale(1.05)' : 'scale(1)'
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      data-node-id={node.id}
    >
      <div className="node-type-header">
        <div className="node-type-indicator">
          <span className={`node-type-badge ${node.nodeType || 'source'}`}>
            {node.nodeType === 'output' ? '🎯 Output' : '📝 Source'}
          </span>
        </div>
        <div className="node-type-selector">
          {['text', 'image', 'link', 'doc'].map(type => (
            <button
              key={type}
              className={`type-btn ${node.type === type ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                handleTypeChange(type);
              }}
              title={type.charAt(0).toUpperCase() + type.slice(1)}
            >
              {getTypeIcon(type)}
            </button>
          ))}
        </div>
      </div>
      
      <div className="node-border top" />
      <div className="node-border right" />
      <div className="node-border bottom" />
      <div className="node-border left" />
      
      <div className="node-content">
        {node.isEditing ? (
          node.type === 'image' ? (
            renderImageUpload()
          ) : (
            <textarea
              ref={textareaRef}
              value={node.isPromptMode ? node.prompt : node.content}
              onChange={handleTextChange}
              onBlur={handleTextBlur}
              onKeyDown={handleKeyDown}
              placeholder={node.isPromptMode ? "Enter prompt..." : "Enter text..."}
              className="node-textarea"
            />
          )
        ) : (
          <div className="node-text">
            {isPromptNode ? (
              <div className="prompt-mode">
                <div className="prompt-field">
                  <label>Prompt:</label>
                  <div className="prompt-display">{node.prompt || 'Click to edit prompt'}</div>
                </div>
                <div className="source-controls">
                  <div className="source-dropdown">
                    <select onChange={(e) => insertSourceReference(e.target.value)} value="">
                      <option value="">Insert source...</option>
                      {sourceNodes.map(sourceNode => (
                        <option key={sourceNode.id} value={sourceNode.id}>
                          {sourceNode.content || `Source ${sourceNode.id.slice(0,8)}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button className="generate-btn" onClick={handleGenerate}>
                    Generate
                  </button>
                </div>
              </div>
            ) : isEmpty ? (
              <div className="empty-placeholder">
                {hasIncomingConnection ? (
                  <div className="connection-prompt">
                    <div className="prompt-text">Ready to connect</div>
                    <button className="generate-btn">Generate</button>
                  </div>
                ) : (
                  'Double-click to edit'
                )}
              </div>
            ) : (
              node.type === 'image' ? (
                renderImageUpload()
              ) : node.type === 'link' ? (
                node.isEditing ? (
                  <input
                    type="url"
                    value={node.content || ''}
                    onChange={handleTextChange}
                    onBlur={handleTextBlur}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter URL..."
                    className="node-input"
                    autoFocus
                  />
                ) : node.content ? (
                  <a href={node.content} target="_blank" rel="noopener noreferrer" className="node-link">
                    {node.content}
                  </a>
                ) : (
                  <div className="empty-content">Click to add link</div>
                )
              ) : node.type === 'doc' ? (
                node.isEditing ? (
                  <textarea
                    ref={textareaRef}
                    value={node.content || ''}
                    onChange={handleTextChange}
                    onBlur={handleTextBlur}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter document content..."
                    className="node-textarea"
                    autoFocus
                  />
                ) : node.content ? (
                  <div className="doc-content">{node.content}</div>
                ) : (
                  <div className="empty-content">Click to add document</div>
                )
              ) : (
                node.isEditing ? (
                  <input
                    type="text"
                    value={node.content || ''}
                    onChange={handleTextChange}
                    onBlur={handleTextBlur}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter text..."
                    className="node-input"
                    autoFocus
                  />
                ) : (
                  node.content || <div className="empty-content">Click to add text</div>
                )
              )
            )}
          </div>
        )}
      </div>
      
      <button 
        className="delete-btn"
        onClick={handleDeleteClick}
        title="Delete node"
      >
        ×
      </button>
    </div>
  );
};

export default Node;
