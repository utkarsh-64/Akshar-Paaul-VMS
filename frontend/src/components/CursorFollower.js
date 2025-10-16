import React, { useEffect, useRef } from 'react';

const CursorFollower = () => {
  const cursorDotRef = useRef(null);
  const cursorOutlineRef = useRef(null);
  const trailsRef = useRef([]);
  const mousePos = useRef({ x: 0, y: 0 });
  const cursorPos = useRef({ x: 0, y: 0 });
  const outlinePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Create trail elements
    const trailCount = 15;
    const trails = [];
    
    for (let i = 0; i < trailCount; i++) {
      const trail = document.createElement('div');
      trail.className = 'cursor-trail';
      trail.style.opacity = (1 - i / trailCount) * 0.5;
      document.body.appendChild(trail);
      trails.push({
        element: trail,
        x: 0,
        y: 0
      });
    }
    trailsRef.current = trails;

    // Make cursor visible immediately
    if (cursorDotRef.current) cursorDotRef.current.style.opacity = '1';
    if (cursorOutlineRef.current) cursorOutlineRef.current.style.opacity = '1';

    const handleMouseMove = (e) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      
      // Ensure cursor is visible when moving
      if (cursorDotRef.current) cursorDotRef.current.style.opacity = '1';
      if (cursorOutlineRef.current) cursorOutlineRef.current.style.opacity = '1';
    };

    const handleMouseEnter = () => {
      if (cursorDotRef.current) cursorDotRef.current.style.opacity = '1';
      if (cursorOutlineRef.current) cursorOutlineRef.current.style.opacity = '1';
    };

    const handleMouseLeave = () => {
      if (cursorDotRef.current) cursorDotRef.current.style.opacity = '0';
      if (cursorOutlineRef.current) cursorOutlineRef.current.style.opacity = '0';
    };

    // Smooth animation loop
    const animate = () => {
      // Smooth cursor dot following
      cursorPos.current.x += (mousePos.current.x - cursorPos.current.x) * 0.3;
      cursorPos.current.y += (mousePos.current.y - cursorPos.current.y) * 0.3;

      // Smooth outline following (slower)
      outlinePos.current.x += (mousePos.current.x - outlinePos.current.x) * 0.15;
      outlinePos.current.y += (mousePos.current.y - outlinePos.current.y) * 0.15;

      if (cursorDotRef.current) {
        cursorDotRef.current.style.transform = `translate(${cursorPos.current.x}px, ${cursorPos.current.y}px)`;
      }

      if (cursorOutlineRef.current) {
        cursorOutlineRef.current.style.transform = `translate(${outlinePos.current.x}px, ${outlinePos.current.y}px)`;
      }

      // Update trail positions
      trailsRef.current.forEach((trail, index) => {
        const targetX = index === 0 ? cursorPos.current.x : trailsRef.current[index - 1].x;
        const targetY = index === 0 ? cursorPos.current.y : trailsRef.current[index - 1].y;

        trail.x += (targetX - trail.x) * 0.2;
        trail.y += (targetY - trail.y) * 0.2;

        trail.element.style.transform = `translate(${trail.x}px, ${trail.y}px)`;
      });

      requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('mouseleave', handleMouseLeave);
    
    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseleave', handleMouseLeave);
      
      // Cleanup trails
      trails.forEach(trail => {
        if (trail.element.parentNode) {
          trail.element.parentNode.removeChild(trail.element);
        }
      });
    };
  }, []);

  return (
    <>
      {/* Main cursor dot */}
      <div ref={cursorDotRef} className="custom-cursor-dot"></div>
      
      {/* Cursor outline */}
      <div ref={cursorOutlineRef} className="custom-cursor-outline"></div>
    </>
  );
};

export default CursorFollower;
