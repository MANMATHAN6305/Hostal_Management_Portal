import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

const transitionVariants = {
  initial: {
    opacity: 0,
    y: 14,
    scale: 0.992,
    filter: 'blur(2px)'
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)'
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.992,
    filter: 'blur(2px)'
  }
};

export default function PageTransition({ children, className = '' }: PageTransitionProps) {
  return (
    <motion.div
      className={className}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={transitionVariants}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      style={{ willChange: 'transform, opacity, filter' }}
    >
      {children}
    </motion.div>
  );
}