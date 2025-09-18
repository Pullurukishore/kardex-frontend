'use client';

import { forwardRef, useEffect, useState } from 'react';
import { motion, HTMLMotionProps, MotionProps } from 'framer-motion';

type ClientOnlyMotionProps<T extends keyof JSX.IntrinsicElements = 'div'> = {
  as?: T;
  children?: React.ReactNode;
} & Omit<HTMLMotionProps<T>, keyof MotionProps> &
  MotionProps & {
    // Add any additional props specific to your component
    className?: string;
  };

function ClientOnlyMotionInner<T extends keyof JSX.IntrinsicElements = 'div'>(
  { as: Tag = 'div' as T, ...props }: ClientOnlyMotionProps<T>,
  ref: React.ForwardedRef<HTMLElement>
) {
  const [mounted, setMounted] = useState(false);
  const MotionComponent = motion[Tag as keyof typeof motion] || motion.div;

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    const Element = Tag as keyof JSX.IntrinsicElements;
    return <Element ref={ref} {...props as any} />;
  }

  return <MotionComponent ref={ref} {...props as any} />;
}

// Create the forwarded ref component
const ClientOnlyMotion = forwardRef(ClientOnlyMotionInner) as <T extends keyof JSX.IntrinsicElements = 'div'>(
  props: ClientOnlyMotionProps<T> & { ref?: React.ForwardedRef<HTMLElement> }
) => React.ReactElement;

ClientOnlyMotion.displayName = 'ClientOnlyMotion';

export default ClientOnlyMotion;