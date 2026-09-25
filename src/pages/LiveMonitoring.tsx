import React from 'react';
import { useDemo } from '../context/DemoContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { PageHeader } from '../components/ui/Primitives';
import { Eye, Heart, Radio, Cpu, Wifi, WifiOff, Clock } from 'lucide-react';

export const LiveMonitoring: React.FC = () => {
  const { safetyStatus, sensors, statusText, timeline, dataMode, elderProfile } = useDemo();

  const getCurrentLocation = () => {
    const textUpper = statusText.toUpperCase();
    if (textUpper.includes('BATHROOM') || textUpper.includes('FALL')) return 'Bathroom';
    if (textUpper.includes('BEDROOM') || textUpper.includes('INACTIVITY')) return 'Bedroom';
    if (textUpper.includes('KITCHEN') || textUpper.includes('MEDICATION') || textUpper.includes('MEDICINE')) return 'Kitchen';
    if (textUpper.includes('DOOR') || textUpper.includes('ENTRANCE')) return 'Entrance';
    return 'Living Room';
  };

  const currentRoom = getCurrentLocation();

  const getRoomSensor = (roomName: string) => {
    switch (roomName) {
      case 'Bedroom':
        return sensors.find(s => s.id === 's3');
      case 'Kitchen':
        return sensors.find(s => s.id === 's5');
      case 'Living Room':
        return sensors.find(s => s.id === 's4');
      case 'Entrance':
        return sensors.find(s => s.id === 's6');
      case 'Bathroom':
        return sensors.find(s => s.name.includes('Wearable'));
      default:
        return undefined;
    }
  };

  const rooms = [
    { name: 'Bedroom' },
    { name: 'Bathroom' },
    { name: 'Living Room' },
    { name: 'Kitchen' },
    { name: 'Entrance' },
  ];

  const gateway = sensors.find(s => s.name.includes('Gateway') || s.name.includes('ESP32'));
  const wearable = sensors.find(s => s.name.includes('Wearable'));
  const onlineCount = sensors.filter(s => s.status === 'Online' || s.status === 'Active').length;
  const isGatewayOffline = gateway?.status === 'Offline';

  const systemStatus =
    safetyStatus === 'CRITICAL' ? 'CRITICAL' : safetyStatus === 'WARNING' ? 'ATTENTION' : 'NORMAL';

  return (
    <div className="space-y-5">
      <PageHeader
        icon={<Eye className="text-primary-400" size={20} />}
        title="Live Monitoring"
        description="Room map, device links, and live event stream from application state."
        actions={
          <>
            {dataMode === 'demo' && (
              <Badge variant="warning">DEMO DATA</Badge>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-navy-700 bg-navy-900 text-[11px] font-semibold text-navy-200">
              <span className={`w-1.5 h-1.5 rounded-full ${safetyStatus === 'SAFE' ? 'bg-emerald-500 pulse-green' : safetyStatus === 'WARNING' ? 'bg-amber-500 pulse-amber' : 'bg-rose-500 pulse-red'}`} />
              {systemStatus}
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-navy-700 bg-navy-900 text-[11px] font-medium text-navy-300">
              <Cpu size={12} />
              {gateway ? (isGatewayOffline ? 'Gateway offline' : 'Gateway online') : 'No gateway'}
            </div>
          </>
        }
      />

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Room map */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Home Layout</CardTitle>
              <CardDescription>
                {elderProfile.name} last associated with {currentRoom} · from status text
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2 text-[10px] text-navy-500">
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Normal</span>
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Attention</span>
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> Critical</span>
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-primary-500" /> Elder zone</span>
            </div>
          </CardHeader>
          <CardContent className="pb-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border border-dashed border-navy-700 rounded-lg p-4 bg-navy-950/40 min-h-[360px]">
              {rooms.map((room) => {
                const sensor = getRoomSensor(room.name);
                const isElderHere = currentRoom === room.name;
                const isRoomCritical = safetyStatus === 'CRITICAL' && isElderHere;
                const isRoomWarning = safetyStatus === 'WARNING' && isElderHere;
                const sensorOffline = sensor?.status === 'Offline';

                return (
                  <div
                    key={room.name}
                    className={`relative p-4 rounded-lg border transition-colors flex flex-col justify-between min-h-[140px] ${
                      room.name === 'Living Room' ? 'md:col-span-2' : ''
                    } ${
                      isRoomCritical
                        ? 'border-rose-500/50 bg-rose-500/5'
                        : isRoomWarning
                        ? 'border-amber-500/40 bg-amber-500/5'
                        : isElderHere
                        ? 'border-primary-500/40 bg-primary-500/5'
                        : 'border-navy-800 bg-navy-900/60'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-white">{room.name}</h4>
                        <span className="text-[10px] text-navy-500 block mt-0.5 truncate">
                          {sensor?.name || 'Zone (no direct sensor map)'}
                        </span>
                      </div>
                      {isElderHere && (
                        <span className="flex items-center gap-1 bg-primary-500/15 text-primary-300 px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider border border-primary-500/30 shrink-0">
                          <Heart size={9} className="fill-current" />
                          Present
                        </span>
                      )}
                    </div>

                    <div className="mt-4 flex justify-between items-end gap-2">
                      <div className="space-y-1">
                        <span className="text-[9px] text-navy-600 font-semibold uppercase tracking-wider">Sensor</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            isRoomCritical
                              ? 'bg-rose-500'
                              : isRoomWarning
                              ? 'bg-amber-500'
                              : sensorOffline || !sensor
                              ? 'bg-navy-600'
                              : 'bg-emerald-500'
                          }`} />
                          <span className="text-[11px] font-medium text-navy-200">
                            {isRoomCritical
                              ? 'Critical alert zone'
                              : isRoomWarning
                              ? 'Attention zone'
                              : sensor
                              ? sensor.status
                              : 'Unmapped'}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        {sensor?.battery !== undefined && (
                          <span className="text-[10px] text-navy-500 block">
                            Battery {sensor.battery}%
                          </span>
                        )}
                        <span className="text-[10px] text-navy-600 block mt-0.5">
                          {sensor?.lastUpdate || '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Console sidebar */}
        <div className="space-y-4">
          {/* System status */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>System Status</CardTitle>
                <CardDescription>From detection engine</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-navy-400">Overall</span>
                <span className={`font-semibold ${
                  safetyStatus === 'SAFE' ? 'text-emerald-400' : safetyStatus === 'WARNING' ? 'text-amber-400' : 'text-rose-400'
                }`}>{systemStatus}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-navy-400">Status detail</span>
                <span className="font-medium text-navy-200 text-right max-w-[60%] truncate" title={statusText}>
                  {statusText}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-navy-400">Data mode</span>
                <span className="font-medium text-navy-200">
                  {dataMode === 'hardware' ? 'Live hardware' : 'Demo simulation'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-navy-400">Sensors online</span>
                <span className="font-medium text-navy-200">{onlineCount}/{sensors.length}</span>
              </div>
            </CardContent>
          </Card>

          {/* Gateway / ESP32 */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Cpu size={14} className="text-navy-500" />
                  ESP32 Gateway
                </CardTitle>
                <CardDescription>Device registry entry</CardDescription>
              </div>
              {gateway && (
                <Badge variant={gateway.status === 'Offline' ? 'danger' : 'success'}>
                  {gateway.status}
                </Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-2.5 pt-1 text-xs">
              {!gateway ? (
                <p className="text-navy-500">No gateway device registered.</p>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-navy-400">Name</span>
                    <span className="text-navy-200 font-medium">{gateway.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-navy-400">Location</span>
                    <span className="text-navy-200 font-medium">{gateway.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-navy-400">Last communication</span>
                    <span className="text-navy-200 font-medium">{gateway.lastUpdate}</span>
                  </div>
                  {gateway.battery !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-navy-400">Power</span>
                      <span className="text-navy-200 font-medium">{gateway.battery}%</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-navy-400">Link</span>
                    <span className="flex items-center gap-1.5 text-navy-200 font-medium">
                      {isGatewayOffline ? <WifiOff size={12} className="text-rose-400" /> : <Wifi size={12} className="text-emerald-400" />}
                      {isGatewayOffline ? 'Disconnected' : 'Connected'}
                    </span>
                  </div>
                </>
              )}
              {dataMode === 'demo' && (
                <p className="text-[10px] text-amber-400/90 pt-1 border-t border-navy-800">
                  DEMO/SIMULATION — values are simulated, not live hardware telemetry.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Wearable */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Heart size={14} className="text-navy-500" />
                  Wearable
                </CardTitle>
                <CardDescription>Sensor node status</CardDescription>
              </div>
              {wearable && (
                <Badge variant={wearable.status === 'Offline' ? 'danger' : 'success'}>
                  {wearable.status}
                </Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-2.5 pt-1 text-xs">
              {!wearable ? (
                <p className="text-navy-500">No wearable device registered.</p>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-navy-400">Name</span>
                    <span className="text-navy-200 font-medium">{wearable.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-navy-400">Battery</span>
                    <span className="text-navy-200 font-medium">
                      {wearable.battery !== undefined ? `${wearable.battery}%` : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-navy-400">Last update</span>
                    <span className="text-navy-200 font-medium">{wearable.lastUpdate}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Live event stream */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Radio size={14} className="text-navy-500" />
                  Live Event Stream
                </CardTitle>
                <CardDescription>Newest first · from timeline</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-1">
              {timeline.length === 0 ? (
                <p className="text-xs text-navy-500 py-3">No events yet.</p>
              ) : (
                <ul className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {timeline.slice(0, 8).map(item => (
                    <li key={item.id} className="flex items-start gap-2 text-xs py-1.5 border-b border-navy-800/60 last:border-0">
                      <span className={`mt-1 h-1.5 w-1.5 rounded-full shrink-0 ${
                        item.severity === 'critical' ? 'bg-rose-500' : item.severity === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-navy-200 truncate">{item.activity}</p>
                        <p className="text-[10px] text-navy-500 flex items-center gap-1 mt-0.5">
                          <Clock size={9} />
                          {item.time} · {item.location} · {item.type}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
