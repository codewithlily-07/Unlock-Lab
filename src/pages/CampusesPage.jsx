import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Cpu,
  Search,
  Layers,
  ArrowRight,
  Filter,
  Users,
  PlusCircle,
  AlertCircle,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { formatDuration } from '../lib/utils';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export function CampusesPage() {
  const { isAdmin } = useAuth();
  const [campuses, setCampuses] = useState([]);
  const [resources, setResources] = useState([]);
  const [selectedCampusId, setSelectedCampusId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [campusesData, resourcesData] = await Promise.all([
        api.getCampuses(),
        api.getResources({ status: 'active' }),
      ]);
      setCampuses(campusesData || []);
      setResources(resourcesData || []);
    } catch (err) {
      console.error('Failed to load campus facilities:', err);
      setError(err.message || 'Unable to connect to database');
    } finally {
      setLoading(false);
    }
  }

  // Filter resources
  const filteredResources = resources.filter((res) => {
    const matchesCampus = selectedCampusId === 'all' || res.campus_id === selectedCampusId;
    const matchesType = selectedType === 'all' || res.type === selectedType;
    const matchesSearch =
      !searchQuery.trim() ||
      res.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (res.department_name && res.department_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCampus && matchesType && matchesSearch;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <section className="rounded-3xl bg-[#073D2D] text-white p-8 sm:p-12 relative overflow-hidden shadow-sm">
        <div
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#126B4F]/40 blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[#F3A66B] text-xs font-bold uppercase tracking-wider">
            <Building className="w-3.5 h-3.5" />
            <span>Multi-Disciplinary Academic Facilities</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-[#FFFCF5] tracking-tight leading-tight">
            Campus Facilities &amp; Laboratory Hubs
          </h1>

          <p className="text-sm sm:text-base text-[#C7D9C4] leading-relaxed font-sans max-w-2xl">
            Explore dedicated rooms, testing bays, specialized computing clusters, and precision research instrumentation across all academic departments.
          </p>

          {isAdmin && (
            <div className="pt-2">
              <Link to="/owner/resources/new">
                <Button variant="primary" className="bg-[#F3A66B] text-[#22251F] font-bold hover:bg-[#F8C49E] border-none text-xs">
                  <PlusCircle className="w-4 h-4 mr-1.5" />
                  Add Campus Facility or Room
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Loading State */}
      {loading && (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#103C2D]/20 border-t-[#103C2D] rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#4A5B53] font-medium">Querying database for campus facilities...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <Card className="border-[#c2413a]/30 bg-[#fdf2f1] p-6 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-[#c2413a] mx-auto" />
          <h3 className="text-sm font-bold text-[#c2413a]">Database Connection Error</h3>
          <p className="text-xs text-[#4A5B53]">{error}</p>
          <Button size="sm" variant="outline" onClick={loadData}>
            Retry Request
          </Button>
        </Card>
      )}

      {/* Main Content */}
      {!loading && !error && (
        <>
          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-[#E5DDD0] shadow-sm">
            {/* Campus Selector Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              <button
                onClick={() => setSelectedCampusId('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCampusId === 'all'
                    ? 'bg-[#103C2D] text-white shadow-sm'
                    : 'text-[#4A5043] hover:bg-[#F7F1E7]'
                }`}
              >
                All Campuses ({campuses.length})
              </button>
              {campuses.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCampusId(c.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCampusId === c.id
                      ? 'bg-[#103C2D] text-white shadow-sm'
                      : 'text-[#4A5043] hover:bg-[#F7F1E7]'
                  }`}
                >
                  {c.name.split('&')[0].trim()} ({c.resource_count || 0})
                </button>
              ))}
            </div>

            {/* Search and Type Filter */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 text-[#798C82] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter resources or rooms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-[#E5DDD0] focus:outline-none focus:border-[#103C2D] bg-[#FAF9F5]"
                />
              </div>

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-[#E5DDD0] bg-[#FAF9F5] font-semibold text-[#17231E]"
              >
                <option value="all">All Types</option>
                <option value="room">Rooms</option>
                <option value="laboratory">Laboratories</option>
                <option value="equipment">Equipment</option>
              </select>
            </div>
          </div>

          {/* Empty State when no resources in DB */}
          {resources.length === 0 ? (
            <Card className="border-[#E5DDD0] p-12 text-center space-y-4 bg-white">
              <div className="w-14 h-14 rounded-2xl bg-[#E8EFE6] text-[#103C2D] flex items-center justify-center mx-auto">
                <Building className="w-7 h-7" />
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="text-base font-bold text-[#17231E]">No Campus Resources Entered Yet</h3>
                <p className="text-xs text-[#4A5B53] leading-relaxed">
                  The database currently has zero recorded rooms, labs, or equipment. All listings are strictly database-driven.
                </p>
              </div>
              {isAdmin ? (
                <div className="pt-2">
                  <Link to="/owner/resources/new">
                    <Button variant="primary" className="bg-[#103C2D] text-white font-bold text-xs">
                      <PlusCircle className="w-4 h-4 mr-1.5" />
                      Add First Campus Resource
                    </Button>
                  </Link>
                </div>
              ) : (
                <p className="text-[11px] text-[#798C82]">
                  Authorized institutional administrators can register facilities via the Admin Hub.
                </p>
              )}
            </Card>
          ) : filteredResources.length === 0 ? (
            /* Empty State for filter query */
            <Card className="border-[#E5DDD0] p-8 text-center space-y-2 bg-white">
              <p className="text-xs font-bold text-[#17231E]">No facilities match your active filter</p>
              <p className="text-xs text-[#4A5B53]">Try clearing the search query or selecting &quot;All Campuses&quot;.</p>
              <div className="pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedCampusId('all');
                    setSelectedType('all');
                    setSearchQuery('');
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            </Card>
          ) : (
            /* Resource Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.map((res) => (
                <Card key={res.id} hover className="border-[#E5DDD0] overflow-hidden flex flex-col justify-between">
                  <div>
                    {/* Photo or Icon Header */}
                    <div className="relative h-44 bg-[#E8EFE6] overflow-hidden">
                      {res.photos && res.photos[0] ? (
                        <img
                          src={res.photos[0]}
                          alt={res.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#103C2D]">
                          <Building className="w-12 h-12 opacity-40" />
                        </div>
                      )}
                      <div className="absolute top-3 left-3 flex gap-1.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white/90 text-[#103C2D] backdrop-blur-sm shadow-sm">
                          {res.type}
                        </span>
                        {res.requires_approval === 0 && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#103C2D] text-white shadow-sm">
                            Instant Access
                          </span>
                        )}
                      </div>
                    </div>

                    <CardBody className="p-5 space-y-3">
                      <div>
                        <div className="text-[10px] font-bold text-[#126B4F] uppercase tracking-wider">
                          {res.department_name || 'Interdisciplinary Facility'}
                        </div>
                        <h3 className="text-base font-bold text-[#17231E] leading-snug line-clamp-1">
                          {res.name}
                        </h3>
                      </div>

                      <p className="text-xs text-[#4A5B53] line-clamp-2 leading-relaxed">
                        {res.description || 'Verified institutional facility ready for student and faculty reservations.'}
                      </p>

                      <div className="space-y-1.5 text-xs text-[#4A5B53] pt-1">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#D87E3A] shrink-0" />
                          <span className="truncate">{res.location}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#103C2D] shrink-0" />
                          <span>
                            Hours: {res.operating_hours_start} – {res.operating_hours_end}
                          </span>
                        </div>
                        {res.capacity > 1 && (
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-[#4A5043] shrink-0" />
                            <span>Capacity: Up to {res.capacity} occupants</span>
                          </div>
                        )}
                      </div>
                    </CardBody>
                  </div>

                  <div className="p-5 pt-0">
                    <Link to={`/resources/${res.id}`} className="block">
                      <Button
                        variant="primary"
                        className="w-full font-bold bg-[#103C2D] hover:bg-[#185340] text-white text-xs py-2 rounded-xl flex items-center justify-center gap-1"
                      >
                        <span>Check Availability &amp; Book</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default CampusesPage;
