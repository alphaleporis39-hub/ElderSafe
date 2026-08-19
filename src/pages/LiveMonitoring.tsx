import React from 'react';
import { useDemo } from '../context/DemoContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Eye, Heart, Radio } from 'lucide-react';

export const LiveMonitoring: React.FC = () => {
  const { safetyStatus, sensors, statusText } = useDemo();

  // Deduce current location of the elder from context state
  const getCurrentLocation = () => {
    const textUpper = statusText.toUpperCase();
    if (textUpper.includes('BATHROOM') || textUpper.includes('FALL')) return 'Bathroom';
    if (textUpper.includes('BEDROOM') || textUpper.includes('INACTIVITY')) return 'Bedroom';
    if (textUpper.includes('KITCHEN') || textUpper.includes('MEDICATION') || textUpper.includes('MEDICINE')) return 'Kitchen';
    if (textUpper.includes('DOOR') || textUpper.includes('ENTRANCE')) return 'Entrance';
    return 'Living Room'; // Default
  };

  const currentRoom = getCurrentLocation();

  // Helper to extract sensor info
  const getRoomSensor = (roomName: string) => {
    switch (roomName) {
      case 'Bedroom':
        return sensors.find(s => s.id === 's3');
      case 'Bathroom':
        // Wearable acts as fall/activity detector for bathroom, or mock a Bathroom PIR
        return { name: 'Bathroom Assist', status: safetyStatus === 'CRITICAL' ? 'Active' : 'Online', battery: 85, lastUpdate: 'Just now' };
      case 'Kitchen':
        return sensors.find(s => s.id === 's5');
      case 'Living Room':
        return sensors.find(s => s.id === 's4');
      case 'Entrance':
        return sensors.find(s => s.id === 's6');
      default:
        return undefined;
    }
  };

  const rooms = [
    { name: 'Bedroom', size: 'col-span-1 row-span-1', color: 'bg-primary-50/20' },
    { name: 'Bathroom', size: 'col-span-1 row-span-1', color: 'bg-rose-50/10' },
    { name: 'Living Room', size: 'col-span-1 row-span-1 md:col-span-2', color: 'bg-navy-50/20' },
    { name: 'Kitchen', size: 'col-span-1 row-span-1', color: 'bg-amber-50/10' },
    { name: 'Entrance', size: 'col-span-1 md:col-span-3', color: 'bg-emerald-50/10' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl border border-navy-200 dark:border-navy-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Eye className="text-primary-500" size={28} />
            Live Home Monitoring
          </h1>
          <p className="text-navy-500 dark:text-navy-400 mt-1 font-medium">
            Visual spatial telemetry and room status indicators.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" className="px-3 py-1 font-bold">
            Live Stream
          </Badge>
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Spatial Home Layout Blueprint */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle className="text-xl">Home Layout Blueprint</CardTitle>
              <CardDescription>Spatial telemetry distribution (Mohan's active room is highlighted)</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold text-navy-500">
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Active/Normal</span>
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Inactive/Deviation</span>
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Emergency Alert</span>
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-primary-650" /> Mohan's Location</span>
            </div>
          </CardHeader>
          <CardContent className="pb-6">
            
            {/* House Blueprint Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-4 border-dashed border-navy-200 dark:border-navy-800 rounded-3xl p-6 bg-navy-50/50 dark:bg-navy-900/10 min-h-[420px]">
              {rooms.map((room) => {
                const sensor = getRoomSensor(room.name);
                const isElderHere = currentRoom === room.name;
                const isRoomCritical = safetyStatus === 'CRITICAL' && room.name === currentRoom;
                const isRoomWarning = safetyStatus === 'WARNING' && room.name === currentRoom;
                
                return (
                  <div
                    key={room.name}
                    className={`relative p-5 rounded-2xl border-2 transition-all duration-300 flex flex-col justify-between overflow-hidden ${room.size} ${
                      isRoomCritical
                        ? 'border-rose-500 bg-rose-50/40 dark:bg-rose-955/10 shadow-lg shadow-rose-100 dark:shadow-none'
                        : isRoomWarning
                        ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-955/10 shadow-md shadow-amber-100'
                        : isElderHere
                        ? 'border-primary-600 bg-primary-50/30 dark:bg-primary-950/10'
                        : 'border-navy-200 bg-white dark:bg-navy-900 dark:border-navy-800'
                    }`}
                  >
                    
                    {/* Header */}
                    <div className="flex justify-between items-start z-10">
                      <div>
                        <h4 className="text-base font-extrabold text-navy-800 dark:text-navy-100">{room.name}</h4>
                        <span className="text-[10px] text-navy-400 dark:text-navy-500 font-bold uppercase tracking-wider block mt-0.5">
                          {sensor?.name || 'Passive Zone'}
                        </span>
                      </div>
                      
                      {/* Active Indicator Pulse */}
                      {isElderHere && (
                        <div className="flex items-center gap-1.5 bg-primary-100 text-primary-600 dark:bg-primary-950 dark:text-primary-400 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider animate-pulse">
                          <Heart size={10} className="fill-primary-600 dark:fill-primary-400" />
                          Elder Present
                        </div>
                      )}
                    </div>

                    {/* Sensor Telemetry */}
                    <div className="mt-8 flex justify-between items-end z-10">
                      <div className="space-y-1">
                        <span className="text-[10px] text-navy-400 font-bold block uppercase tracking-wider">Telemetry:</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`h-2 w-2 rounded-full ${
                            isRoomCritical
                              ? 'bg-rose-600 pulse-red'
                              : isRoomWarning
                              ? 'bg-amber-500 pulse-amber'
                              : sensor?.status === 'Offline'
                              ? 'bg-navy-400'
                              : 'bg-emerald-500 pulse-green'
                          }`} />
                          <span className="text-xs font-bold text-navy-700 dark:text-navy-350">
                            {isRoomCritical ? 'CRITICAL ALERT' : isRoomWarning ? 'WARNING ALERT' : sensor?.status || 'Online'}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        {sensor?.battery !== undefined && (
                          <span className="text-[10px] text-navy-500 font-semibold block">
                            🔋 {sensor.battery}% battery
                          </span>
                        )}
                        <span className="text-[10px] text-navy-400 block mt-0.5">
                          Updated: {sensor?.lastUpdate || 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Background Visual Wave/Pulse */}
                    {isElderHere && (
                      <div className={`absolute bottom-0 right-0 h-24 w-24 rounded-full filter blur-xl opacity-20 -mr-6 -mb-6 ${
                        isRoomCritical ? 'bg-rose-500 animate-ping' : isRoomWarning ? 'bg-amber-500' : 'bg-primary-500'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Location Telemetry Sidebar */}
        <div className="space-y-6">
          
          {/* Active Wearable Status */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="text-lg">Elder Wearable Link</CardTitle>
                <CardDescription>Telemetry diagnostic</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-navy-50 dark:bg-navy-850 rounded-2xl border border-navy-105 dark:border-navy-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-primary-100 dark:bg-primary-950 p-2.5 rounded-xl text-primary-500 dark:text-primary-400 border border-primary-200 dark:border-primary-800">
                    <Heart size={20} className="stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-navy-800 dark:text-navy-100">ElderSafe Smart Band</h4>
                    <span className="text-xs text-emerald-650 font-bold block mt-0.5">Connected</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-navy-900 dark:text-white">82%</span>
                  <span className="text-[10px] text-navy-400 font-bold block uppercase">Battery</span>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold text-navy-500">Heart Rate (Avg)</span>
                  <span className="font-bold text-navy-800 dark:text-navy-200">74 bpm (Normal)</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold text-navy-500">Skin Temp (Avg)</span>
                  <span className="font-bold text-navy-800 dark:text-navy-200">36.6 °C</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold text-navy-500">Wearer Position</span>
                  <span className="font-bold text-navy-800 dark:text-navy-200">
                    {safetyStatus === 'CRITICAL' ? 'Horizontal (Reclined)' : 'Vertical (Upright)'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold text-navy-500">Step Count Today</span>
                  <span className="font-bold text-navy-800 dark:text-navy-200">2,410 steps</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gateway Status Panel */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="text-lg">Gateway Network</CardTitle>
                <CardDescription>ESP32 Bluetooth-WiFi Hub</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-navy-500">RF Gateway Signal</span>
                <Badge variant={safetyStatus === 'CRITICAL' && statusText.includes('Gateway') ? 'danger' : 'success'} className="font-bold font-mono">
                  {safetyStatus === 'CRITICAL' && statusText.includes('Gateway') ? 'DISCONNECTED' : 'EXCELLENT (-58dBm)'}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-navy-500">WiFi Network Status</span>
                <span className="font-bold text-navy-800 dark:text-navy-200">Connected (ElderSafe_5G)</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-navy-500">Active Sensors Linked</span>
                <span className="font-bold text-navy-800 dark:text-navy-200">6 Sensors Active</span>
              </div>
              
              <div className="bg-primary-50/50 dark:bg-primary-950/20 border border-primary-100/50 dark:border-primary-900/50 rounded-xl p-3 flex items-start gap-2.5">
                <Radio className="text-primary-500 mt-0.5" size={16} />
                <span className="text-[10px] text-primary-800 dark:text-primary-300 font-medium leading-normal">
                  Gateway scans BLE advertising packages from Wearable, checking RSSI thresholds to detect room-level localization.
                </span>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  );
};
