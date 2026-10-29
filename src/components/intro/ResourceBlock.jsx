import React from 'react';
import './ResourceBlock.css';

export function ResourceBlock({
  variant = 'emerald', // emerald | gold | cream | glass
  size = 52,
  targetX = 0,
  targetY = 0,
  targetZ = 0,
  rotateX = 25,
  rotateY = -35,
  rotateZ = 0,
  isAssembled = false,
  isEmerging = false,
  emergeOffset = 420,
  delay = 0,
}) {
  // Phase 1 (hidden): far below viewport
  // Phase 2 (emerging): rising upward, small scale, rotating into orientation
  // Phase 3 (assembled): locked in position, full scale, full opacity
  const currentY = isAssembled ? targetY : isEmerging ? targetY + emergeOffset * 0.28 : targetY + emergeOffset;
  const currentOpacity = isAssembled ? 1 : isEmerging ? 0.88 : 0;
  const currentScale = isAssembled ? 1 : isEmerging ? 0.72 : 0.25;
  const currentRotX = isAssembled ? rotateX : isEmerging ? rotateX + 15 : rotateX + 45;
  const currentRotY = isAssembled ? rotateY : isEmerging ? rotateY - 20 : rotateY - 60;

  return (
    <div
      className="resource-cube-scene"
      style={{
        left: `calc(50% + ${targetX}px)`,
        top: `calc(50% + ${currentY}px)`,
        transform: `translate(-50%, -50%) translateZ(${targetZ}px)`,
        opacity: currentOpacity,
        transition: `all 1.25s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
        '--cube-size': `${size}px`,
      }}
    >
      <div
        className={`resource-cube cube-${variant}`}
        style={{
          transform: `scale3d(${currentScale}, ${currentScale}, ${currentScale}) rotateX(${currentRotX}deg) rotateY(${currentRotY}deg) rotateZ(${rotateZ}deg)`,
          transition: `transform 1.25s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
        }}
      >
        <div className="cube-face face-front" />
        <div className="cube-face face-back" />
        <div className="cube-face face-right" />
        <div className="cube-face face-left" />
        <div className="cube-face face-top" />
        <div className="cube-face face-bottom" />
      </div>
    </div>
  );
}

export default ResourceBlock;

