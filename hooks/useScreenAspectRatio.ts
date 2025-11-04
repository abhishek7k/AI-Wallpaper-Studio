
import { useState, useEffect } from 'react';
import { AspectRatio } from '../types';

export const useScreenAspectRatio = (): AspectRatio => {
  const getAspectRatio = (): AspectRatio => {
    if (typeof window === 'undefined') {
      return '9:16';
    }
    const { innerWidth, innerHeight } = window;
    return innerHeight > innerWidth ? '9:16' : '16:9';
  };

  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(getAspectRatio());

  useEffect(() => {
    const handleResize = () => {
      setAspectRatio(getAspectRatio());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return aspectRatio;
};
