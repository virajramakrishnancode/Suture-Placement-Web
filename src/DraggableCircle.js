
import './DraggableCircle.css';

import React, { useState, useRef } from 'react';
import './DraggableCircle.css'; // Import the CSS file for styling

const DraggableCircle = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 150, y: 150 });
  const circleRef = useRef();

  const handleMouseDown = (event) => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (event) => {
    if (!isDragging) return;

    const { clientX, clientY } = event;
    const circleRect = circleRef.current.getBoundingClientRect();

    const offsetX = clientX - circleRect.left;
    const offsetY = clientY - circleRect.top;

    setPosition({ x: offsetX, y: offsetY });
  };

  return (

    
    <div
      className="draggable-circle"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
    >
      <div
        className="circle"
        ref={circleRef}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`
        }}
      />
    </div>
  );
};

export default DraggableCircle;