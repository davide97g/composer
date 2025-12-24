import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useState } from "react";
import { AILoadingEffect } from "./AILoadingEffects";

const SearchForm = () => {
  const [formData, setFormData] = useState({
    mainSearch: "",
    productSearch: "",
    locationSearch: "",
    categoryFilter: "",
    dateRange: "",
    locationFilter: "",
    priceRange: "",
    tags: [] as string[],
    advancedFilters: {
      rating: "",
      availability: "",
      sortBy: "",
    },
    showAdvanced: false,
  });
  const [isMainSearchFocused, setIsMainSearchFocused] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (tag: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      tags: checked ? [...prev.tags, tag] : prev.tags.filter((t) => t !== tag),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Search Form Data:", formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Search-Heavy Form</CardTitle>
        <CardDescription>
          Multiple search inputs with autocomplete, filters, and advanced
          options
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Main Search */}
          <div className="space-y-2">
            <Label htmlFor="mainSearch">Main Search</Label>
            <div className="relative">
              <Input
                id="mainSearch"
                type="search"
                placeholder="Search for anything..."
                value={formData.mainSearch}
                onChange={(e) =>
                  handleInputChange("mainSearch", e.target.value)
                }
                onFocus={() => setIsMainSearchFocused(true)}
                onBlur={() => setIsMainSearchFocused(false)}
                className="relative z-10"
              />
              <AILoadingEffect type="shimmer" isActive={isMainSearchFocused} />
            </div>
          </div>

          {/* Product Search */}
          <div className="space-y-2">
            <Label htmlFor="productSearch">Product Search</Label>
            <Input
              id="productSearch"
              type="search"
              placeholder="Search products..."
              value={formData.productSearch}
              onChange={(e) =>
                handleInputChange("productSearch", e.target.value)
              }
            />
          </div>

          {/* Location Search */}
          <div className="space-y-2">
            <Label htmlFor="locationSearch">Location Search</Label>
            <Input
              id="locationSearch"
              type="search"
              placeholder="Enter location..."
              value={formData.locationSearch}
              onChange={(e) =>
                handleInputChange("locationSearch", e.target.value)
              }
            />
          </div>

          {/* Filter Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="categoryFilter">Category</Label>
              <Select
                id="categoryFilter"
                value={formData.categoryFilter}
                onChange={(e) =>
                  handleInputChange("categoryFilter", e.target.value)
                }
              >
                <option value="">All Categories</option>
                <option value="electronics">Electronics</option>
                <option value="clothing">Clothing</option>
                <option value="food">Food</option>
                <option value="books">Books</option>
                <option value="sports">Sports</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateRange">Date Range</Label>
              <Select
                id="dateRange"
                value={formData.dateRange}
                onChange={(e) => handleInputChange("dateRange", e.target.value)}
              >
                <option value="">Any Date</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="locationFilter">Location Filter</Label>
              <Select
                id="locationFilter"
                value={formData.locationFilter}
                onChange={(e) =>
                  handleInputChange("locationFilter", e.target.value)
                }
              >
                <option value="">All Locations</option>
                <option value="us">United States</option>
                <option value="uk">United Kingdom</option>
                <option value="ca">Canada</option>
                <option value="au">Australia</option>
                <option value="de">Germany</option>
              </Select>
            </div>
          </div>

          {/* Price Range */}
          <div className="space-y-2">
            <Label htmlFor="priceRange">Price Range</Label>
            <Select
              id="priceRange"
              value={formData.priceRange}
              onChange={(e) => handleInputChange("priceRange", e.target.value)}
            >
              <option value="">Any Price</option>
              <option value="0-50">$0 - $50</option>
              <option value="50-100">$50 - $100</option>
              <option value="100-500">$100 - $500</option>
              <option value="500+">$500+</option>
            </Select>
          </div>

          {/* Tags/Checkboxes */}
          <div className="space-y-2">
            <Label>Filter Tags</Label>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="tag-new"
                  checked={formData.tags.includes("new")}
                  onChange={(e) =>
                    handleCheckboxChange("new", e.target.checked)
                  }
                />
                <Label htmlFor="tag-new">New</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="tag-featured"
                  checked={formData.tags.includes("featured")}
                  onChange={(e) =>
                    handleCheckboxChange("featured", e.target.checked)
                  }
                />
                <Label htmlFor="tag-featured">Featured</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="tag-sale"
                  checked={formData.tags.includes("sale")}
                  onChange={(e) =>
                    handleCheckboxChange("sale", e.target.checked)
                  }
                />
                <Label htmlFor="tag-sale">On Sale</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="tag-premium"
                  checked={formData.tags.includes("premium")}
                  onChange={(e) =>
                    handleCheckboxChange("premium", e.target.checked)
                  }
                />
                <Label htmlFor="tag-premium">Premium</Label>
              </div>
            </div>
          </div>

          {/* Advanced Search Toggle */}
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  showAdvanced: !prev.showAdvanced,
                }))
              }
            >
              {formData.showAdvanced ? "Hide" : "Show"} Advanced Filters
            </Button>
          </div>

          {/* Advanced Filters */}
          {formData.showAdvanced && (
            <div className="space-y-4 p-4 border rounded-md bg-muted/50">
              <div className="space-y-2">
                <Label htmlFor="rating">Minimum Rating</Label>
                <Select
                  id="rating"
                  value={formData.advancedFilters.rating}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      advancedFilters: {
                        ...prev.advancedFilters,
                        rating: e.target.value,
                      },
                    }))
                  }
                >
                  <option value="">Any Rating</option>
                  <option value="1">1+ Stars</option>
                  <option value="2">2+ Stars</option>
                  <option value="3">3+ Stars</option>
                  <option value="4">4+ Stars</option>
                  <option value="5">5 Stars</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="availability">Availability</Label>
                <Select
                  id="availability"
                  value={formData.advancedFilters.availability}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      advancedFilters: {
                        ...prev.advancedFilters,
                        availability: e.target.value,
                      },
                    }))
                  }
                >
                  <option value="">Any</option>
                  <option value="in-stock">In Stock</option>
                  <option value="out-of-stock">Out of Stock</option>
                  <option value="pre-order">Pre-Order</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sortBy">Sort By</Label>
                <Select
                  id="sortBy"
                  value={formData.advancedFilters.sortBy}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      advancedFilters: {
                        ...prev.advancedFilters,
                        sortBy: e.target.value,
                      },
                    }))
                  }
                >
                  <option value="">Default</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="newest">Newest First</option>
                </Select>
              </div>
            </div>
          )}

          <Button type="submit">Search</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export { SearchForm };
