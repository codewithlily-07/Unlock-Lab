import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { RESOURCE_CATEGORIES } from '../lib/constants';
import { Card, CardBody } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { FormField, Input, Select } from '../components/ui/FormField';
import { Search, Filter, ShieldCheck, MapPin, Clock, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { formatDuration } from '../lib/utils';

export function ExplorePage() {
  const { profile } = useAuth();
  const [resources, setResources] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [onlyEligible, setOnlyEligible] = useState(false);
  const [eligibilityMap, setEligibilityMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResources();
  }, []);

  useEffect(() => {
    if (resources.length > 0 && profile?.id) {
      calculateEligibilityForUser();
    }
  }, [resources, profile?.id]);

  async function loadResources() {
    setLoading(true);
    const list = await api.getResources();
    setResources(list);
    setLoading(false);
  }

  async function calculateEligibilityForUser() {
    const map = {};
    for (const r of resources) {
      const checklist = await api.checkEligibility(profile.id, r.id);
      const isEligible = checklist.every((item) => item.passed);
      map[r.id] = { isEligible, checklist };
    }
    setEligibilityMap(map);
  }

  const filtered = resources.filter((res) => {
    if (res.status !== 'active') return false;
    if (category !== 'all' && res.category !== category) return false;
    if (search && !res.name.toLowerCase().includes(search.toLowerCase()) && !res.description.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (onlyEligible && eligibilityMap[res.id] && !eligibilityMap[res.id].isEligible) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            ECE Lab Equipment &amp; Special Spaces
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse verified departmental oscilloscopes, logic analyzers, FPGA kits, and test bays.
          </p>
        </div>

        {/* "I am eligible now" filter pill */}
        <button
          onClick={() => setOnlyEligible(!onlyEligible)}
          className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
            onlyEligible
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>I Am Eligible Now</span>
          <span
            className={`w-2 h-2 rounded-full ${
              onlyEligible ? 'bg-white' : 'bg-slate-300'
            }`}
          />
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <Input
            placeholder="Search equipment by name, protocol, model (e.g. Tektronix, FPGA, Weller, 3GHz)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <div>
          <Select value={category} onChange={(e) => setCategory(e.target.value)} className="text-xs">
            {RESOURCE_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Resources Catalog Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading equipment catalog...</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-200">
          <p className="text-sm font-semibold text-slate-700">No equipment matches your search filters.</p>
          {onlyEligible && (
            <p className="text-xs text-slate-500 mt-1">
              Try disabling the <strong>"I Am Eligible Now"</strong> filter to see resources requiring additional training certifications.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((resource) => {
            const elig = eligibilityMap[resource.id];
            const isEligible = elig ? elig.isEligible : true;

            return (
              <Card key={resource.id} hover className="flex flex-col justify-between group">
                <div>
                  {/* Photo with Overlay Category */}
                  <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                    <img
                      src={resource.photos[0] || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'}
                      alt={resource.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-900/80 text-white backdrop-blur-sm">
                        {resource.category}
                      </span>
                    </div>

                    {/* Real-Time User Eligibility Indicator */}
                    <div className="absolute top-3 right-3">
                      {isEligible ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500 text-white shadow-sm">
                          <CheckCircle2 className="w-3 h-3" /> Eligible
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-sm">
                          <XCircle className="w-3 h-3" /> Req Training
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <CardBody className="p-5 space-y-3">
                    <h3 className="font-bold text-sm text-slate-900 line-clamp-2 group-hover:text-brand-600 transition-colors">
                      {resource.name}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {resource.description}
                    </p>

                    <div className="space-y-1.5 pt-1 text-xs text-slate-600">
                      <div className="flex items-center space-x-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{resource.location}</span>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Duration: {formatDuration(resource.min_booking_minutes)} - {formatDuration(resource.max_booking_minutes)}</span>
                      </div>
                    </div>
                  </CardBody>
                </div>

                {/* Footer Action */}
                <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-medium text-slate-500">
                    {resource.requires_approval ? 'Approval Required' : 'Instant Auto-Approve'}
                  </span>
                  <Link
                    to={`/resources/${resource.id}`}
                    className="font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                  >
                    <span>Check &amp; Book</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
