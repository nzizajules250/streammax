import React, { useRef, useState } from 'react';
import { Movie, UserProfile } from '../types';
import { ChevronLeft, ChevronRight, TrendingUp, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import MovieCard from './MovieCard';

interface MovieRowProps {
  title: string;
  movies?: Movie[];
  profile?: UserProfile;
  onPlay?: (movie: Movie) => void;
  onOpenDetails?: (movie: Movie) => void;
  onAuthRequired?: () => void;
  isLoading?: boolean;
}

export default function MovieRow({ 
  title, 
  movies = [], 
  profile, 
  onPlay, 
  onOpenDetails, 
  onAuthRequired,
  isLoading = false 
}: MovieRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleScroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo = direction === 'left' 
        ? scrollLeft - clientWidth * 0.75 
        : scrollLeft + clientWidth * 0.75;
      
      rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const handleScrollUpdate = () => {
    if (rowRef.current) {
      setShowLeftArrow(rowRef.current.scrollLeft > 10);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3 relative py-2">
        {/* Category Title Skeleton */}
        <div className="px-4 md:px-12">
          <div className="flex items-center gap-3">
            <div className="h-5 w-32 bg-zinc-800/80 rounded-lg animate-pulse" />
            <div className="h-px flex-1 bg-gradient-to-r from-zinc-800/50 to-transparent" />
          </div>
        </div>
        {/* Horizontally scrolling skeleton */}
        <div className="px-4 md:px-12 flex gap-3 overflow-x-hidden py-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex-none w-36 sm:w-48 h-56 sm:h-72 rounded-xl bg-gradient-to-b from-zinc-900/80 to-black/80 animate-pulse border border-zinc-800/30 flex flex-col justify-end p-4 space-y-3 backdrop-blur-sm"
            >
              <div className="h-4 w-5/6 bg-zinc-800/80 rounded-lg animate-pulse" />
              <div className="h-3 w-1/2 bg-zinc-800/50 rounded-lg animate-pulse" />
              <div className="flex gap-2">
                <div className="h-6 w-16 bg-zinc-800/60 rounded-full animate-pulse" />
                <div className="h-6 w-12 bg-zinc-800/40 rounded-full animate-pulse" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  if (movies.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-3 relative py-2 group/row"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Category Title with decorative elements */}
      <div className="px-4 md:px-12">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-gradient-to-b from-red-500 to-red-700 rounded-full shadow-lg shadow-red-900/30"></div>
            <h2 className="text-sm md:text-lg font-bold text-white tracking-wide group-hover/row:text-red-400 transition-colors duration-300">
              {title}
            </h2>
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-zinc-800/50 via-zinc-700/30 to-transparent"></div>
          {isHovered && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xs text-zinc-500 font-medium flex items-center gap-1.5"
            >
              <Sparkles className="w-3 h-3 text-red-400" />
              {movies.length} titles
            </motion.span>
          )}
        </div>
      </div>

      {/* Row Wrapper */}
      <div className="relative px-4 md:px-12">
        {/* Left Scroll Arrow */}
        <AnimatedArrow
          direction="left"
          show={showLeftArrow}
          isRowHovered={isHovered}
          onClick={() => handleScroll('left')}
        />

        {/* Right Scroll Arrow */}
        <AnimatedArrow
          direction="right"
          show={true}
          isRowHovered={isHovered}
          onClick={() => handleScroll('right')}
        />

        {/* Horizontal Container */}
        <div
          ref={rowRef}
          onScroll={handleScrollUpdate}
          className="flex gap-3 overflow-x-auto overflow-y-hidden py-4 scrollbar-none scroll-smooth"
        >
          {movies.map((movie, index) => (
            <motion.div
              key={movie.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, duration: 0.4 }}
              className="flex-none"
            >
              <MovieCard
                movie={movie}
                profile={profile}
                onPlay={onPlay}
                onOpenDetails={onOpenDetails}
                onAuthRequired={onAuthRequired}
              />
            </motion.div>
          ))}
        </div>

        {/* Gradient fade indicators on edges */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/80 to-transparent pointer-events-none opacity-0 group-hover/row:opacity-100 transition-opacity duration-300"></div>
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/80 to-transparent pointer-events-none opacity-0 group-hover/row:opacity-100 transition-opacity duration-300"></div>
      </div>

      <style jsx>{`
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </motion.div>
  );
}

// Animated Arrow Component
function AnimatedArrow({ 
  direction, 
  show, 
  isRowHovered, 
  onClick 
}: { 
  direction: 'left' | 'right'; 
  show: boolean; 
  isRowHovered: boolean; 
  onClick: () => void;
}) {
  const position = direction === 'left' ? 'left-2' : 'right-2';
  const Icon = direction === 'left' ? ChevronLeft : ChevronRight;

  return (
    <motion.button
      initial={false}
      animate={{
        opacity: show && isRowHovered ? 1 : 0,
        scale: show && isRowHovered ? 1 : 0.8,
        x: direction === 'left' ? (show && isRowHovered ? 0 : -10) : (show && isRowHovered ? 0 : 10),
      }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={`absolute ${position} top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-red-600/90 to-red-900/90 hover:from-red-500 hover:to-red-800 flex items-center justify-center text-white rounded-full shadow-lg shadow-red-900/30 hover:shadow-red-900/50 transition-all duration-300 cursor-pointer border-2 border-red-700/50 hover:border-red-500/70 backdrop-blur-sm`}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <Icon className="h-5 w-5 md:h-6 md:w-6 transition-transform duration-300 group-hover/arrow:scale-110" />
    </motion.button>
  );
}