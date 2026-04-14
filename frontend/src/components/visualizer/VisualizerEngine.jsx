import ArrayRenderer      from './renderers/ArrayRenderer';
import GraphRenderer      from './renderers/GraphRenderer';
import TreeRenderer       from './renderers/TreeRenderer';
import GridRenderer       from './renderers/GridRenderer';
import LinkedListRenderer from './renderers/LinkedListRenderer';
import StackRenderer      from './renderers/StackRenderer';

/**
 * Routes a single frame to the correct renderer based on frame.type.
 * frame.type: 'array' | 'graph' | 'tree' | 'grid' | 'linkedlist' | 'stack'
 */
export default function VisualizerEngine({ frame, rowLabels, colLabels }) {
  if (!frame) return null;

  switch (frame.type) {
    case 'array':      return <ArrayRenderer      frame={frame} />;
    case 'graph':      return <GraphRenderer      frame={frame} />;
    case 'tree':       return <TreeRenderer       frame={frame} />;
    case 'grid':       return <GridRenderer       frame={frame} rowLabels={rowLabels} colLabels={colLabels} />;
    case 'linkedlist': return <LinkedListRenderer frame={frame} />;
    case 'stack':      return <StackRenderer      frame={frame} />;
    default:           return null;
  }
}
