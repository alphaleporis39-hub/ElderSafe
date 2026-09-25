import React, { useState } from 'react';
import { useDemo } from '../context/DemoContext';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { PageHeader } from '../components/ui/Primitives';
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
      return 'text-rose-400 bg-rose-500/10 border-rose-500/25';
    }
    if (severity === 'warning') {
      return 'text-amber-400 bg-amber-500/10 border-amber-500/25';
    }
    return 'text-primary-400 bg-primary-500/10 border-primary-500/25';
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <PageHeader
        icon={<Clock className="text-primary-400" size={20} />}
        title="Activity Timeline"
        description="Daily logs and routine history compiled from wireless telemetry."
      />

      {/* Filter Tabs Row */}
      <div className="flex flex-wrap items-center gap-2 bg-navy-900 p-3 rounded-xl border border-navy-800">
        <span className="text-xs font-semibold uppercase text-navy-500 flex items-center gap-1.5 px-2">
          <ListFilter size={14} /> Filter Feed:
        </span>
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filter === 'all'
              ? 'bg-primary-600 text-white'
              : 'text-navy-400 hover:bg-navy-800 hover:text-navy-200'
          }`}
        >
          All Activities
        </button>
        <button
          onClick={() => setFilter('movement')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filter === 'movement'
              ? 'bg-primary-600 text-white'
              : 'text-navy-400 hover:bg-navy-800 hover:text-navy-200'
          }`}
        >
          PIR Movement
        </button>
        <button
          onClick={() => setFilter('medication')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filter === 'medication'
              ? 'bg-primary-600 text-white'
              : 'text-navy-400 hover:bg-navy-800 hover:text-navy-200'
          }`}
        >
          Medications
        </button>
        <button
          onClick={() => setFilter('sensor')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filter === 'sensor'
              ? 'bg-primary-600 text-white'
              : 'text-navy-400 hover:bg-navy-800 hover:text-navy-200'
          }`}
        >
          Device Updates
        </button>
        <button
          onClick={() => setFilter('alert')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filter === 'alert'
              ? 'bg-primary-600 text-white'
              : 'text-navy-400 hover:bg-navy-800 hover:text-navy-200'
          }`}
        >
          Security Alerts
        </button>
      </div>

      {/* Main Timeline Card */}
      <Card>
        <CardContent className="p-6 md:p-8">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12 text-navy-500 font-medium text-sm">
              No matching activity events logged for today.
            </div>
          ) : (
            <div className="relative pl-8 md:pl-10 border-l border-navy-800 space-y-8 py-4">
              {filteredEvents.map((event) => {
                const Icon = getEventIcon(event.activity, event.type);

                return (
                  <div key={event.id} className="relative">
                    
                    {/* Time Marker Dot */}
                    <div className={`absolute -left-[45px] md:-left-[49px] top-1.5 p-2 rounded-md border-4 border-navy-950 ${getEventIconColor(event.severity, event.type)}`}>
                      <Icon size={14} />
                    </div>

                    <div className="bg-navy-900 border border-navy-800 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-white leading-tight">
                            {event.activity}
                          </span>
                          <Badge variant={event.severity === 'critical' ? 'danger' : event.severity === 'warning' ? 'warning' : 'success'} className="text-[9px] font-semibold tracking-wider px-2">
                            {event.severity.toUpperCase()}
                          </Badge>
                        </div>
                        
                        <div className="flex gap-2 text-xs text-navy-400">
                          <span>Location: <strong className="text-navy-300 font-medium">{event.location}</strong></span>
                          <span>•</span>
                          <span>Category: <strong className="text-navy-300 font-medium capitalize">{event.type}</strong></span>
                        </div>
                      </div>

                      {/* Time timestamp label */}
                      <div className="flex items-center gap-1.5 self-start sm:self-center bg-navy-950 px-3 py-1.5 rounded-md border border-navy-800">
                        <Clock size={13} className="text-navy-500" />
                        <span className="text-sm font-mono font-medium text-navy-200">{event.time}</span>
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
