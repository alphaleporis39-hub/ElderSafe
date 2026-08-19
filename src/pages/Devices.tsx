import React, { useState } from 'react';
import { useDemo } from '../context/DemoContext';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Dialog } from '../components/ui/Dialog';
import { Badge } from '../components/ui/Badge';
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
      <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl border border-navy-200 dark:border-navy-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Cpu className="text-primary-500" size={28} />
            Hardware & Sensor Nodes
          </h1>
          <p className="text-navy-500 dark:text-navy-400 mt-1 font-medium">
            Manage gateways, wearable bands, and passive infrared telemetry modules.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Data Mode Toggle */}
          <div className="flex items-center gap-2 bg-navy-100 dark:bg-navy-800 rounded-xl px-3 py-2">
            {dataMode === 'hardware' ? (
              <Wifi size={16} className="text-emerald-500" />
            ) : (
              <WifiOff size={16} className="text-navy-400" />
            )}
            <span className="text-xs font-bold text-navy-600 dark:text-navy-300 uppercase tracking-wide">
              {dataMode === 'hardware' ? 'Live Hardware' : 'Demo Mode'}
            </span>
            <button
              onClick={() => setDataMode(dataMode === 'demo' ? 'hardware' : 'demo')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                dataMode === 'hardware' ? 'bg-emerald-500' : 'bg-navy-300 dark:bg-navy-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  dataMode === 'hardware' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-base font-extrabold shadow-md shadow-primary-100 dark:shadow-none transition-colors"
          >
            <Plus size={18} /> Register Sensor Node
          </button>
        </div>
      </div>

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
              className={`flex flex-col justify-between transition-all ${
                isOffline 
                  ? 'bg-navy-50/50 dark:bg-navy-900/30 border-navy-200 opacity-70' 
                  : 'border-navy-200'
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between w-full">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl border ${
                      isOffline
                        ? 'bg-navy-100 border-navy-200 text-navy-400 dark:bg-navy-850'
                        : isWearable
                        ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-955/20 dark:border-rose-900/30'
                        : isGateway
                        ? 'bg-primary-50 border-primary-200 text-primary-500 dark:bg-primary-955/20 dark:border-primary-900/30'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-955/20 dark:border-emerald-900/30'
                    }`}>
                      <Icon size={22} className="stroke-[2.5]" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-navy-900 dark:text-white leading-tight">
                        {sensor.name}
                      </h3>
                      <span className="text-[10px] text-navy-400 dark:text-navy-500 font-bold uppercase tracking-wider block mt-0.5">
                        Location: {sensor.location}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={isOffline ? 'default' : 'success'} className="font-bold text-[9px] px-2 py-0.5">
                      {sensor.status}
                    </Badge>
                    {isOffline && (
                      <span className="text-[9px] font-extrabold text-rose-500 uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                        Device Offline
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                
                {/* Telemetry info */}
                <div className="space-y-2 text-xs font-semibold text-navy-655 dark:text-navy-350 border-t border-navy-50 dark:border-navy-800/40 pt-4">
                  {sensor.battery !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-navy-450 dark:text-navy-500">Power Level</span>
                      <span className="flex items-center gap-1">
                        <Battery size={14} className={sensor.battery < 20 ? 'text-rose-500' : 'text-navy-400'} />
                        {sensor.battery}% battery
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-navy-450 dark:text-navy-500 font-bold uppercase text-[9px]">Last Signal Packet</span>
                    <span>{sensor.lastUpdate}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-navy-450 dark:text-navy-550 font-bold uppercase text-[9px]">Interface Link</span>
                    <span className="flex items-center gap-1">
                      <Signal size={12} className="text-navy-400" />
                      {getSignalStrength(sensor.name)}
                    </span>
                  </div>
                </div>

                {/* Connection switch toggle */}
                <div className="flex items-center justify-between border-t border-navy-50 dark:border-navy-800/40 pt-4">
                  <span className="text-xs font-extrabold text-navy-700 dark:text-navy-300">
                    {dataMode === 'hardware' ? 'Hardware Connection' : 'Connection Simulation'}
                  </span>
                  <button
                    onClick={() => toggleDeviceStatus(sensor.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      isOffline
                        ? 'bg-primary-50 border-primary-200 text-primary-600 dark:bg-primary-950 dark:text-primary-400 hover:bg-primary-100'
                        : 'bg-navy-50 border-navy-200 text-navy-600 dark:bg-navy-800 dark:border-navy-700 dark:text-navy-300 hover:bg-navy-100'
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
            <label className="block text-sm font-bold text-navy-700 dark:text-navy-200 mb-1.5">
              Device Identifier / Name
            </label>
            <input 
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Bathroom PIR, Corridor Sensor"
              className="w-full px-4.5 py-2.5 rounded-xl border border-navy-250 dark:border-navy-750 bg-navy-50 dark:bg-navy-855 text-navy-900 dark:text-white placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-navy-700 dark:text-navy-200 mb-1.5">
                Location Room
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4.5 py-2.5 rounded-xl border border-navy-250 dark:border-navy-750 bg-navy-50 dark:bg-navy-850 text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-semibold"
              >
                <option value="Living Room">Living Room</option>
                <option value="Bedroom">Bedroom</option>
                <option value="Bathroom">Bathroom</option>
                <option value="Kitchen">Kitchen</option>
                <option value="Entrance">Entrance</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-navy-700 dark:text-navy-200 mb-1.5">
                Initial Battery (%)
              </label>
              <input 
                type="number"
                min="0"
                max="100"
                value={battery}
                onChange={(e) => setBattery(Number(e.target.value))}
                className="w-full px-4.5 py-2.5 rounded-xl border border-navy-250 dark:border-navy-750 bg-navy-50 dark:bg-navy-850 text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-semibold"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-navy-100 dark:border-navy-800 pt-4 mt-6">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2.5 border border-navy-200 dark:border-navy-700 text-navy-700 dark:text-navy-300 hover:bg-navy-50 dark:hover:bg-navy-800 rounded-xl text-sm font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-extrabold shadow-sm"
            >
              Link Node Hardware
            </button>
          </div>
        </form>
      </Dialog>

    </div>
  );
};
