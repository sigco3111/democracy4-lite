import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Policy, Metric } from '../types';
import PolicyCard from './PolicyCard';
import { ALL_POLICIES } from '../constants';

interface PolicyGraphDisplayProps {
  activePolicies: Policy[];
  onEnactPolicy: (policy: Policy) => void;
  onUpgradePolicy: (policyId: string) => void;
  politicalCapital: number;
  metrics: { [id: string]: Metric };
}

interface ProcessedPolicyNode extends Policy {
  column: number;
  orderInColumn: number;
  displayId: string; // Unique key for react mapping, includes level if applicable
  tempParents: string[]; 
}

interface NodePosition {
  x: number;
  y: number;
  width: number;
  height: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
}


const PolicyGraphDisplay: React.FC<PolicyGraphDisplayProps> = ({
  activePolicies,
  onEnactPolicy,
  onUpgradePolicy,
  politicalCapital,
  metrics,
}) => {
  const [nodePositions, setNodePositions] = useState<Map<string, NodePosition>>(new Map());
  const policyRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const graphContainerRef = useRef<HTMLDivElement | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftStart, setScrollLeftStart] = useState(0);
  const DRAG_SPEED_MULTIPLIER = 1.2; // Adjust for sensitivity

  const processedPolicies = useMemo(() => {
    const policiesWithColumn: ProcessedPolicyNode[] = [];
    ALL_POLICIES.forEach(p_orig => {
        const tempParentSet = new Set<string>();
        if (p_orig.parentId) tempParentSet.add(p_orig.parentId);
        (p_orig.prerequisites?.policies || []).forEach(prereqId => tempParentSet.add(prereqId));
        
        policiesWithColumn.push({
            ...p_orig,
            column: -1, 
            orderInColumn: 0,
            displayId: p_orig.id,
            tempParents: Array.from(tempParentSet),
        });
    });
    
    let currentColumn = 0;
    let assignedCount = 0;
    const maxIterations = ALL_POLICIES.length + 5; 
    let iterations = 0;

    while (assignedCount < ALL_POLICIES.length && iterations < maxIterations) {
        let newAssignmentsThisIteration = 0;
        policiesWithColumn.forEach(pNode => {
            if (pNode.column === -1) { 
                if (pNode.tempParents.length === 0) {
                    pNode.column = currentColumn;
                    assignedCount++;
                    newAssignmentsThisIteration++;
                } else {
                    const parentsAssigned = pNode.tempParents.every(parentId => {
                        const parentNode = policiesWithColumn.find(pn => pn.id === parentId);
                        return parentNode && parentNode.column !== -1 && parentNode.column < currentColumn;
                    });
                    if (parentsAssigned) {
                        pNode.column = currentColumn;
                        assignedCount++;
                        newAssignmentsThisIteration++;
                    }
                }
            }
        });
        if (newAssignmentsThisIteration === 0 && assignedCount < ALL_POLICIES.length) {
            policiesWithColumn.forEach(pNode => {
                if (pNode.column === -1) {
                    const maxParentColumn = pNode.tempParents.reduce((maxCol, parentId) => {
                        const parentNode = policiesWithColumn.find(pn => pn.id === parentId);
                        return Math.max(maxCol, parentNode?.column ?? -1);
                    }, -1);

                    if (maxParentColumn !== -1 && pNode.tempParents.every(parentId => policiesWithColumn.find(pn => pn.id === parentId)?.column !== -1)) {
                         pNode.column = maxParentColumn + 1;
                         assignedCount++;
                         newAssignmentsThisIteration++;
                    }
                }
            });
        }

        if (newAssignmentsThisIteration > 0 || assignedCount === ALL_POLICIES.length) {
           const placedInCurrentOrHigher = policiesWithColumn.some(p => p.column >= currentColumn);
           if(placedInCurrentOrHigher) currentColumn++;
        }
        iterations++;
    }
    
    if (assignedCount < ALL_POLICIES.length) {
        console.warn("Could not assign columns to all policies. Check for circular dependencies or unfulfillable prerequisites.", policiesWithColumn.filter(p => p.column === -1));
        policiesWithColumn.forEach(p => { if (p.column === -1) p.column = currentColumn; });
    }

    const groupedByColumn = policiesWithColumn.reduce((acc, pNode) => {
      const col = acc.get(pNode.column) || [];
      col.push(pNode);
      acc.set(pNode.column, col);
      return acc;
    }, new Map<number, ProcessedPolicyNode[]>());

    groupedByColumn.forEach(colPolicies => {
      colPolicies.sort((a, b) => {
        const aHasParentInPrevCol = a.tempParents.some(pid => (policiesWithColumn.find(p=>p.id===pid)?.column ?? -Infinity) < a.column);
        const bHasParentInPrevCol = b.tempParents.some(pid => (policiesWithColumn.find(p=>p.id===pid)?.column ?? -Infinity) < b.column);
        if (aHasParentInPrevCol && !bHasParentInPrevCol) return -1;
        if (!aHasParentInPrevCol && bHasParentInPrevCol) return 1;
        return ALL_POLICIES.findIndex(ap => ap.id === a.id) - ALL_POLICIES.findIndex(ap => ap.id === b.id);
      });
      colPolicies.forEach((p, index) => { p.orderInColumn = index; });
    });
    
    return Array.from(groupedByColumn.entries())
        .sort((a,b) => a[0] - b[0]) 
        .map(entry => entry[1]) 
        .flat(); 
  }, []);


  useEffect(() => {
    const calculatePositions = () => {
      const newPositions = new Map<string, NodePosition>();
      const container = graphContainerRef.current;
      if (!container) return;
      const containerRect = container.getBoundingClientRect();

      policyRefs.current.forEach((el, id) => {
        if (el) {
          const rect = el.getBoundingClientRect();
          newPositions.set(id, {
            x: rect.left - containerRect.left + container.scrollLeft + rect.width / 2,
            y: rect.top - containerRect.top + container.scrollTop + rect.height / 2,
            width: rect.width, height: rect.height,
            left: rect.left - containerRect.left + container.scrollLeft,
            right: rect.left - containerRect.left + container.scrollLeft + rect.width,
            top: rect.top - containerRect.top + container.scrollTop,
            bottom: rect.top - containerRect.top + container.scrollTop + rect.height,
          });
        }
      });
      if (!mapEquals(nodePositions, newPositions)) {
        setNodePositions(newPositions);
      }
    };

    calculatePositions();
    const observer = new ResizeObserver(calculatePositions);
    if (graphContainerRef.current) observer.observe(graphContainerRef.current);
    window.addEventListener('resize', calculatePositions);
    
    return () => {
      window.removeEventListener('resize', calculatePositions);
      if (graphContainerRef.current) observer.unobserve(graphContainerRef.current);
      observer.disconnect();
    };
  }, [processedPolicies, activePolicies, nodePositions]); 

  function mapEquals(map1: Map<string, NodePosition>, map2: Map<string, NodePosition>): boolean {
    if (map1.size !== map2.size) return false;
    for (const [key, val1] of map1) {
      const val2 = map2.get(key);
      if (!val2) return false;
      for (const prop in val1) {
        if (val1[prop as keyof NodePosition] !== val2[prop as keyof NodePosition]) return false;
      }
    }
    return true;
  }

  const columns = useMemo(() => {
    return processedPolicies.reduce((acc, p) => {
      if (!acc[p.column]) acc[p.column] = [];
      acc[p.column].push(p);
      return acc;
    }, [] as ProcessedPolicyNode[][]);
  }, [processedPolicies]);

  // Drag-to-scroll handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!graphContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - graphContainerRef.current.offsetLeft);
    setScrollLeftStart(graphContainerRef.current.scrollLeft);
    graphContainerRef.current.style.cursor = 'grabbing';
    graphContainerRef.current.style.userSelect = 'none';
  };

  const handleMouseLeaveOrUp = () => {
    if (!graphContainerRef.current || !isDragging) return;
    setIsDragging(false);
    graphContainerRef.current.style.cursor = 'grab';
    graphContainerRef.current.style.userSelect = 'auto';
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !graphContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - graphContainerRef.current.offsetLeft;
    const walk = (x - startX) * DRAG_SPEED_MULTIPLIER;
    graphContainerRef.current.scrollLeft = scrollLeftStart - walk;
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!graphContainerRef.current) return;
    setIsDragging(true);
    // Use the first touch point
    setStartX(e.touches[0].pageX - graphContainerRef.current.offsetLeft);
    setScrollLeftStart(graphContainerRef.current.scrollLeft);
    graphContainerRef.current.style.userSelect = 'none'; 
  };

  const handleTouchEnd = () => {
    if (!graphContainerRef.current || !isDragging) return;
    setIsDragging(false);
    graphContainerRef.current.style.userSelect = 'auto';
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || !graphContainerRef.current) return;
    // e.preventDefault(); // Might interfere with page scroll if not careful. For horizontal only, it's safer.
    const x = e.touches[0].pageX - graphContainerRef.current.offsetLeft;
    const walk = (x - startX) * DRAG_SPEED_MULTIPLIER;
    graphContainerRef.current.scrollLeft = scrollLeftStart - walk;
  };


  return (
    <div className="mb-6">
      <h2 className="text-2xl font-semibold mb-4 text-indigo-300">정책 관리 (테크 트리)</h2>
      <div 
        ref={graphContainerRef} 
        className="graph-container relative flex flex-row items-start overflow-x-auto p-4 bg-gray-850 rounded-lg min-h-[400px] w-full cursor-grab"
        style={{ 
          scrollbarWidth: 'thin', 
          scrollbarColor: '#4A5568 #2D3748',
          WebkitOverflowScrolling: 'touch'
        }}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeaveOrUp}
        onMouseUp={handleMouseLeaveOrUp}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
      >
        {columns.map((colPolicies, colIndex) => (
          <div key={`col-${colIndex}`} className="graph-column flex flex-col items-center flex-shrink-0 mr-16 last:mr-0">
            {colPolicies.map((policy) => {
              const isActive = activePolicies.some(ap => ap.id === policy.id);
              const policyInstance = activePolicies.find(ap => ap.id === policy.id) || policy;
              return (
                <div
                  key={policy.displayId}
                  ref={el => {
                    if (el) policyRefs.current.set(policy.displayId, el);
                    else policyRefs.current.delete(policy.displayId);
                  }}
                  className="policy-node-wrapper mb-12 last:mb-0"
                >
                  <PolicyCard
                    policy={policyInstance}
                    onEnact={onEnactPolicy}
                    onUpgrade={onUpgradePolicy}
                    politicalCapital={politicalCapital}
                    isActive={isActive}
                    metrics={metrics}
                    activePolicies={activePolicies}
                  />
                </div>
              );
            })}
          </div>
        ))}
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ minWidth: columns.length * 250 }}>
          {processedPolicies.map(policy => {
            const targetPos = nodePositions.get(policy.displayId);
            if (!targetPos) return null;

            const lines: JSX.Element[] = [];
            const parentDisplayIds = policy.tempParents; 

            parentDisplayIds.forEach(prereqId => {
              const sourcePos = nodePositions.get(prereqId); 
              if (sourcePos) {
                const sourceX = sourcePos.right - 5; 
                const sourceY = sourcePos.y;
                const targetX = targetPos.left + 5; 
                const targetY = targetPos.y;
                const controlPointOffset = Math.abs(targetX - sourceX) * 0.35;
                lines.push(
                  <path
                    key={`${prereqId}-${policy.displayId}`}
                    d={`M ${sourceX} ${sourceY} C ${sourceX + controlPointOffset} ${sourceY}, ${targetX - controlPointOffset} ${targetY}, ${targetX} ${targetY}`}
                    stroke="rgba(107, 114, 128, 0.7)" 
                    strokeWidth="2.5"
                    fill="none"
                  />
                );
              }
            });
            return lines;
          })}
        </svg>
      </div>
    </div>
  );
};

export default PolicyGraphDisplay;
