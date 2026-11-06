export interface SkeletonProps {
  /** Default 100%. */
  width?: number | string;
  /** Default 16 px, one line of text. */
  height?: number | string;
}

/** A gray shimmering block that holds the place of content while it loads. Show it at once. */
export function Skeleton({ width = '100%', height = 16 }: SkeletonProps) {
  return <span className="ui-skel" style={{ width, height }} aria-hidden="true" />;
}
