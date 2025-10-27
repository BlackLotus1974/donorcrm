'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, X, Loader2, ChevronRight } from 'lucide-react';
import { donorService } from '@/lib/services/donor-service';
import { Donor } from '@/lib/types';
import { cn } from '@/lib/utils';

interface DonorSearchNavProps {
  organizationId: string;
  currentDonorId?: string;
  className?: string;
}

export default function DonorSearchNav({
  organizationId,
  currentDonorId,
  className
}: DonorSearchNavProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Donor[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Search donors with debounce
  const searchDonors = useCallback(async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const result = await donorService.getDonors(
        organizationId,
        1,
        10,
        { search: term.trim() },
        { field: 'name', direction: 'asc' }
      );
      setSearchResults(result.data);
      setShowResults(true);
    } catch (error) {
      console.error('Failed to search donors:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [organizationId]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      searchDonors(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, searchDonors]);

  // Handle click outside to close results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showResults || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < searchResults.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : searchResults.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          navigateToDonor(searchResults[selectedIndex].id);
        }
        break;
      case 'Escape':
        setShowResults(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Navigate to donor
  const navigateToDonor = (donorId: string) => {
    setShowResults(false);
    setSearchTerm('');
    setSelectedIndex(-1);
    router.push(`/donors/${donorId}`);
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setShowResults(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div ref={searchRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search donors..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => searchTerm && setShowResults(true)}
          className="pl-10 pr-10 w-full sm:w-80"
        />
        {isSearching ? (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 animate-spin" />
        ) : searchTerm ? (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
            onClick={clearSearch}
          >
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      {/* Search Results Dropdown */}
      {showResults && searchResults.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 shadow-lg max-h-96 overflow-y-auto">
          <CardContent className="p-2">
            <div className="text-xs text-gray-500 px-2 py-1 font-medium">
              {searchResults.length} {searchResults.length === 1 ? 'donor' : 'donors'} found
            </div>
            <div className="space-y-1">
              {searchResults.map((donor, index) => (
                <button
                  key={donor.id}
                  onClick={() => navigateToDonor(donor.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-md transition-colors",
                    "hover:bg-gray-100 focus:bg-gray-100 focus:outline-none",
                    selectedIndex === index && "bg-gray-100",
                    currentDonorId === donor.id && "bg-blue-50 border border-blue-200"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm truncate">
                          {donor.first_name} {donor.last_name}
                        </span>
                        {currentDonorId === donor.id && (
                          <Badge variant="outline" className="text-xs">
                            Current
                          </Badge>
                        )}
                      </div>

                      <div className="text-xs text-gray-600 space-y-0.5">
                        {donor.email && (
                          <div className="truncate">{donor.email}</div>
                        )}

                        <div className="flex items-center gap-2 flex-wrap">
                          {donor.employer && (
                            <span className="truncate">{donor.employer}</span>
                          )}

                          {donor.giving_level && (
                            <Badge variant="outline" className="text-xs">
                              {donor.giving_level}
                            </Badge>
                          )}

                          <span>
                            {formatCurrency(donor.total_lifetime_giving)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {showResults && searchTerm && !isSearching && searchResults.length === 0 && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 shadow-lg">
          <CardContent className="p-6 text-center">
            <Search className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              No donors found matching "{searchTerm}"
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
