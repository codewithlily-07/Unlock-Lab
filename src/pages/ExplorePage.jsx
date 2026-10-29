import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/FormField';
import {
  Search,
  MapPin,
  Clock,
  ArrowRight,
  Cpu,
  Building,
  RotateCcw,
  Users,
  PlusCircle,
  Filter,
} from 'lucide-react';
import { formatDuration } from '../lib/utils';

export function ExplorePage() {
  const { profile, isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('cat') || 'all';
  const initialSearch = searchParams.get('search') || '';

  const [resources, setResources] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState(initialSearch);
  const [selectedType, setSelectedType] = useState('all');
  const [selectedDept, setSelectedDept] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [resList, deptList] = await Promise.all([
        api.getResources({ status: 'active' }),
        api.getDepartments(),
      ]);
      setResources(resList || []);
      setDepartments(deptList || []);
    } catch (err) {
      console.error('Error fetching resources:', err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = resources.filter((res) => {
    if (res.status !== 'active') return false;
    if (selectedType !== 'all' && res.type !== selectedType) return false;
    if (selectedDept !== 'all' && res.department_id !== selectedDept) return false;
    if (
      search &&
      !res.name.toLowerCase().includes(search.toLowerCase()) &&
      !(res.description && res.description.toLowerCase().includes(search.toLowerCase())) &&
      !(res.location && res.location.toLowerCase().includes(search.toLowerCase()))
    ) {
      return false;
    }
    return true;
  });

  function resetFilters() {
    setSearch('');
    setSelectedType('all');
    setSelectedDept('all');
    setSearchParams({});
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Page Title & Intro */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f0f7f4] border border-[#126B4F]/20 text-[#073D2D] text-xs font-semibold mb-2">
            <Building className="w-3.5 h-3.5 text-[#126B4F]" />
            <span>Database Resource Catalog &middot; {resources.length} Verified Listings</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#17231E] tracking-tight">
            Explore Campus Rooms &amp; Equipment
          </h1>
          <p className="text-xs sm:text-sm text-[#4A5B53] mt-1 max-w-2xl">
            Browse and reserve departmental testing bays, meeting rooms, high-performance computing clusters, and precision laboratory instruments across all academic branches.
          </p>
        </div>

        {isAdmin && (
          <Link to="/owner/resources/new">
            <Button size="sm" variant="primary" className="bg-[#103C2D] text-white font-bold text-xs">
              <PlusCircle className="w-4 h-4 mr-1.5" />
              Add Room or Equipment
            </Button>
          </Link>
        )}
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E8E2D2] shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="relative md:col-span-6">
            <Search className="w-4 h-4 text-[#798C82] absolute left-3.5 top-3.5" />
            <Input
              placeholder="Search by name, laboratory, location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 text-xs sm:text-sm py-2"
            />
          </div>

          <div className="md:col-span-3">
            <Select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="text-xs sm:text-sm py-2 font-medium"
            >
              <option value="all">All Resource Types</option>
              <option value="room">Rooms &amp; Testing Bays</option>
              <option value="laboratory">Laboratories</option>
              <option value="equipment">Specialized Equipment</option>
            </Select>
          </div>

          <div className="md:col-span-3">
            <Select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="text-xs sm:text-sm py-2 font-medium"
            >
              <option value="all">All Academic Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </Select>
          </div>
        </div>

        {(selectedType !== 'all' || selectedDept !== 'all' || search) && (
          <div className="flex items-center justify-between pt-2 border-t border-[#F0ECE0] text-xs">
            <span className="text-[11px] font-bold text-[#798C82]">Filters active</span>
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#126B4F] hover:underline"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Catalog Results Grid */}
      {loading ? (
        <div className="p-16 text-center text-xs font-semibold text-[#798C82]">
          <div className="w-8 h-8 rounded-full border-2 border-[#126B4F] border-t-transparent animate-spin mx-auto mb-3" />
          <span>Querying database for available resources...</span>
        </div>
      ) : resources.length === 0 ? (
        /* Empty State when DB has 0 resources */
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-[#E8E2D2] shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#E8EFE6] text-[#103C2D] flex items-center justify-center mx-auto">
            <Building className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-bold text-[#17231E]">No Resources in Database</h3>
            <p className="text-xs text-[#4A5B53] leading-relaxed">
              No rooms, laboratories, or equipment have been registered yet. UnlockLab strictly displays authentic database records.
            </p>
          </div>
          {isAdmin ? (
            <Link to="/owner/resources/new">
              <Button size="sm" variant="primary" className="bg-[#103C2D] text-white font-bold text-xs">
                <PlusCircle className="w-4 h-4 mr-1.5" />
                Add First Resource
              </Button>
            </Link>
          ) : (
            <Link to="/campuses">
              <Button size="sm" variant="outline" className="text-xs font-bold">
                View Campuses Overview
              </Button>
            </Link>
          )}
        </div>
      ) : filtered.length === 0 ? (
        /* Empty filter match */
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-[#E8E2D2] shadow-sm space-y-3">
          <p className="text-sm font-bold text-[#17231E]">No resources match your search criteria.</p>
          <Button variant="secondary" size="sm" onClick={resetFilters}>
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((resource) => (
            <Card key={resource.id} hover className="flex flex-col justify-between group overflow-hidden border-[#E5DDD0]">
              <div>
                <div className="relative h-48 w-full bg-[#E8EFE6] overflow-hidden">
                  {resource.photos && resource.photos[0] ? (
                    <img
                      src={resource.photos[0]}
                      alt={resource.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#103C2D]">
                      <Building className="w-12 h-12 opacity-30" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#073D2D]/90 text-white backdrop-blur-sm">
                      {resource.type}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/90 text-[#103C2D] backdrop-blur-sm shadow-sm">
                      {resource.requires_approval ? 'Approval Required' : 'Instant Booking'}
                    </span>
                  </div>
                </div>

                <CardBody className="p-5 space-y-3">
                  <div>
                    <div className="text-[10px] font-bold text-[#126B4F] uppercase tracking-wider">
                      {resource.department_name || 'Interdisciplinary'}
                    </div>
                    <h3 className="font-bold text-sm text-[#17231E] line-clamp-1 group-hover:text-[#126B4F] transition-colors leading-snug">
                      {resource.name}
                    </h3>
                  </div>

                  <p className="text-xs text-[#4A5B53] line-clamp-2 leading-relaxed">
                    {resource.description || 'Verified campus resource ready for reservation.'}
                  </p>

                  <div className="space-y-1.5 pt-1 text-xs text-[#4A5B53]">
                    <div className="flex items-center space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#D87E3A] shrink-0" />
                      <span className="truncate">{resource.location}</span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#103C2D] shrink-0" />
                      <span>
                        Hours: {resource.operating_hours_start} – {resource.operating_hours_end}
                      </span>
                    </div>

                    {resource.capacity > 1 && (
                      <div className="flex items-center space-x-1.5">
                        <Users className="w-3.5 h-3.5 text-[#4A5043] shrink-0" />
                        <span>Capacity: {resource.capacity} occupants</span>
                      </div>
                    )}
                  </div>
                </CardBody>
              </div>

              <div className="px-5 py-3.5 bg-[#FFFCF5] border-t border-[#F0ECE0] flex items-center justify-between text-xs">
                <span className="text-[11px] font-medium text-[#798C82]">
                  Min: {formatDuration(resource.min_duration_minutes)}
                </span>
                <Link
                  to={`/resources/${resource.id}`}
                  className="font-bold text-[#126B4F] hover:text-[#073D2D] flex items-center gap-1"
                >
                  <span>Check &amp; Book</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default ExplorePage;
