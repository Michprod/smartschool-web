import React from 'react';

type SkeletonProps = {
  className?: string;
};

const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return <div className={`ui-skeleton ${className}`.trim()} aria-hidden="true" />;
};

export default Skeleton;
