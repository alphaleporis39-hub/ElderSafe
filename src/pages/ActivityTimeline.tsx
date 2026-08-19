import React, { useState } from 'react';
import { useDemo } from '../context/DemoContext';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { 
  Clock, 
  Bed, 
  Utensils, 
  Tv, 
  Pill, 
  DoorClosed, 
  AlertTriangle,
  Info,
  Radio,
  ListFilter
} from 'lucide-react';

export const ActivityTimeline: React.FC = () => {
  const { timeline } = useDemo();
  const [filter, setFilter] = useState<'all' | 'movement' | 'medication' | 'sensor' | 'alert'>('all');

  const filteredEvents = timeline.filter(event => {
    if (filter === 'all') return true;
    return event.type === filter;
  });

  const getEventIcon = (activity: string, type: string) => {
    const actUpper = activity.toUpperCase();
    if (type === 'alert') return AlertTriangle;
    if (type === 'medication' || actUpper.includes('MEDICINE') || actUpper.includes('BOX')) return Pill;
    if (actUpper.includes('WAKE') || actUpper.includes('BED') || actUpper.includes('SLEEP')) return Bed;
    if (actUpper.includes('KITCHEN') || actUpper.includes('LUNCH') || actUpper.includes('BREAKFAST') || actUpper.includes('COOK')) return Utensils;
    if (actUpper.includes('LIVING') || actUpper.includes('TV') || actUpper.includes('RELAX')) return Tv;
    if (actUpper.includes('DOOR') || actUpper.includes('EXIT') || actUpper.includes('WALK') || actUpper.includes('ENTRY')) return DoorClosed;
    if (type === 'sensor' || actUpper.includes('GATEWAY') || actUpper.includes('OFFLINE')) return Radio;
    return Info;
  };

  const getEventIconColor = (severity: string, type: string) => {
    if (type === 'alert' || severity === 'critical') {
      return 'text-rose-600 bg-rose-50 dark:bg-rose-955/20 border-rose-100 dark:border-rose-900/30';
    }
    if (severity === 'warning') {
      return 'text-amber-600 bg-amber-50 dark:bg-amber-955/20 border-amber-100 dark:border-amber-900/30';
    }
    return 'text-primary-650 bg-primary-50 dark:bg-primary-950/30 border-primary-100 dark:border-primary-900/35';
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl border border-navy-200 dark:border-navy-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Clock className="text-primary-650" size={28} />
            Activity Timeline
          </h1>
          <p className="text-navy-500 dark:text-navy-400 mt-1 font-medium">
            Daily logs and routine history compiled from wireless telemetry.
          </p>
        </div>
      </div>

      {/* Filter Tabs Row */}
      <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-navy-900 p-3 rounded-2xl border border-navy-200 dark:border-navy-800 shadow-sm">
        <span className="text-xs font-extrabold uppercase text-navy-400 dark:text-navy-550 flex items-center gap-1.5 px-2">
          <ListFilter size={14} /> Filter Feed:
        </span>
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            filter === 'all'
              ? 'bg-primary-600 text-white'
              : 'text-navy-650 hover:bg-navy-100 dark:text-navy-350 dark:hover:bg-navy-800'
          }`}
        >
          All Activities
        </button>
        <button
          onClick={() => setFilter('movement')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            filter === 'movement'
              ? 'bg-primary-600 text-white'
              : 'text-navy-650 hover:bg-navy-100 dark:text-navy-350 dark:hover:bg-navy-800'
          }`}
        >
          PIR Movement
        </button>
        <button
          onClick={() => setFilter('medication')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            filter === 'medication'
              ? 'bg-primary-600 text-white'
              : 'text-navy-650 hover:bg-navy-100 dark:text-navy-350 dark:hover:bg-navy-800'
          }`}
        >
          Medications
        </button>
        <button
          onClick={() => setFilter('sensor')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            filter === 'sensor'
              ? 'bg-primary-600 text-white'
              : 'text-navy-650 hover:bg-navy-100 dark:text-navy-350 dark:hover:bg-navy-800'
          }`}
        >
          Device Updates
        </button>
        <button
          onClick={() => setFilter('alert')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            filter === 'alert'
              ? 'bg-primary-600 text-white'
              : 'text-navy-650 hover:bg-navy-100 dark:text-navy-350 dark:hover:bg-navy-800'
          }`}
        >
          Security Alerts
        </button>
      </div>

      {/* Main Timeline Card */}
      <Card>
        <CardContent className="p-6 md:p-8">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12 text-navy-400 font-semibold text-sm">
              No matching activity events logged for today.
            </div>
          ) : (
            <div className="relative pl-8 md:pl-10 border-l-2 border-navy-200 dark:border-navy-800 space-y-8 py-4">
              {filteredEvents.map((event) => {
                const Icon = getEventIcon(event.activity, event.type);

                return (
                  <div key={event.id} className="relative">
                    
                    {/* Time Marker Dot */}
                    <div className={`absolute -left-[45px] md:-left-[49px] top-1.5 p-2 rounded-full border-4 border-white dark:border-navy-950 shadow-sm ${getEventIconColor(event.severity, event.type)}`}>
                      <Icon size={16} className="stroke-[2.5]" />
                    </div>

                    <div className="bg-white dark:bg-navy-900 border border-navy-105 dark:border-navy-850 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base font-extrabold text-navy-900 dark:text-white leading-tight">
                            {event.activity}
                          </span>
                          <Badge variant={event.severity === 'critical' ? 'danger' : event.severity === 'warning' ? 'warning' : 'success'} className="text-[9px] font-bold tracking-wider px-2">
                            {event.severity.toUpperCase()}
                          </Badge>
                        </div>
                        
                        <div className="flex gap-2 text-xs font-semibold text-navy-500">
                          <span>Location: <strong className="text-navy-700 dark:text-navy-400">{event.location}</strong></span>
                          <span>•</span>
                          <span>Category: <strong className="text-navy-700 dark:text-navy-400 capitalize">{event.type}</strong></span>
                        </div>
                      </div>

                      {/* Time timestamp label */}
                      <div className="flex items-center gap-1.5 self-start sm:self-center bg-navy-50 dark:bg-navy-800 px-3.5 py-1.5 rounded-xl border border-navy-100 dark:border-navy-700">
                        <Clock size={14} className="text-navy-400" />
                        <span className="text-sm font-mono font-bold text-navy-800 dark:text-navy-200">{event.time}</span>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
};
