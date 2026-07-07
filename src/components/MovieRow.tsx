import React, { useRef, useState } from 'react';
import { Movie, UserProfile } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MovieCard from './MovieCard';

interface MovieRowProps {
  title: string;
  movies: Movie[];
  profile: UserProfile;
  onPlay: (movie: Movie) => void;
  onOpenDetails: (movie: Movie) => void;
  onAuthRequired?: () => void;
}

export default function MovieRow({ title, movies, profile, onPlay, onOpenDetails, onAuthRequired }: MovieRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);

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

  if (movies.length === 0) return null;

  return (
    <div className="space-y-2 relative group/row">
      {/* Category Title */}
      <h2 className="text-sm md:text-lg font-bold text-neutral-200 tracking-wide px-4 md:px-12 hover:text-white transition-colors">
        {title}
      </h2>

      {/* Row Wrapper */}
      <div className="relative px-4 md:px-12">
        {/* Left Scroll Arrow */}
        {showLeftArrow && (
          <button
            onClick={() => handleScroll('left')}
            className="absolute left-0 top-0 bottom-0 z-20 w-10 md:w-12 bg-black/60 hover:bg-black/80 flex items-center justify-center text-white opacity-0 group-hover/row:opacity-100 transition-opacity cursor-pointer border-r border-neutral-900"
          >
            <ChevronLeft className="h-6 w-6 md:h-8 md:w-8" />
          </button>
        )}

        {/* Right Scroll Arrow */}
        <button
          onClick={() => handleScroll('right')}
          className="absolute right-0 top-0 bottom-0 z-20 w-10 md:w-12 bg-black/60 hover:bg-black/80 flex items-center justify-center text-white opacity-0 group-hover/row:opacity-100 transition-opacity cursor-pointer border-l border-neutral-900"
        >
          <ChevronRight className="h-6 w-6 md:h-8 md:w-8" />
        </button>

        {/* Horizontal Container */}
        <div
          ref={rowRef}
          onScroll={handleScrollUpdate}
          className="flex gap-3 overflow-x-auto overflow-y-hidden py-3 scrollbar-none scroll-smooth pr-10"
        >
          {movies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              profile={profile}
              onPlay={onPlay}
              onOpenDetails={onOpenDetails}
              onAuthRequired={onAuthRequired}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
