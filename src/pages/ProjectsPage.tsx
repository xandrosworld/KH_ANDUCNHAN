import { useState, useMemo } from 'react';
import { usePageTitle } from '../hooks/usePageTitle';
import { Search, MapPin, Building2, Calendar, Users, ChevronDown } from 'lucide-react';
import PageShell from '../components/PageShell';
import { useLanguage } from '../contexts/LanguageContext';
import type { Project, ProjectStatus } from '../types/types';

// ─── Mock Projects ───────────────────────────────────────────────────
const mockProjects: Project[] = [
  {
    id: 'proj-001',
    name: 'Sunset Estates',
    developer: 'Pacific Development Group',
    location: 'Malibu, California',
    description: 'Luxury beachfront community featuring 48 oceanview residences with private beach access, infinity pools, and smart home technology.',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
    status: 'under-construction',
    units: 48,
    priceRange: '$1.2M – $3.8M',
    numericPriceMin: 1200000,
    numericPriceMax: 3800000,
    area: '2,400 – 5,200 sqft',
    completionDate: 'Q4 2027',
    amenities: ['Beach Access', 'Pool', 'Gym', 'Concierge', 'Smart Home'],
  },
  {
    id: 'proj-002',
    name: 'The Grand Residences',
    developer: 'Metro Urban Corp.',
    location: 'Manhattan, New York',
    description: 'Ultra-premium high-rise condominiums in the heart of Midtown with floor-to-ceiling windows, Hudson River views, and world-class amenities.',
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
    status: 'pre-sale',
    units: 120,
    priceRange: '$2.5M – $12M',
    numericPriceMin: 2500000,
    numericPriceMax: 12000000,
    area: '1,800 – 6,000 sqft',
    completionDate: 'Q2 2028',
    amenities: ['Doorman', 'Rooftop', 'Spa', 'Theater', 'Wine Cellar'],
  },
  {
    id: 'proj-003',
    name: 'Coral Bay Villas',
    developer: 'Sunshine Realty Partners',
    location: 'Boca Raton, Florida',
    description: 'Waterfront villa community with private docks, saltwater pools, and Mediterranean-inspired architecture surrounded by lush tropical landscaping.',
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80',
    status: 'completed',
    units: 32,
    priceRange: '$950K – $2.1M',
    numericPriceMin: 950000,
    numericPriceMax: 2100000,
    area: '2,800 – 4,500 sqft',
    completionDate: 'Completed',
    amenities: ['Private Dock', 'Pool', 'Clubhouse', 'Tennis', 'Marina'],
  },
  {
    id: 'proj-004',
    name: 'Highland Park Commons',
    developer: 'Lone Star Development',
    location: 'Austin, Texas',
    description: 'Modern townhome community in the vibrant SoCo district with rooftop decks, energy-efficient design, and walkable neighborhood amenities.',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
    status: 'under-construction',
    units: 64,
    priceRange: '$485K – $720K',
    numericPriceMin: 485000,
    numericPriceMax: 720000,
    area: '1,600 – 2,400 sqft',
    completionDate: 'Q1 2027',
    amenities: ['Rooftop Deck', 'Dog Park', 'EV Charging', 'Coworking'],
  },
  {
    id: 'proj-005',
    name: 'Lakewood Reserve',
    developer: 'Great Lakes Properties',
    location: 'Chicago, Illinois',
    description: 'Exclusive lakefront estate lots with custom home options, private marina access, and a members-only country club with championship golf course.',
    image: 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&q=80',
    status: 'pre-sale',
    units: 24,
    priceRange: '$1.8M – $4.5M',
    numericPriceMin: 1800000,
    numericPriceMax: 4500000,
    area: '3,500 – 7,000 sqft',
    completionDate: 'Q3 2028',
    amenities: ['Marina', 'Golf', 'Country Club', 'Trails', 'Security'],
  },
  {
    id: 'proj-006',
    name: 'Desert Oasis',
    developer: 'Sunbelt Communities',
    location: 'Scottsdale, Arizona',
    description: 'Contemporary desert living with mountain views, resort-style amenities, and sustainable xeriscaping in a gated community setting.',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
    status: 'sold-out',
    units: 40,
    priceRange: '$650K – $1.2M',
    numericPriceMin: 650000,
    numericPriceMax: 1200000,
    area: '2,200 – 3,800 sqft',
    completionDate: 'Completed',
    amenities: ['Pool', 'Spa', 'Trails', 'Gated', 'Mountain Views'],
  },
  {
    id: 'proj-007',
    name: 'Harbor View Towers',
    developer: 'Pacific Rim Developers',
    location: 'Seattle, Washington',
    description: 'Mixed-use waterfront towers with luxury condos, artisan retail, and panoramic Puget Sound views from every residence.',
    image: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80',
    status: 'under-construction',
    units: 200,
    priceRange: '$550K – $2.8M',
    numericPriceMin: 550000,
    numericPriceMax: 2800000,
    area: '800 – 3,200 sqft',
    completionDate: 'Q2 2027',
    amenities: ['Concierge', 'Rooftop Bar', 'Fitness', 'Dog Wash', 'EV Charging'],
  },
];

// ─── Status Config ───────────────────────────────────────────────────
const STATUS_CONFIG: Record<ProjectStatus, { labelKey: string; color: string }> = {
  'pre-sale': { labelKey: 'projects.preSale', color: 'bg-purple-500/15 text-purple-400 border-purple-500/20' },
  'under-construction': { labelKey: 'projects.underConstruction', color: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
  completed: { labelKey: 'projects.completed', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  'sold-out': { labelKey: 'projects.soldOut', color: 'bg-red-500/15 text-red-400 border-red-500/20' },
};

const STATUS_FILTERS: { key: ProjectStatus | 'all'; labelKey: string }[] = [
  { key: 'all', labelKey: 'projects.allProjects' },
  { key: 'pre-sale', labelKey: 'projects.preSale' },
  { key: 'under-construction', labelKey: 'projects.underConstruction' },
  { key: 'completed', labelKey: 'projects.completed' },
  { key: 'sold-out', labelKey: 'projects.soldOut' },
];

// ─── Component ───────────────────────────────────────────────────────
const ProjectsPage = () => {
  const { t } = useLanguage();
  usePageTitle(t('projects.title'));
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const statusFilterLabel = t(STATUS_FILTERS.find((f) => f.key === statusFilter)?.labelKey || 'projects.allProjects');
  const projectArea = (area: string) => area.replace('sqft', t('prop.sqft')).replace(/–/g, '-');
  const projectCompletionDate = (date: string) => date === 'Completed' ? t('projects.completed') : date;

  const filtered = useMemo(() => {
    return mockProjects.filter((p) => {
      // Status filter
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      // Text search
      if (query.trim()) {
        const q = query.toLowerCase().trim();
        return (
          p.name.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q) ||
          p.developer.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [query, statusFilter]);

  return (
    <PageShell raw>
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#15151D] via-[#0a0a10] to-[#030405]" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              'radial-gradient(ellipse at 30% 20%, rgba(184,135,23,0.15), transparent 50%), radial-gradient(ellipse at 70% 60%, rgba(82,64,180,0.1), transparent 50%)',
          }}
        />
        <div className="relative z-10 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto pt-12 sm:pt-16 pb-8 sm:pb-10 min-w-0">
          <h1
            className="hero-gold-text font-extrabold mb-2 leading-tight break-words"
            style={{ fontSize: 'clamp(26px, 5vw, 40px)' }}
          >
            {t('projects.title')}
          </h1>
          <p className="text-[#A7ABB6] text-[14px] sm:text-[16px] leading-relaxed break-words max-w-[600px]">
            {t('projects.subtitleFull')}
          </p>
        </div>
      </div>

      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 min-w-0 pb-28 lg:pb-16">
        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7D8291]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('projects.searchPlaceholder')}
              className="w-full bg-[#15151D] border border-white/[0.085] rounded-xl text-[#F5F0E6] placeholder-[#7D8291] pl-10 pr-4 py-3 text-sm focus:border-[#B88717]/50 focus:outline-none transition-colors min-w-0"
            />
          </div>

          {/* Status Filter */}
          <div className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#15151D] border border-white/[0.085] text-[#D7DAE3] text-sm hover:border-[#B88717]/30 transition-colors whitespace-nowrap"
            >
              {statusFilterLabel}
              <ChevronDown className={`h-4 w-4 transition-transform ${showStatusMenu ? 'rotate-180' : ''}`} />
            </button>
            {showStatusMenu && (
              <div className="absolute z-20 right-0 top-full mt-1 bg-[#15151D] border border-white/[0.12] rounded-xl shadow-2xl p-2 min-w-[180px]">
                {STATUS_FILTERS.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => {
                      setStatusFilter(f.key);
                      setShowStatusMenu(false);
                    }}
                    className={`block w-full text-left px-3 py-2 rounded-lg text-[13px] transition-colors ${
                      statusFilter === f.key
                        ? 'bg-[#B88717]/15 text-[#F6D37A]'
                        : 'text-[#D7DAE3] hover:bg-white/[0.06]'
                    }`}
                  >
                    {t(f.labelKey)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Results count */}
        <div className="text-[13px] text-[#7D8291] mb-4">
          {filtered.length} {filtered.length === 1 ? t('projects.projectSingular') : t('projects.projectPlural')}
          {query.trim() && (
            <span>
              {' '}{t('projects.matching')} "<span className="text-[#D7DAE3]">{query.trim()}</span>"
            </span>
          )}
        </div>

        {/* Project Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((project) => {
              const statusCfg = STATUS_CONFIG[project.status];
              return (
                <div
                  key={project.id}
                  className="bg-[#15151D] rounded-xl overflow-hidden border border-white/[0.085] shadow-[0_22px_52px_rgba(0,0,0,0.42)] hover:border-[#B88717]/45 transition-colors duration-200 flex flex-col"
                >
                  {/* Image */}
                  <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                    <img
                      src={project.image}
                      alt={project.name}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                    />
                    <span
                      className={`absolute top-3 left-3 inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusCfg.color}`}
                    >
                      {t(statusCfg.labelKey)}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-4 sm:p-5 flex flex-col gap-3 flex-1 min-w-0">
                    <h3 className="text-[#F6D37A] font-bold text-[17px] sm:text-[18px] leading-tight break-words">
                      {project.name}
                    </h3>

                    <div className="flex items-center gap-1.5 text-[#A7ABB6] text-[13px]">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="break-words">{project.location}</span>
                    </div>

                    <p className="text-[#7D8291] text-[13px] leading-relaxed line-clamp-2 break-words">
                      {project.description}
                    </p>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 mt-auto pt-3 border-t border-white/[0.06]">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-[#B88717]" />
                        <span className="text-[#D7DAE3] text-[12px]">{project.units} {t('projects.units')}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-[#B88717]" />
                        <span className="text-[#D7DAE3] text-[12px]">{projectCompletionDate(project.completionDate)}</span>
                      </div>
                      <div className="col-span-2 flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-[#B88717]" />
                        <span className="text-[#D7DAE3] text-[12px]">{project.developer}</span>
                      </div>
                    </div>

                    {/* Price Range */}
                    <div className="bg-[#B88717]/10 border border-[#B88717]/20 rounded-lg px-3 py-2">
                      <div className="text-[11px] text-[#7D8291] uppercase tracking-wide mb-0.5">{t('projects.priceRange')}</div>
                      <div className="text-[#F6D37A] font-bold text-[15px]">{project.priceRange}</div>
                      <div className="text-[#A7ABB6] text-[11px]">{projectArea(project.area)}</div>
                    </div>

                    {/* Amenities */}
                    <div className="flex flex-wrap gap-1.5">
                      {project.amenities.slice(0, 4).map((a) => (
                        <span
                          key={a}
                          className="px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[#A7ABB6] text-[10px] font-medium"
                        >
                          {a}
                        </span>
                      ))}
                      {project.amenities.length > 4 && (
                        <span className="px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[#7D8291] text-[10px]">
                          +{project.amenities.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#15151D] border border-white/[0.085] flex items-center justify-center mb-4">
              <Building2 className="h-7 w-7 text-[#7D8291]" />
            </div>
            <h2 className="text-[20px] font-bold text-[#F6D37A] mb-2">{t('projects.noFound')}</h2>
            <p className="text-[14px] text-[#7D8291] max-w-[400px] mb-5 break-words">
              {t('projects.noMatches')}
            </p>
            <button
              onClick={() => {
                setQuery('');
                setStatusFilter('all');
              }}
              className="px-5 py-2.5 rounded-full bg-[#B88717] hover:bg-[#D4A020] text-[#030405] font-semibold text-[13px] transition-colors shadow-[0_8px_20px_rgba(184,135,23,0.25)]"
            >
              {t('btn.clearFilters')}
            </button>
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default ProjectsPage;
