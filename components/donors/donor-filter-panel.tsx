'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Filter, X } from 'lucide-react';
import { donorService, DonorFilters } from '@/lib/services/donor-service';

interface DonorFilterPanelProps {
  organizationId: string;
  filters: DonorFilters;
  onFiltersChange: (filters: DonorFilters) => void;
}

export default function DonorFilterPanel({
  organizationId,
  filters,
  onFiltersChange,
}: DonorFilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // Load filter options
  useEffect(() => {
    const loadFilterOptions = async () => {
      const [countries, tags] = await Promise.all([
        donorService.getAvailableCountries(organizationId),
        donorService.getAvailableTags(organizationId),
      ]);

      setAvailableCountries(countries);
      setAvailableTags(tags);
    };

    loadFilterOptions();
  }, [organizationId]);

  // Load states when country changes
  useEffect(() => {
    const loadStates = async () => {
      if (filters.country && filters.country.length === 1) {
        const states = await donorService.getAvailableStates(organizationId, filters.country[0]);
        setAvailableStates(states);
      } else {
        const states = await donorService.getAvailableStates(organizationId);
        setAvailableStates(states);
      }
    };

    loadStates();
  }, [organizationId, filters.country]);

  // Load cities when state changes
  useEffect(() => {
    const loadCities = async () => {
      if (filters.state && filters.state.length === 1) {
        const cities = await donorService.getAvailableCities(organizationId, filters.state[0]);
        setAvailableCities(cities);
      } else {
        const cities = await donorService.getAvailableCities(organizationId);
        setAvailableCities(cities);
      }
    };

    loadCities();
  }, [organizationId, filters.state]);

  const toggleArrayFilter = (key: keyof DonorFilters, value: string) => {
    const currentValues = (filters[key] as string[]) || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];

    onFiltersChange({
      ...filters,
      [key]: newValues.length > 0 ? newValues : undefined,
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: filters.search, // Keep search term
    });
  };

  const activeFilterCount = [
    filters.status?.length,
    filters.giving_level?.length,
    filters.country?.length,
    filters.state?.length,
    filters.city?.length,
    filters.tags?.length,
  ].reduce((sum, count) => sum + (count || 0), 0);

  const donorStatuses = ['active', 'inactive', 'deceased', 'do_not_contact'];
  const givingLevels = ['major', 'mid-level', 'annual', 'lapsed'];

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2 rounded-full px-1.5 py-0.5 text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filter Donors</SheetTitle>
          <SheetDescription>
            Refine your donor list with advanced filters
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status Filter */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Status</Label>
              {filters.status?.length ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs text-gray-500"
                  onClick={() => onFiltersChange({ ...filters, status: undefined })}
                >
                  Clear
                </Button>
              ) : null}
            </div>
            <div className="space-y-2">
              {donorStatuses.map((status) => (
                <div key={status} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${status}`}
                    checked={filters.status?.includes(status) || false}
                    onCheckedChange={() => toggleArrayFilter('status', status)}
                  />
                  <label
                    htmlFor={`status-${status}`}
                    className="text-sm capitalize cursor-pointer"
                  >
                    {status.replace('_', ' ')}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Giving Level Filter */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Giving Level</Label>
              {filters.giving_level?.length ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs text-gray-500"
                  onClick={() => onFiltersChange({ ...filters, giving_level: undefined })}
                >
                  Clear
                </Button>
              ) : null}
            </div>
            <div className="space-y-2">
              {givingLevels.map((level) => (
                <div key={level} className="flex items-center space-x-2">
                  <Checkbox
                    id={`level-${level}`}
                    checked={filters.giving_level?.includes(level) || false}
                    onCheckedChange={() => toggleArrayFilter('giving_level', level)}
                  />
                  <label
                    htmlFor={`level-${level}`}
                    className="text-sm capitalize cursor-pointer"
                  >
                    {level.replace('-', ' ')}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Geographic Filters */}
          <div className="border-t pt-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Geographic Location</h3>

            {/* Country Filter */}
            {availableCountries.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Country</Label>
                  {filters.country?.length ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-xs text-gray-500"
                      onClick={() => onFiltersChange({ ...filters, country: undefined })}
                    >
                      Clear
                    </Button>
                  ) : null}
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {availableCountries.map((country) => (
                    <div key={country} className="flex items-center space-x-2">
                      <Checkbox
                        id={`country-${country}`}
                        checked={filters.country?.includes(country) || false}
                        onCheckedChange={() => toggleArrayFilter('country', country)}
                      />
                      <label
                        htmlFor={`country-${country}`}
                        className="text-sm cursor-pointer"
                      >
                        {country}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* State Filter */}
            {availableStates.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">State/Province</Label>
                  {filters.state?.length ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-xs text-gray-500"
                      onClick={() => onFiltersChange({ ...filters, state: undefined })}
                    >
                      Clear
                    </Button>
                  ) : null}
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {availableStates.map((state) => (
                    <div key={state} className="flex items-center space-x-2">
                      <Checkbox
                        id={`state-${state}`}
                        checked={filters.state?.includes(state) || false}
                        onCheckedChange={() => toggleArrayFilter('state', state)}
                      />
                      <label
                        htmlFor={`state-${state}`}
                        className="text-sm cursor-pointer"
                      >
                        {state}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* City Filter */}
            {availableCities.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">City</Label>
                  {filters.city?.length ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-xs text-gray-500"
                      onClick={() => onFiltersChange({ ...filters, city: undefined })}
                    >
                      Clear
                    </Button>
                  ) : null}
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {availableCities.map((city) => (
                    <div key={city} className="flex items-center space-x-2">
                      <Checkbox
                        id={`city-${city}`}
                        checked={filters.city?.includes(city) || false}
                        onCheckedChange={() => toggleArrayFilter('city', city)}
                      />
                      <label
                        htmlFor={`city-${city}`}
                        className="text-sm cursor-pointer"
                      >
                        {city}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tags Filter */}
          {availableTags.length > 0 && (
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Tags</Label>
                {filters.tags?.length ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-xs text-gray-500"
                    onClick={() => onFiltersChange({ ...filters, tags: undefined })}
                  >
                    Clear
                  </Button>
                ) : null}
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {availableTags.map((tag) => (
                  <div key={tag} className="flex items-center space-x-2">
                    <Checkbox
                      id={`tag-${tag}`}
                      checked={filters.tags?.includes(tag) || false}
                      onCheckedChange={() => toggleArrayFilter('tags', tag)}
                    />
                    <label
                      htmlFor={`tag-${tag}`}
                      className="text-sm cursor-pointer"
                    >
                      {tag}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              className="flex-1"
              onClick={clearFilters}
              disabled={activeFilterCount === 0}
            >
              <X className="h-4 w-4 mr-2" />
              Clear All
            </Button>
            <Button
              className="flex-1"
              onClick={() => setIsOpen(false)}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
