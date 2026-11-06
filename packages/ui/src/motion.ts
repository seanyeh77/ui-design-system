import * as React from 'react';

/** Droplet motion of tab and sidebar indicators: lead duration in ms and how much longer the trailing edge takes. */
export const MOTION = { dur: 200, stretch: 2.2 } as const;

/** Transition for an indicator whose leading edge moves first and trailing edge catches up (the droplet stretch). */
export function dropTransition(axisA: string, axisB: string, forward: boolean): string {
  const lead = (MOTION.dur * 0.6) + 'ms cubic-bezier(.2,.8,.2,1)';
  const follow = (MOTION.dur * MOTION.stretch) + 'ms cubic-bezier(.65,0,.25,1.15)';
  return axisA + ' ' + (forward ? follow : lead) + ', ' + axisB + ' ' + (forward ? lead : follow) + ', transform 150ms ease';
}

/** [moving, start]: true from start() until the droplet has settled. */
export function useMoving(): [boolean, () => void] {
  const [moving, set] = React.useState(false);
  const t = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  const start = React.useCallback(() => {
    set(true);
    clearTimeout(t.current);
    t.current = setTimeout(() => set(false), MOTION.dur * MOTION.stretch + 60);
  }, []);
  React.useEffect(() => () => clearTimeout(t.current), []);
  return [moving, start];
}

