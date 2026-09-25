import React, { useState } from 'react';
import { useDemo } from '../context/DemoContext';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Dialog } from '../components/ui/Dialog';
import { Badge } from '../components/ui/Badge';
import { PageHeader } from '../components/ui/Primitives';
import { Cpu, Heart, Plus, Radio, Signal, Battery, Wifi, WifiOff } from 'lucide-react';

export const Devices: React.FC = () => {
  const { sensors, addDevice, toggleDeviceStatus, dataMode, setDataMode } = useDemo();

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('Living Room');
  const [battery, setBattery] = useState(100);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addDevice({
      name,
      status: 'Online',
      lastUpdate: 'Just now',
      battery: battery > 0 ? battery : undefined,
      location
    });

    setModalOpen(false);
    setName('');
  };

  const getDeviceIcon = (deviceName: string) => {
    if (deviceName.includes('Wearable')) return Heart;
    if (deviceName.includes('Gateway')) return Cpu;
    return Radio; // PIR/Door
  };

  const getSignalStrength = (deviceName: string) => {
    if (deviceName.includes('Gateway')) return 'Direct Fiber';
    if (deviceName.includes('Wearable')) return 'BLE (Excellent)';
    return 'LoRa / Zigbee (Good)';
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <PageHeader
        icon={<Cpu className="text-primary-500" size={28} />}
        title="Hardware & Sensor Nodes"
        description="Manage gateways, wearable bands, and passive infrared telemetry modules."
        actions={
          <>
            {/* Data Mode Toggle */}
            <div className="flex items-center gap-2 bg-navy-900 rounded-lg px-3 py-2 border border-navy-800">
              {dataMode === 'hardware' ? (
                <Wifi size={14} className="text-emerald-400" />
              ) : (
                <WifiOff size={14} className="text-navy-500" />
              )}
              <span className="text-xs font-semibold text-navy-300 uppercase tracking-wide">
                {dataMode === 'hardware' ? 'Live Hardware' : 'Demo Mode'}
              </span>
              <button
                onClick={() => setDataMode(dataMode === 'demo' ? 'hardware' : 'demo')}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  dataMode === 'hardware' ? 'bg-emerald-600' : 'bg-navy-700'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    dataMode === 'hardware' ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              <Plus size={16} /> Register Sensor Node
            </button>
          </>
        }
      />

      {/* Grid of Devices */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sensors.map((sensor) => {
          const Icon = getDeviceIcon(sensor.name);
          const isOffline = sensor.status === 'Offline';
          const isWearable = sensor.name.includes('Wearable');
          const isGateway = sensor.name.includes('Gateway');

          return (
            <Card 
              key={sensor.id} 
              className={`flex flex-col justify-between transition-colors ${
                isOffline 
                  ? 'bg-navy-950/50 border-navy-800 opacity-70' 
                  : 'border-navy-800'
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between w-full">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-md border ${
                      isOffline
                        ? 'bg-navy-800 border-navy-700 text-navy-500'
                        : isWearable
                        ? 'bg-rose-500/10 border-rose-500/25 text-rose-400'
                        : isGateway
                        ? 'bg-primary-500/10 border-primary-500/25 text-primary-400'
                        : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                    }`}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white leading-tight">
                        {sensor.name}
                      </h3>
                      <span className="text-[10px] text-navy-500 font-semibold uppercase tracking-wider block mt-0.5">
                        Location: {sensor.location}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={isOffline ? 'default' : 'success'} className="font-semibold text-[9px] px-2 py-0.5">
                      {sensor.status}
                    </Badge>
                    {isOffline && (
                      <span className="text-[9px] font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                        Device Offline
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                
                {/* Telemetry info */}
                <div className="space-y-2 text-xs text-navy-300 border-t border-navy-800 pt-4">
                  {sensor.battery !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-navy-500">Power Level</span>
                      <span className="flex items-center gap-1">
                        <Battery size={14} className={sensor.battery < 20 ? 'text-rose-400' : 'text-navy-400'} />
                        {sensor.battery}% battery
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-navy-500 font-semibold uppercase text-[9px]">Last Signal Packet</span>
                    <span>{sensor.lastUpdate}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-navy-500 font-semibold uppercase text-[9px]">Interface Link</span>
                    <span className="flex items-center gap-1">
                      <Signal size={12} className="text-navy-400" />
                      {getSignalStrength(sensor.name)}
                    </span>
                  </div>
                </div>

                {/* Connection switch toggle */}
                <div className="flex items-center justify-between border-t border-navy-800 pt-4">
                  <span className="text-xs font-semibold text-navy-300">
                    {dataMode === 'hardware' ? 'Hardware Connection' : 'Connection Simulation'}
                  </span>
                  <button
                    onClick={() => toggleDeviceStatus(sensor.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors border ${
                      isOffline
                        ? 'bg-primary-500/10 border-primary-500/30 text-primary-400 hover:bg-primary-500/15'
                        : 'bg-navy-800 border-navy-700 text-navy-300 hover:bg-navy-750'
                    }`}
                  >
                    {isOffline ? 'Simulate Reconnect' : 'Simulate Offline Outage'}
                  </button>
                </div>

              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Register Dialog Form */}
      <Dialog 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        title="Register New IoT Sensor Node"
      >
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-navy-200 mb-1.5">
              Device Identifier / Name
            </label>
            <input 
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Bathroom PIR, Corridor Sensor"
              className="w-full px-4 py-2.5 rounded-lg border border-navy-700 bg-navy-950 text-white placeholder-navy-600 focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-navy-200 mb-1.5">
                Location Room
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-navy-700 bg-navy-950 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
              >
                <option value="Living Room">Living Room</option>
                <option value="Bedroom">Bedroom</option>
                <option value="Bathroom">Bathroom</option>
                <option value="Kitchen">Kitchen</option>
                <option value="Entrance">Entrance</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-navy-200 mb-1.5">
                Initial Battery (%)
              </label>
              <input 
                type="number"
                min="0"
                max="100"
                value={battery}
                onChange={(e) => setBattery(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-lg border border-navy-700 bg-navy-950 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-navy-800 pt-4 mt-6">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2.5 border border-navy-700 text-navy-300 hover:bg-navy-800 rounded-lg text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-semibold"
            >
              Link Node Hardware
            </button>
          </div>
        </form>
      </Dialog>

    </div>
  );
};
